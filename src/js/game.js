import { ACHIEVEMENTS, DIFFICULTY_PRESETS, GAME_CONFIG } from './config.js';
import { Storage } from './storage.js';
import {
  buildRoundOptions,
  evaluateAchievements,
  getCongratulationsMessage,
  optionsPerQuestion,
  roundTime,
  shuffleArray
} from './utils.js';
import { confettiBurst } from './ui.js';

export function createGameController({ state, ui, audio, settingsRef, onReturnToStart }) {
  function currentPokemon() {
    return state.shuffledPokemon[state.currentPokemonIndex];
  }

  function resetRoundTimer() {
    clearInterval(state.timer.intervalId);
    if (!settingsRef.current.timerEnabled) {
      state.timer.totalSec = 1;
      state.timer.remainingSec = 1;
      return;
    }

    state.timer.totalSec = roundTime(settingsRef.current);
    state.timer.remainingSec = state.timer.totalSec;
    ui.updateHud(state, GAME_CONFIG.totalPokemon, settingsRef.current.timerEnabled);

    state.timer.intervalId = setInterval(() => {
      state.timer.remainingSec = Math.max(0, state.timer.remainingSec - 0.05);
      ui.updateHud(state, GAME_CONFIG.totalPokemon, settingsRef.current.timerEnabled);
      if (state.timer.remainingSec <= 0) {
        clearInterval(state.timer.intervalId);
        onTimeout();
      }
    }, 50);
  }

  function saveProgress() {
    Storage.saveGameState(state);
    Storage.saveAchievements(state.unlockedAchievements);
  }

  function loadLevel() {
    if (state.currentPokemonIndex >= GAME_CONFIG.totalPokemon) {
      endGame();
      return;
    }

    state.answeredCurrentRound = false;
    const pokemon = currentPokemon();
    ui.setPokemonImage(
      pokemon.id,
      () => {
        const optionCount = optionsPerQuestion(settingsRef.current);
        const options = buildRoundOptions(state.pokemonData, pokemon, optionCount);
        ui.renderOptions(options);
        ui.lockOptions(false);
        ui.updateHud(state, GAME_CONFIG.totalPokemon, settingsRef.current.timerEnabled);
        resetRoundTimer();
      },
      () => {
        state.currentPokemonIndex += 1;
        loadLevel();
      }
    );
  }

  function applyCorrect(button) {
    const wasMilestone = state.streak > 0 && state.streak % GAME_CONFIG.bonusEveryStreak === 0;

    state.score += 1;
    state.streak += 1;

    if (wasMilestone) {
      state.score += GAME_CONFIG.bonusScore;
      ui.showBonus(GAME_CONFIG.bonusScore);
    }

    ui.showCorrect(button);
    ui.revealPokemon();
    ui.lockOptions(true);
    confettiBurst();
    audio.playCorrect();

    setTimeout(() => {
      audio.playPokemonCry(currentPokemon().id);
      audio.speakPokemonName(currentPokemon().name);
    }, 220);

    clearInterval(state.timer.intervalId);

    const { nextUnlocked, gained } = evaluateAchievements(state, state.unlockedAchievements);
    state.unlockedAchievements = nextUnlocked;
    gained.forEach((a) => ui.showAchievement(a));

    saveProgress();

    setTimeout(() => {
      state.currentPokemonIndex += 1;
      saveProgress();
      loadLevel();
    }, GAME_CONFIG.revealDelayMs);
  }

  function applyWrong(button) {
    state.failed += 1;
    state.streak = 0;
    ui.showWrong(button);
    audio.playWrong();
    ui.updateHud(state, GAME_CONFIG.totalPokemon, settingsRef.current.timerEnabled);

    setTimeout(() => {
      state.answeredCurrentRound = false;
      ui.lockOptions(false);
    }, GAME_CONFIG.wrongShakeDurationMs);

    saveProgress();
  }

  function onTimeout() {
    if (state.answeredCurrentRound) return;
    state.answeredCurrentRound = true;
    state.failed += 1;
    state.streak = 0;
    ui.toast('Tiempo agotado');
    state.currentPokemonIndex += 1;
    saveProgress();
    loadLevel();
  }

  function startGame({ forceNew = false } = {}) {
    audio.init();

    const saved = !forceNew ? Storage.loadGameState() : null;
    if (saved && saved.currentPokemonIndex < GAME_CONFIG.totalPokemon) {
      state.shuffledPokemon = saved.shuffledPokemon;
      state.currentPokemonIndex = saved.currentPokemonIndex;
      state.score = saved.score;
      state.failed = saved.failed;
      state.streak = saved.streak;
      state.unlockedAchievements = saved.unlockedAchievements || Storage.getAchievements();
    } else {
      state.shuffledPokemon = shuffleArray(state.pokemonData);
      state.currentPokemonIndex = 0;
      state.score = 0;
      state.failed = 0;
      state.streak = 0;
      state.unlockedAchievements = Storage.getAchievements();
      Storage.clearGameState();
    }

    ui.showScreen('game');
    ui.updateHud(state, GAME_CONFIG.totalPokemon, settingsRef.current.timerEnabled);
    loadLevel();
  }

  function endGame() {
    clearInterval(state.timer.intervalId);
    Storage.clearGameState();

    const isPerfect = state.score >= GAME_CONFIG.totalPokemon && state.failed === 0;
    if (isPerfect && !state.unlockedAchievements.includes(ACHIEVEMENTS.PERFECT.id)) {
      state.unlockedAchievements = [...new Set([...state.unlockedAchievements, ACHIEVEMENTS.PERFECT.id])];
      Storage.saveAchievements(state.unlockedAchievements);
    }

    const isNewRecord = Storage.setHighScore(state.score);
    const highScore = Storage.getHighScore();
    ui.updateFinal(
      state,
      highScore,
      getCongratulationsMessage(state.score, GAME_CONFIG.totalPokemon),
      isNewRecord
    );

    ui.showScreen('end');
  }

  function finishGameToStart() {
    clearInterval(state.timer.intervalId);
    Storage.clearGameState();
    state.answeredCurrentRound = false;
    onReturnToStart();
    ui.showScreen('start');
  }

  function answer(button) {
    if (state.answeredCurrentRound || button.disabled) return;
    state.answeredCurrentRound = true;

    if (button.dataset.name === currentPokemon().name) {
      applyCorrect(button);
    } else {
      applyWrong(button);
    }
  }

  function setSettings(nextSettings) {
    settingsRef.current = nextSettings;
    Storage.saveSettings(nextSettings);
    ui.applySettings(nextSettings);
    if (!document.getElementById('game-screen').classList.contains('hidden')) {
      ui.updateHud(state, GAME_CONFIG.totalPokemon, settingsRef.current.timerEnabled);
    }
  }

  function shareScore() {
    const text = `He conseguido ${state.score}/150 en Adivina el Pokemon. ¿Me superas?`;
    if (navigator.share) {
      navigator.share({ text, title: 'Adivina el Pokemon' }).catch(() => {});
      return;
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        ui.toast('Resultado copiado al portapapeles');
      })
      .catch(() => {
        ui.toast('No se pudo copiar el resultado');
      });
  }

  function difficultyLabel() {
    return DIFFICULTY_PRESETS[settingsRef.current.difficulty].label;
  }

  return {
    startGame,
    answer,
    shareScore,
    setSettings,
    difficultyLabel,
    finishGameToStart
  };
}
