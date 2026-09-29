import { createAudioSystem } from './audio.js';
import { createGameController } from './game.js';
import { Storage } from './storage.js';
import { createUI } from './ui.js';
import { highScoreKey, resolveSettings } from './utils.js';

const $ = (id) => document.getElementById(id);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const dom = {
  screens: {
    start: $('start-screen'),
    game: $('game-screen'),
    end: $('end-screen'),
    pokedex: $('pokedex-screen')
  },
  gameCard: $('game-card'),
  image: $('pokemon-image'),
  spinner: $('loading-spinner'),
  cryButton: $('cry-button'),
  revealInfo: $('reveal-info'),
  optionsWrap: $('options-container'),
  writeForm: $('write-form'),
  writeInput: $('write-input'),
  giveUpButton: $('give-up-button'),
  networkPanel: $('network-panel'),
  networkMessage: $('network-message'),
  retryButton: $('retry-button'),
  skipButton: $('skip-button'),
  hitOverlay: $('hit-overlay'),

  scoreDisplay: $('score-display'),
  pointsLabel: $('points-label'),
  failedDisplay: $('failed-display'),
  counterDisplay: $('pokemon-counter'),
  streakDisplay: $('streak-display'),
  streakBadge: $('streak-badge'),
  playersBar: $('players-bar'),
  timerWrap: $('timer-wrap'),
  timerFill: $('timer-fill'),
  muteButton: $('mute-button'),

  highScoreDisplay: $('high-score-display'),
  highScoreValue: $('high-score-value'),
  dexCount: $('dex-count'),
  continueButton: $('continue-button'),
  continueDetail: $('continue-detail'),
  regionSelect: $('region-select'),
  reviewCount: $('review-count'),
  modeButtons: $$('.mode-btn'),
  roundsButtons: $$('.rounds-btn'),
  difficultyButtons: $$('.difficulty-btn'),
  playersButtons: $$('.players-btn'),
  playerNames: $('player-names'),
  nameInputs: [$('player-name-0'), $('player-name-1')],
  timerButton: $('timer-btn'),
  soundButton: $('sound-btn'),

  finalScore: $('final-score'),
  finalMeta: $('final-meta'),
  finalMessage: $('congratulations-message'),
  newRecord: $('new-record-badge'),

  pokedexRegion: $('pokedex-region'),
  pokedexProgress: $('pokedex-progress'),
  pokedexGrid: $('pokedex-grid'),
  achievementsList: $('achievements-list'),

  toast: $('toast'),
  srStatus: $('sr-status')
};

let settings = Storage.getSettings();
const ui = createUI(dom);
const audio = createAudioSystem(() => settings);

function updateSettings(patch) {
  settings = resolveSettings({ ...settings, ...patch });
  Storage.saveSettings(settings);
  renderStart();
}

const game = createGameController({
  ui,
  audio,
  getSettings: () => settings,
  updateSettings,
  onExit: renderStart
});

function renderStart() {
  ui.renderStart({
    settings,
    best: Storage.getHighScore(highScoreKey(settings)),
    dexCount: game.pokedex().size,
    saved: game.savedGame(),
    reviewCount: game.reviewCount(settings.region),
    canPlayCries: audio.canPlayCries
  });
}

function openPokedex() {
  ui.renderPokedex(dom.pokedexRegion.value || settings.region, game.pokedex(), game.achievements());
  ui.showScreen('pokedex');
}

function bindEvents() {
  $('start-button').addEventListener('click', () => game.startNew());
  $('play-again-button').addEventListener('click', () => game.startNew());
  dom.continueButton.addEventListener('click', () => game.resume());
  $('exit-button').addEventListener('click', () => game.exitToStart());
  $('menu-button').addEventListener('click', () => {
    renderStart();
    ui.showScreen('start');
  });
  $('share-button').addEventListener('click', () => game.shareScore());
  $('pokedex-button').addEventListener('click', openPokedex);
  $('pokedex-back').addEventListener('click', () => ui.showScreen('start'));
  dom.pokedexRegion.addEventListener('change', () =>
    ui.renderPokedex(dom.pokedexRegion.value, game.pokedex(), game.achievements())
  );

  dom.regionSelect.addEventListener('change', () =>
    updateSettings({ region: dom.regionSelect.value })
  );
  dom.modeButtons.forEach((b) =>
    b.addEventListener('click', () => updateSettings({ mode: b.dataset.mode }))
  );
  dom.roundsButtons.forEach((b) =>
    b.addEventListener('click', () => updateSettings({ rounds: Number(b.dataset.rounds) }))
  );
  dom.difficultyButtons.forEach((b) =>
    b.addEventListener('click', () => updateSettings({ difficulty: b.dataset.difficulty }))
  );
  dom.playersButtons.forEach((b) =>
    b.addEventListener('click', () => updateSettings({ playerCount: Number(b.dataset.players) }))
  );
  dom.nameInputs.forEach((input) =>
    input.addEventListener('change', () =>
      updateSettings({ playerNames: dom.nameInputs.map((i) => i.value) })
    )
  );
  dom.timerButton.addEventListener('click', () =>
    updateSettings({ timerEnabled: !settings.timerEnabled })
  );
  dom.soundButton.addEventListener('click', () => updateSettings({ muted: !settings.muted }));
  dom.muteButton.addEventListener('click', () => {
    updateSettings({ muted: !settings.muted });
    if (settings.muted) audio.stop();
  });

  dom.optionsWrap.addEventListener('click', (event) => {
    const button = event.target.closest('.option-btn');
    if (button) game.answerOption(button);
  });
  dom.writeForm.addEventListener('submit', (event) => {
    event.preventDefault();
    game.answerText(dom.writeInput.value);
  });
  dom.giveUpButton.addEventListener('click', () => game.giveUp());
  dom.cryButton.addEventListener('click', () => game.replayCry());
  dom.retryButton.addEventListener('click', () => game.retryImage());
  dom.skipButton.addEventListener('click', () => game.skipPokemon());

  document.addEventListener('keydown', (event) => {
    if (dom.screens.game.classList.contains('hidden') || event.target instanceof HTMLInputElement)
      return;
    if (event.key >= '1' && event.key <= '9') {
      const button = dom.optionsWrap.querySelectorAll('.option-btn')[Number(event.key) - 1];
      if (button && !button.disabled) game.answerOption(button);
    } else if (event.key === 'Escape') {
      game.exitToStart();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.isPlaying()) audio.stop();
  });
}

bindEvents();
renderStart();
