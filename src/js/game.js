import { DIFFICULTY_PRESETS, GAME_CONFIG, MODES } from './config.js';
import { getPokemon, getRegion, poolForRegion } from './pokemon.js';
import { Storage } from './storage.js';
import {
  applyHit,
  applyMiss,
  buildQueue,
  buildRoundOptions,
  createPlayer,
  evaluateAchievements,
  getCongratulationsMessage,
  highScoreKey,
  isNameMatch,
  optionsPerQuestion,
  roundTimeMs,
  winnerMessage
} from './utils.js';

export function createGameController({ ui, audio, getSettings, updateSettings, onExit }) {
  let session = null;
  let phase = 'idle';
  let roundToken = 0;
  let missedThisRound = false;
  let lastResult = null;
  let unlocked = Storage.getAchievements();
  const dex = Storage.getPokedex();
  const misses = Storage.getMisses();
  const pending = new Set();

  function later(fn, ms) {
    const id = setTimeout(() => {
      pending.delete(id);
      fn();
    }, ms);
    pending.add(id);
  }

  function cancelPending() {
    roundToken += 1;
    pending.forEach(clearTimeout);
    pending.clear();
    ui.stopTimer();
  }

  const currentPokemon = () => getPokemon(session.queue[session.index]);
  const turnIndex = () => session.index % session.players.length;
  const currentPlayer = () => session.players[turnIndex()];
  const isSolo = () => session.players.length === 1;

  function save() {
    if (session.index >= session.queue.length) {
      Storage.clearGameState();
    } else {
      Storage.saveGameState(session);
    }
  }

  function refreshHud() {
    ui.updateHud({
      player: currentPlayer(),
      players: session.players,
      activeIndex: turnIndex(),
      round: Math.min(session.index + 1, session.queue.length),
      total: session.queue.length
    });
  }

  function checkAchievements(completed) {
    const solo = isSolo();
    const player = session.players[0];
    const { nextUnlocked, gained } = evaluateAchievements(
      {
        streak: solo ? player.streak : 0,
        hits: solo ? player.hits : 0,
        failed: player.failed,
        completed: solo && completed,
        rounds: session.queue.length,
        skipped: session.skipped,
        mode: session.config.mode,
        dex
      },
      unlocked
    );
    if (!gained.length) return;
    unlocked = nextUnlocked;
    Storage.saveAchievements(unlocked);
    gained.forEach((a) => ui.toast(`Logro: ${a.title}`));
  }

  function markMissed(pokemon) {
    if (missedThisRound) return;
    missedThisRound = true;
    misses[pokemon.id] = (misses[pokemon.id] || 0) + 1;
    Storage.saveMisses(misses);
  }

  function loadRound(attempt = 0) {
    cancelPending();
    if (session.index >= session.queue.length) {
      endGame();
      return;
    }

    phase = 'loading';
    missedThisRound = false;
    const token = roundToken;
    const pokemon = currentPokemon();
    ui.prepareRound(session.config.mode);
    refreshHud();
    ui.loadImage(pokemon.id, {
      onLoad: () => token === roundToken && startRound(pokemon),
      onError: () => token === roundToken && handleImageError(attempt)
    });
  }

  function handleImageError(attempt) {
    if (attempt < GAME_CONFIG.imageRetries && navigator.onLine !== false) {
      later(() => loadRound(attempt + 1), GAME_CONFIG.imageRetryDelayMs);
      return;
    }
    phase = 'paused';
    ui.showNetworkError(navigator.onLine === false);
  }

  function startRound(pokemon) {
    const { mode, difficulty, timerEnabled, region } = session.config;
    phase = 'answering';

    if (mode === 'write') {
      ui.showWriteInput();
    } else {
      const options = buildRoundOptions(
        poolForRegion(region),
        pokemon,
        optionsPerQuestion(difficulty),
        DIFFICULTY_PRESETS[difficulty].similarShare
      );
      ui.renderOptions(options);
    }

    if (mode === 'cry') {
      const token = roundToken;
      ui.showCryPrompt();
      audio.playCry(pokemon.id, {
        onError: () => {
          if (token !== roundToken) return;
          ui.showSilhouette();
          ui.toast('Sin grito: ¡adivina por la silueta!');
        }
      });
    } else {
      ui.showSilhouette();
    }

    if (timerEnabled) {
      const ms = roundTimeMs(difficulty, mode);
      ui.startTimer(ms);
      later(() => missRound('¡Tiempo!'), ms);
    }

    const nextId = session.queue[session.index + 1];
    if (nextId) ui.preloadImage(nextId);
  }

  function correct(button) {
    const pokemon = currentPokemon();
    const player = currentPlayer();
    cancelPending();
    phase = 'revealing';

    const bonus = applyHit(player);
    if (!missedThisRound && misses[pokemon.id]) {
      misses[pokemon.id] -= 1;
      if (misses[pokemon.id] <= 0) delete misses[pokemon.id];
      Storage.saveMisses(misses);
    }
    dex.add(pokemon.id);
    Storage.savePokedex(dex);

    ui.showCorrect(button, pokemon);
    if (bonus) ui.toast(`+${bonus} bonus por racha de ${player.streak}`);
    audio.playCorrect();
    later(() => audio.announce(pokemon.id, pokemon.name), 220);

    refreshHud();
    checkAchievements(false);
    session.index += 1;
    save();
    later(() => loadRound(), GAME_CONFIG.revealDelayMs);
  }

  function wrong(button) {
    const pokemon = currentPokemon();
    applyMiss(currentPlayer());
    markMissed(pokemon);
    ui.showWrong(button);
    audio.playWrong();
    refreshHud();
    save();

    phase = 'cooldown';
    later(() => {
      if (phase !== 'cooldown') return;
      phase = 'answering';
      ui.unlockOptions();
    }, GAME_CONFIG.wrongShakeDurationMs);
  }

  function missRound(message) {
    if (phase !== 'answering' && phase !== 'cooldown') return;
    const pokemon = currentPokemon();
    cancelPending();
    phase = 'revealing';

    applyMiss(currentPlayer());
    markMissed(pokemon);
    ui.showMissed(pokemon);
    ui.toast(`${message} Era ${pokemon.name}`);
    later(() => audio.announce(pokemon.id, pokemon.name), 300);

    refreshHud();
    session.index += 1;
    save();
    later(() => loadRound(), GAME_CONFIG.missedRevealDelayMs);
  }

  function begin() {
    audio.init();
    ui.setupGame(session.config, session.players);
    ui.showScreen('game');
    loadRound();
  }

  function startNew() {
    const settings = getSettings();
    const { region, rounds, mode, difficulty, timerEnabled, playerCount, playerNames } = settings;

    if (mode === 'cry' && !audio.canPlayCries) {
      ui.toast('Este navegador no reproduce los gritos');
      return;
    }
    if (mode === 'cry' && settings.muted) {
      updateSettings({ muted: false });
      ui.toast('Sonido activado para el modo Grito');
    }

    const queue = buildQueue({ pool: poolForRegion(region), rounds, mode, misses });
    if (!queue.length) {
      ui.toast('No tienes fallos que repasar en esta región');
      return;
    }

    session = {
      config: { region, rounds, mode, difficulty, timerEnabled },
      queue,
      index: 0,
      skipped: 0,
      players: playerNames.slice(0, playerCount).map(createPlayer)
    };
    save();
    begin();
  }

  function resume() {
    const saved = Storage.loadGameState();
    if (!saved) {
      startNew();
      return;
    }
    session = saved;
    begin();
  }

  function endGame() {
    cancelPending();
    phase = 'idle';
    Storage.clearGameState();

    const total = session.queue.length;
    const result = {
      config: session.config,
      players: session.players,
      total,
      skipped: session.skipped
    };

    if (isSolo()) {
      const player = session.players[0];
      const key = highScoreKey(session.config);
      result.isNewRecord = Storage.setHighScore(key, player.points);
      result.best = Storage.getHighScore(key);
      result.message = getCongratulationsMessage(player.hits, total);
      checkAchievements(true);
    } else {
      result.message = winnerMessage(session.players);
    }

    lastResult = result;
    ui.showEnd(result);
    ui.showScreen('end');
  }

  function exitToStart() {
    cancelPending();
    phase = 'idle';
    audio.stop();
    ui.cancelImage();
    ui.clearEffects();
    if (session) save();
    onExit();
    ui.showScreen('start');
  }

  function shareScore() {
    if (!lastResult) return;
    const { config, players, total } = lastResult;
    const where = `${getRegion(config.region).label}, modo ${MODES[config.mode].label}`;
    const text =
      players.length === 1
        ? `He acertado ${players[0].hits}/${total} Pokémon (${where}) en Adivina el Pokémon. ¿Me superas?`
        : `${players[0].name} ${players[0].points} - ${players[1].points} ${players[1].name} en Adivina el Pokémon (${where}).`;
    const url = `${location.origin}${location.pathname}`;

    if (navigator.share) {
      navigator.share({ title: 'Adivina el Pokémon', text, url }).catch(() => {});
      return;
    }
    navigator.clipboard
      ?.writeText(`${text} ${url}`)
      .then(() => ui.toast('Resultado copiado al portapapeles'))
      .catch(() => ui.toast('No se pudo copiar el resultado'));
  }

  return {
    startNew,
    resume,
    exitToStart,
    shareScore,

    answerOption(button) {
      if (phase !== 'answering' || button.disabled) return;
      if (button.dataset.name === currentPokemon().name) correct(button);
      else wrong(button);
    },

    answerText(text) {
      if (phase !== 'answering' || !text.trim()) return;
      if (isNameMatch(text, currentPokemon().name)) correct(null);
      else wrong(null);
    },

    giveUp() {
      missRound('¡Te rendiste!');
    },

    replayCry() {
      if (session && (phase === 'answering' || phase === 'cooldown'))
        audio.playCry(currentPokemon().id);
    },

    retryImage() {
      if (phase === 'paused') loadRound();
    },

    skipPokemon() {
      if (phase !== 'paused') return;
      session.skipped += 1;
      session.index += 1;
      save();
      loadRound();
    },

    isPlaying: () => phase !== 'idle',
    savedGame: () => Storage.loadGameState(),
    pokedex: () => dex,
    achievements: () => unlocked,
    reviewCount: (region) => poolForRegion(region).filter((p) => misses[p.id] > 0).length
  };
}
