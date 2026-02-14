export function confettiBurst() {
  const canvas = document.getElementById('fx-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const bursts = [
    { x: 0.2, y: 0.3 },
    { x: 0.8, y: 0.3 },
    { x: 0.5, y: 0.2 },
    { x: 0.35, y: 0.55 },
    { x: 0.65, y: 0.55 }
  ];
  const particles = bursts.flatMap((burst) =>
    Array.from({ length: 80 }, () => ({
      x: canvas.width * burst.x,
      y: canvas.height * burst.y,
      vx: (Math.random() - 0.5) * 11,
      vy: Math.random() * -8 - 1.5,
      g: 0.18,
      size: Math.random() * 5 + 2,
      life: 72,
      color: ['#ffcb05', '#2a75bb', '#e3350d', '#4bd670'][Math.floor(Math.random() * 4)]
    }))
  );

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.life -= 1;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    if (particles.some((p) => p.life > 0)) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  frame();
}

export function createUI(dom) {
  const ui = {
    showScreen(name) {
      ['start', 'game', 'end'].forEach((key) => dom.screens[key].classList.add('hidden'));
      dom.screens[name].classList.remove('hidden');
    },

    applySettings(settings) {
      dom.difficultyButtons.forEach((button) => {
        button.classList.toggle('active', button.dataset.difficulty === settings.difficulty);
      });

      dom.timerButton.classList.toggle('active', settings.timerEnabled);
      dom.timerButton.setAttribute('aria-pressed', String(settings.timerEnabled));
      dom.timerButton.textContent = `Temporizador: ${settings.timerEnabled ? 'ON' : 'OFF'}`;
    },

    updateHud(state, totalPokemon, timerEnabled) {
      dom.scoreDisplay.textContent = state.score;
      dom.failedDisplay.textContent = state.failed;
      dom.counterDisplay.textContent = `${state.currentPokemonIndex + 1}/${totalPokemon}`;
      dom.streakDisplay.textContent = state.streak;
      dom.streakBadge.classList.toggle('hidden', state.streak < 2);
      dom.timerWrap.classList.toggle('hidden', !timerEnabled);

      const total = state.timer.totalSec || 1;
      const percent = Math.max(0, Math.min(100, (state.timer.remainingSec / total) * 100));
      const hue = Math.round((percent / 100) * 120);
      dom.timerFill.style.width = `${percent}%`;
      dom.timerFill.style.backgroundColor = `hsl(${hue}, 75%, 48%)`;
    },

    lockOptions(lock) {
      const optionButtons = [...dom.optionsWrap.querySelectorAll('.option-btn')];
      optionButtons.forEach((btn) => {
        btn.disabled = lock;
      });
    },

    setPokemonImage(id, onReady, onError) {
      dom.image.classList.remove('revealed');
      dom.image.classList.add('silhouette');
      dom.spinner.classList.remove('hidden');
      dom.image.classList.add('hidden');
      dom.image.onload = () => {
        dom.spinner.classList.add('hidden');
        dom.image.classList.remove('hidden');
        onReady();
      };
      dom.image.onerror = onError;
      dom.image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    },

    renderOptions(options) {
      dom.optionsWrap.innerHTML = '';
      options.forEach((name, idx) => {
        const button = document.createElement('button');
        button.className = 'option-btn';
        button.dataset.name = name;
        button.setAttribute('aria-label', `Opcion ${idx + 1}: ${name}`);
        button.textContent = name;
        dom.optionsWrap.appendChild(button);
      });
    },

    revealPokemon() {
      dom.image.classList.remove('silhouette');
      dom.image.classList.add('revealed');
    },

    showCorrect(button) {
      button.classList.add('correct');
      if (dom.gameCard) {
        dom.gameCard.classList.add('good-hit');
        setTimeout(() => dom.gameCard.classList.remove('good-hit'), 280);
      }
      if (dom.image) {
        dom.image.classList.add('pokemon-pop');
        setTimeout(() => dom.image.classList.remove('pokemon-pop'), 520);
      }
      document.body.classList.add('flash-good');
      setTimeout(() => document.body.classList.remove('flash-good'), 360);
      if (navigator.vibrate) navigator.vibrate([60, 45, 80]);
    },

    showWrong(button) {
      button.classList.add('wrong');
      if (dom.gameCard) {
        dom.gameCard.classList.add('shake', 'bad-hit');
        setTimeout(() => dom.gameCard.classList.remove('shake', 'bad-hit'), 280);
      }
      if (dom.image) {
        dom.image.classList.add('pokemon-drop');
        setTimeout(() => dom.image.classList.remove('pokemon-drop'), 420);
      }
      document.body.classList.add('flash-bad');
      setTimeout(() => document.body.classList.remove('flash-bad'), 360);
      const overlay = document.getElementById('hit-overlay');
      if (overlay) {
        overlay.classList.remove('fail');
        // Force restart animation
        void overlay.offsetWidth;
        overlay.classList.add('fail');
      }
      if (navigator.vibrate) navigator.vibrate([140, 70, 140]);
      this.toast('OH NO! INTENTA OTRA!');
    },

    showBonus(points) {
      this.toast(`+${points} bonus por racha!`);
    },

    showAchievement(item) {
      this.toast(`Logro: ${item.title}`);
    },

    toast(text) {
      dom.toast.textContent = text;
      dom.toast.classList.add('visible');
      setTimeout(() => dom.toast.classList.remove('visible'), 1800);
    },

    updateFinal(state, highScore, message, isNewRecord) {
      dom.finalScore.textContent = `${state.score}/150`;
      dom.finalMeta.textContent = `Fallos: ${state.failed} · Mejor puntuacion: ${highScore}`;
      dom.finalMessage.textContent = message;
      dom.newRecord.classList.toggle('hidden', !isNewRecord);
    },

    bindOptions(handler) {
      dom.optionsWrap.onclick = (event) => {
        const button = event.target.closest('.option-btn');
        if (!button) return;
        handler(button);
      };
    }
  };

  return ui;
}
