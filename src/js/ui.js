import { ACHIEVEMENTS, GAME_CONFIG, MODES, PLAYER_COLORS, REGIONS, TYPES } from './config.js';
import { getRegion, poolForRegion } from './pokemon.js';

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function setText(node, value) {
  const text = String(value);
  if (node.textContent !== text) node.textContent = text;
}

function dexNumber(id) {
  return `#${String(id).padStart(3, '0')}`;
}

function typeChip(typeIndex) {
  const type = TYPES[typeIndex];
  const chip = el('span', 'type-chip', type.name);
  chip.style.backgroundColor = type.color;
  return chip;
}

let confettiFrame = 0;

function confettiBurst() {
  const canvas = document.getElementById('fx-canvas');
  if (!canvas || reducedMotion()) return;
  cancelAnimationFrame(confettiFrame);

  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const bursts = [
    { x: 0.2, y: 0.3 },
    { x: 0.8, y: 0.3 },
    { x: 0.5, y: 0.2 },
    { x: 0.35, y: 0.55 },
    { x: 0.65, y: 0.55 }
  ];
  const colors = ['#ffcb05', '#2a75bb', '#e3350d', '#4bd670'];
  const particles = bursts.flatMap((burst) =>
    Array.from({ length: 60 }, () => ({
      x: width * burst.x,
      y: height * burst.y,
      vx: (Math.random() - 0.5) * 11,
      vy: Math.random() * -8 - 1.5,
      size: Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    }))
  );
  let life = 72;

  function frame() {
    ctx.clearRect(0, 0, width, height);
    life -= 1;
    if (life <= 0) return;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.18;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    confettiFrame = requestAnimationFrame(frame);
  }

  frame();
}

function flash(node, className, ms) {
  if (!node) return;
  node.classList.remove(className);
  void node.offsetWidth;
  node.classList.add(className);
  setTimeout(() => node.classList.remove(className), ms);
}

export function createUI(dom) {
  const toastQueue = [];
  let toastTimer = 0;
  let mode = 'classic';

  function showNextToast() {
    if (toastTimer || !toastQueue.length) return;
    dom.toast.textContent = toastQueue.shift();
    dom.toast.classList.add('visible');
    toastTimer = setTimeout(() => {
      dom.toast.classList.remove('visible');
      toastTimer = setTimeout(() => {
        toastTimer = 0;
        showNextToast();
      }, 200);
    }, 1800);
  }

  function announce(text) {
    dom.srStatus.textContent = '';
    setTimeout(() => {
      dom.srStatus.textContent = text;
    }, 30);
  }

  function optionButtons() {
    return [...dom.optionsWrap.querySelectorAll('.option-btn')];
  }

  function lockOptions() {
    optionButtons().forEach((btn) => {
      btn.disabled = true;
    });
    dom.writeInput.disabled = true;
    dom.writeForm.querySelectorAll('button').forEach((btn) => {
      btn.disabled = true;
    });
  }

  function reveal(pokemon) {
    dom.cryButton.classList.add('hidden');
    dom.image.classList.remove('hidden', 'silhouette');
    dom.image.classList.add('revealed');
    dom.image.alt = pokemon.name;

    dom.revealInfo.replaceChildren(
      el('strong', 'reveal-name', `${dexNumber(pokemon.id)} ${pokemon.name}`),
      ...pokemon.types.map(typeChip)
    );
    dom.revealInfo.classList.add('visible');
  }

  function fillSelect(select, selected) {
    select.replaceChildren(
      ...REGIONS.map((region) => {
        const option = el('option', '', `${region.label} (${region.to - region.from + 1})`);
        option.value = region.id;
        option.selected = region.id === selected;
        return option;
      })
    );
  }

  return {
    toast(text) {
      toastQueue.push(text);
      showNextToast();
    },

    showScreen(name) {
      Object.entries(dom.screens).forEach(([key, screen]) =>
        screen.classList.toggle('hidden', key !== name)
      );
      dom.screens[name].scrollTop = 0;
    },

    clearEffects() {
      cancelAnimationFrame(confettiFrame);
      const canvas = document.getElementById('fx-canvas');
      canvas?.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    },

    renderStart({ settings, best, dexCount, saved, reviewCount, canPlayCries }) {
      if (!dom.regionSelect.options.length) fillSelect(dom.regionSelect, settings.region);
      dom.regionSelect.value = settings.region;

      const toggle = (buttons, attr, value) =>
        buttons.forEach((b) => {
          const active = b.dataset[attr] === String(value);
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', String(active));
        });
      toggle(dom.modeButtons, 'mode', settings.mode);
      toggle(dom.roundsButtons, 'rounds', settings.rounds);
      toggle(dom.difficultyButtons, 'difficulty', settings.difficulty);
      toggle(dom.playersButtons, 'players', settings.playerCount);

      dom.modeButtons.find((b) => b.dataset.mode === 'cry').disabled = !canPlayCries;
      setText(dom.reviewCount, reviewCount ? `(${reviewCount})` : '');

      dom.playerNames.classList.toggle('hidden', settings.playerCount !== 2);
      dom.nameInputs.forEach((input, i) => {
        if (document.activeElement !== input) input.value = settings.playerNames[i];
      });

      dom.timerButton.setAttribute('aria-pressed', String(settings.timerEnabled));
      dom.timerButton.classList.toggle('active', settings.timerEnabled);
      setText(dom.timerButton, `Tiempo: ${settings.timerEnabled ? 'ON' : 'OFF'}`);
      dom.soundButton.setAttribute('aria-pressed', String(!settings.muted));
      dom.soundButton.classList.toggle('active', !settings.muted);
      setText(dom.soundButton, `Sonido: ${settings.muted ? 'OFF' : 'ON'}`);
      this.applyMute(settings.muted);

      dom.highScoreDisplay.classList.toggle('hidden', !best || settings.playerCount === 2);
      setText(dom.highScoreValue, best);
      setText(dom.dexCount, dexCount);

      dom.continueButton.classList.toggle('hidden', !saved);
      if (saved) {
        const region = getRegion(saved.config.region).label;
        const players = saved.players.map((p) => p.name).join(' vs ');
        setText(
          dom.continueDetail,
          `${region} · ${MODES[saved.config.mode].label} · ronda ${saved.index + 1}/${saved.queue.length}${
            saved.players.length > 1 ? ` · ${players}` : ''
          }`
        );
      }
    },

    applyMute(muted) {
      setText(dom.muteButton, muted ? '🔇' : '🔊');
      dom.muteButton.setAttribute('aria-pressed', String(muted));
      dom.muteButton.setAttribute('aria-label', muted ? 'Activar sonido' : 'Silenciar');
    },

    setupGame(config, players) {
      mode = config.mode;
      dom.timerWrap.classList.toggle('hidden', !config.timerEnabled);
      dom.playersBar.classList.toggle('hidden', players.length < 2);
      dom.playersBar.replaceChildren(
        ...players.map((p, i) => {
          const pill = el('span', 'player-pill');
          pill.style.setProperty('--player-color', PLAYER_COLORS[i]);
          pill.append(el('span', 'player-name', p.name), el('strong', 'player-points', p.points));
          return pill;
        })
      );
    },

    updateHud({ player, players, activeIndex, round, total }) {
      setText(dom.scoreDisplay, player.points);
      setText(dom.failedDisplay, player.failed);
      setText(dom.counterDisplay, `${round}/${total}`);
      setText(dom.pointsLabel, players.length > 1 ? player.name.toUpperCase() : 'PUNTOS');
      setText(dom.streakDisplay, player.streak);
      dom.streakBadge.classList.toggle('hidden', player.streak < 2);

      if (players.length > 1) {
        [...dom.playersBar.children].forEach((pill, i) => {
          pill.classList.toggle('active', i === activeIndex);
          setText(pill.querySelector('.player-points'), players[i].points);
        });
      }
    },

    prepareRound() {
      dom.optionsWrap.replaceChildren();
      dom.optionsWrap.classList.toggle('hidden', mode === 'write');
      dom.writeForm.classList.add('hidden');
      dom.networkPanel.classList.add('hidden');
      dom.revealInfo.classList.remove('visible');
      dom.revealInfo.replaceChildren();
      dom.cryButton.classList.add('hidden');
      dom.image.classList.add('hidden', 'silhouette');
      dom.image.classList.remove('revealed');
      dom.image.alt = 'Pokémon a adivinar';
      dom.spinner.classList.remove('hidden');
    },

    loadImage(id, { onLoad, onError }) {
      dom.image.onload = () => {
        dom.spinner.classList.add('hidden');
        onLoad();
      };
      dom.image.onerror = () => {
        dom.spinner.classList.add('hidden');
        onError();
      };
      dom.image.src = `${GAME_CONFIG.api.artworkUrl}${id}.png`;
    },

    cancelImage() {
      dom.image.onload = null;
      dom.image.onerror = null;
    },

    preloadImage(id) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${GAME_CONFIG.api.artworkUrl}${id}.png`;
    },

    showSilhouette() {
      dom.cryButton.classList.add('hidden');
      dom.image.classList.remove('hidden');
    },

    showCryPrompt() {
      dom.image.classList.add('hidden');
      dom.cryButton.classList.remove('hidden');
    },

    renderOptions(names) {
      dom.optionsWrap.replaceChildren(
        ...names.map((name, idx) => {
          const button = el('button', 'option-btn');
          button.type = 'button';
          button.dataset.name = name;
          button.append(el('span', 'option-key', idx + 1), el('span', 'option-name', name));
          button.setAttribute('aria-label', `Opción ${idx + 1}: ${name}`);
          return button;
        })
      );
    },

    showWriteInput() {
      dom.writeForm.classList.remove('hidden');
      dom.writeInput.disabled = false;
      dom.writeForm.querySelectorAll('button').forEach((btn) => {
        btn.disabled = false;
      });
      dom.writeInput.value = '';
      dom.writeInput.focus({ preventScroll: true });
    },

    unlockOptions() {
      optionButtons().forEach((btn) => {
        btn.disabled = btn.dataset.disabledForever === '1';
      });
    },

    startTimer(ms) {
      dom.timerFill.classList.remove('running', 'paused');
      void dom.timerFill.offsetWidth;
      dom.timerFill.style.setProperty('--duration', `${ms}ms`);
      dom.timerFill.classList.add('running');
    },

    stopTimer() {
      dom.timerFill.classList.add('paused');
    },

    showCorrect(button, pokemon) {
      button?.classList.add('correct');
      lockOptions();
      reveal(pokemon);
      announce(`¡Correcto! Es ${pokemon.name}`);
      flash(dom.gameCard, 'good-hit', 700);
      flash(dom.image, 'pokemon-pop', 550);
      flash(document.body, 'flash-good', 360);
      confettiBurst();
      navigator.vibrate?.([60, 45, 80]);
    },

    showWrong(button) {
      if (button) {
        button.classList.add('wrong');
        button.dataset.disabledForever = '1';
      } else {
        dom.writeInput.value = '';
        flash(dom.writeInput, 'shake', 340);
      }
      optionButtons().forEach((btn) => {
        btn.disabled = true;
      });
      announce('Incorrecto, prueba otra vez');
      flash(dom.gameCard, 'bad-hit', 600);
      flash(dom.gameCard, 'shake', 340);
      flash(dom.image, 'pokemon-drop', 450);
      flash(document.body, 'flash-bad', 360);
      flash(dom.hitOverlay, 'fail', 620);
      navigator.vibrate?.([140, 70, 140]);
    },

    showMissed(pokemon) {
      optionButtons()
        .find((btn) => btn.dataset.name === pokemon.name)
        ?.classList.add('answer');
      lockOptions();
      reveal(pokemon);
      announce(`Era ${pokemon.name}`);
    },

    showNetworkError(offline) {
      dom.optionsWrap.classList.add('hidden');
      dom.writeForm.classList.add('hidden');
      dom.networkPanel.classList.remove('hidden');
      setText(
        dom.networkMessage,
        offline
          ? 'Sin conexión. Conéctate a internet para cargar este Pokémon.'
          : 'No se pudo cargar la imagen de este Pokémon.'
      );
    },

    showEnd({ players, total, skipped, isNewRecord, best, message }) {
      setText(dom.finalMessage, message);
      const lines = [];
      if (players.length === 1) {
        const [p] = players;
        setText(dom.finalScore, `${p.hits}/${total}`);
        lines.push(`Puntos: ${p.points} · Fallos: ${p.failed} · Mejor racha: ${p.bestStreak}`);
        lines.push(`Récord en esta modalidad: ${best}`);
      } else {
        setText(dom.finalScore, `${players[0].points} - ${players[1].points}`);
        players.forEach((p) =>
          lines.push(`${p.name}: ${p.hits} aciertos · ${p.points} puntos · ${p.failed} fallos`)
        );
      }
      if (skipped) lines.push(`Saltados por error de red: ${skipped}`);
      dom.finalMeta.replaceChildren(...lines.map((line) => el('p', '', line)));
      dom.newRecord.classList.toggle('hidden', !isNewRecord);
    },

    renderPokedex(regionId, dex, unlocked) {
      if (!dom.pokedexRegion.options.length) fillSelect(dom.pokedexRegion, regionId);
      dom.pokedexRegion.value = regionId;

      const pool = poolForRegion(regionId);
      const caught = pool.filter((p) => dex.has(p.id)).length;
      setText(dom.pokedexProgress, `${caught}/${pool.length} descubiertos`);

      dom.pokedexGrid.replaceChildren(
        ...pool.map((p) => {
          const known = dex.has(p.id);
          const item = el('li', `dex-item${known ? ' known' : ''}`);
          if (known) {
            const img = el('img');
            img.loading = 'lazy';
            img.decoding = 'async';
            img.crossOrigin = 'anonymous';
            img.width = 64;
            img.height = 64;
            img.alt = '';
            img.src = `${GAME_CONFIG.api.spriteUrl}${p.id}.png`;
            item.append(img);
          } else {
            item.append(el('span', 'dex-unknown', '?'));
          }
          item.append(
            el('span', 'dex-number', dexNumber(p.id)),
            el('span', 'dex-name', known ? p.name : '???')
          );
          return item;
        })
      );

      dom.achievementsList.replaceChildren(
        ...Object.values(ACHIEVEMENTS).map((a) => {
          const done = unlocked.includes(a.id);
          const item = el('li', `achievement${done ? ' done' : ''}`);
          item.append(
            el('strong', '', `${done ? '★' : '☆'} ${a.title}`),
            el('span', '', a.description)
          );
          return item;
        })
      );
    }
  };
}
