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
  hintsDisplay: document.getElementById('hints-display'),
  timerDisplay: document.getElementById('timer-display'),
  timerWrap: document.getElementById('timer-wrap'),

  highScoreDisplay: document.getElementById('high-score-display'),
  highScoreValue: document.getElementById('high-score-value'),

  finalScore: document.getElementById('final-score'),
  finalMeta: document.getElementById('final-meta'),
  finalMessage: document.getElementById('congratulations-message'),
  newRecord: document.getElementById('new-record-badge'),

  toast: document.getElementById('toast'),
  hintMessage: document.getElementById('hint-message'),

  startButton: document.getElementById('start-button'),
  playAgainButton: document.getElementById('play-again-button'),
  restartButton: document.getElementById('restart-button'),
  muteButton: document.getElementById('mute-button'),
  hintButton: document.getElementById('hint-button'),
  shareButton: document.getElementById('share-button'),

  difficultyRadios: [...document.querySelectorAll('input[name="difficulty"]')],
  kidModeCheckbox: document.getElementById('kid-mode'),
  timerCheckbox: document.getElementById('timer-enabled')
};

const state = createInitialState();
const settingsRef = { current: resolveSettings(Storage.getSettings()) };
const ui = createUI(dom);
const audio = createAudioSystem(() => settingsRef.current);
const game = createGameController({ state, ui, audio, settingsRef });

function syncHighScore() {
  const highScore = Storage.getHighScore();
  dom.highScoreDisplay.classList.toggle('hidden', highScore <= 0);
  dom.highScoreValue.textContent = String(highScore);
}

function readSettingsFromControls() {
  const checkedDifficulty = dom.difficultyRadios.find((radio) => radio.checked)?.value || 'normal';
  return resolveSettings({
    difficulty: checkedDifficulty,
    kidMode: dom.kidModeCheckbox.checked,
    timerEnabled: dom.timerCheckbox.checked,
    muted: settingsRef.current.muted
  });
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

  dom.restartButton.addEventListener('click', () => {
    game.startGame({ forceNew: true });
  });

  dom.shareButton.addEventListener('click', () => {
    game.shareScore();
  });

  dom.hintButton.addEventListener('click', () => {
    game.useHint();
  });

  dom.muteButton.addEventListener('click', () => {
    const next = resolveSettings({ ...settingsRef.current, muted: !settingsRef.current.muted });
    game.setSettings(next);
  });

  dom.difficultyRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      game.setSettings(readSettingsFromControls());
      ui.toast(`Dificultad: ${game.difficultyLabel()}`);
    });
  });

  dom.kidModeCheckbox.addEventListener('change', () => {
    game.setSettings(readSettingsFromControls());
    ui.toast(dom.kidModeCheckbox.checked ? 'Modo Lucas y Fede activado' : 'Modo normal activado');
  });

  dom.timerCheckbox.addEventListener('change', () => {
    game.setSettings(readSettingsFromControls());
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

    if (event.key.toLowerCase() === 'h') {
      game.useHint();
    }
  });
});
