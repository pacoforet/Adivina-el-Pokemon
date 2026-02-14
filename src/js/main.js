import { createAudioSystem } from './audio.js';
import { createGameController } from './game.js';
import { createInitialState } from './state.js';
import { Storage } from './storage.js';
import { createUI } from './ui.js';
import { resolveSettings } from './utils.js';

const dom = {
  gameRoot: document.getElementById('game-container'),
  screens: {
    start: document.getElementById('start-screen'),
    game: document.getElementById('game-screen'),
    end: document.getElementById('end-screen')
  },
  gameCard: document.getElementById('game-card'),
  image: document.getElementById('pokemon-image'),
  spinner: document.getElementById('loading-spinner'),
  optionsWrap: document.getElementById('options-container'),

  scoreDisplay: document.getElementById('score-display'),
  failedDisplay: document.getElementById('failed-display'),
  counterDisplay: document.getElementById('pokemon-counter'),
  streakDisplay: document.getElementById('streak-display'),
  streakBadge: document.getElementById('streak-badge'),
  timerWrap: document.getElementById('timer-wrap'),
  timerFill: document.getElementById('timer-fill'),

  highScoreDisplay: document.getElementById('high-score-display'),
  highScoreValue: document.getElementById('high-score-value'),

  finalScore: document.getElementById('final-score'),
  finalMeta: document.getElementById('final-meta'),
  finalMessage: document.getElementById('congratulations-message'),
  newRecord: document.getElementById('new-record-badge'),

  toast: document.getElementById('toast'),

  startButton: document.getElementById('start-button'),
  playAgainButton: document.getElementById('play-again-button'),
  finishButton: document.getElementById('finish-button'),
  shareButton: document.getElementById('share-button'),

  difficultyButtons: [...document.querySelectorAll('.difficulty-btn')],
  kidModeButton: document.getElementById('kid-mode-btn'),
  timerButton: document.getElementById('timer-btn')
};

const state = createInitialState();
const settingsRef = { current: resolveSettings(Storage.getSettings()) };
const ui = createUI(dom);
const audio = createAudioSystem(() => settingsRef.current);
const game = createGameController({
  state,
  ui,
  audio,
  settingsRef,
  onReturnToStart: syncHighScore
});

function syncHighScore() {
  const highScore = Storage.getHighScore();
  dom.highScoreDisplay.classList.toggle('hidden', highScore <= 0);
  dom.highScoreValue.textContent = String(highScore);
}

function setDifficulty(value) {
  const next = resolveSettings({ ...settingsRef.current, difficulty: value });
  game.setSettings(next);
  ui.toast(`Dificultad: ${game.difficultyLabel()}`);
}

function toggleKidMode() {
  const next = resolveSettings({ ...settingsRef.current, kidMode: !settingsRef.current.kidMode });
  game.setSettings(next);
  ui.toast(next.kidMode ? 'Modo Lucas y Fede activado' : 'Modo Lucas y Fede desactivado');
}

function toggleTimer() {
  const next = resolveSettings({ ...settingsRef.current, timerEnabled: !settingsRef.current.timerEnabled });
  game.setSettings(next);
}

document.addEventListener('DOMContentLoaded', () => {
  ui.applySettings(settingsRef.current);
  syncHighScore();

  dom.startButton.addEventListener('click', () => {
    game.startGame();
  });

  dom.playAgainButton.addEventListener('click', () => {
    game.startGame({ forceNew: true });
  });

  dom.finishButton.addEventListener('click', () => {
    game.finishGameToStart();
  });

  dom.shareButton.addEventListener('click', () => {
    game.shareScore();
  });

  dom.difficultyButtons.forEach((button) => {
    button.addEventListener('click', () => setDifficulty(button.dataset.difficulty));
  });

  dom.kidModeButton.addEventListener('click', () => {
    toggleKidMode();
  });

  dom.timerButton.addEventListener('click', () => {
    toggleTimer();
  });

  ui.bindOptions((button) => game.answer(button));

  document.addEventListener('keydown', (event) => {
    if (dom.screens.game.classList.contains('hidden')) return;

    if (event.key >= '1' && event.key <= '9') {
      const optionButtons = [...document.querySelectorAll('.option-btn')];
      const index = Number(event.key) - 1;
      const button = optionButtons[index];
      if (button && !button.disabled) button.click();
    }
  });
});
