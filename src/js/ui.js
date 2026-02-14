export function confettiBurst() {
  const canvas = document.getElementById('fx-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const particles = Array.from({ length: 60 }, () => ({
    x: canvas.width * 0.5,
    y: canvas.height * 0.4,
    vx: (Math.random() - 0.5) * 9,
    vy: Math.random() * -6 - 1,
    g: 0.16,
    size: Math.random() * 4 + 2,
    life: 60,
    color: ['#ffcb05', '#2a75bb', '#e3350d'][Math.floor(Math.random() * 3)]
  }));

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
      dom.difficultyRadios.forEach((radio) => {
        radio.checked = radio.value === settings.difficulty;
      });
      dom.kidModeCheckbox.checked = settings.kidMode;
      dom.timerCheckbox.checked = settings.timerEnabled;
      dom.gameRoot.classList.toggle('kid-mode', settings.kidMode);
      dom.muteButton.textContent = settings.muted ? 'Activar sonido' : 'Silenciar sonido';
    },

    updateHud(state, totalPokemon, timerEnabled) {
      dom.scoreDisplay.textContent = state.score;
      dom.failedDisplay.textContent = state.failed;
      dom.counterDisplay.textContent = `${state.currentPokemonIndex + 1}/${totalPokemon}`;
      dom.streakDisplay.textContent = state.streak;
      dom.hintsDisplay.textContent = state.hintsAvailable;
      dom.streakBadge.classList.toggle('hidden', state.streak < 2);
      dom.timerWrap.classList.toggle('hidden', !timerEnabled);
      dom.timerDisplay.textContent = state.timer.remainingSec;
    },

    lockOptions(lock) {
      dom.optionButtons.forEach((btn) => {
        btn.disabled = lock || btn.dataset.disabledForever === '1';
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
    },

    showWrong(button) {
      button.classList.add('wrong');
      button.dataset.disabledForever = '1';
      dom.gameCard.classList.add('shake');
      setTimeout(() => dom.gameCard.classList.remove('shake'), 260);
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
      setTimeout(() => dom.toast.classList.remove('visible'), 2200);
    },

    showHintMessage(text) {
      dom.hintMessage.textContent = text;
      dom.hintMessage.classList.remove('hidden');
      setTimeout(() => dom.hintMessage.classList.add('hidden'), 2200);
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
