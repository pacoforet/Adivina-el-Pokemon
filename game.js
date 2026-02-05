/**
 * ============================================================================
 * JUEGO: ¿QUIÉN ES ESTE POKÉMON?
 * ============================================================================
 * Juego interactivo para adivinar los 150 Pokémon originales (Generación 1)
 * Incluye efectos de sonido, voz, confeti y sistema de puntuación
 * ============================================================================
 */

'use strict';

/* ============================================================================
   CONFIGURACIÓN Y CONSTANTES
   ========================================================================= */

const CONFIG = {
    TOTAL_POKEMON: 150,
    OPTIONS_PER_QUESTION: 3,
    CORRECT_REVEAL_DELAY: 2500,
    WRONG_SHAKE_DURATION: 500,
    MIN_STREAK_DISPLAY: 2,
    SOUND_VOLUME: 0.5,
    SPEECH_RATE: 1.0,
    SPEECH_PITCH: 1.2,
    API: {
        SPRITE_URL: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/',
        CRY_URL: 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/'
    },
    STORAGE_KEY: 'pokemon_game_high_score'
};

const POKEMON_NAMES = [
    'BULBASAUR', 'IVYSAUR', 'VENUSAUR', 'CHARMANDER', 'CHARMELEON', 'CHARIZARD', 'SQUIRTLE', 'WARTORTLE', 'BLASTOISE',
    'CATERPIE', 'METAPOD', 'BUTTERFREE', 'WEEDLE', 'KAKUNA', 'BEEDRILL', 'PIDGEY', 'PIDGEOTTO', 'PIDGEOT',
    'RATTATA', 'RATICATE', 'SPEAROW', 'FEAROW', 'EKANS', 'ARBOK', 'PIKACHU', 'RAICHU', 'SANDSHREW', 'SANDSLASH',
    'NIDORAN♀', 'NIDORINA', 'NIDOQUEEN', 'NIDORAN♂', 'NIDORINO', 'NIDOKING', 'CLEFAIRY', 'CLEFABLE', 'VULPIX', 'NINETALES',
    'JIGGLYPUFF', 'WIGGLYTUFF', 'ZUBAT', 'GOLBAT', 'ODDISH', 'GLOOM', 'VILEPLUME', 'PARAS', 'PARASECT',
    'VENONAT', 'VENOMOTH', 'DIGLETT', 'DUGTRIO', 'MEOWTH', 'PERSIAN', 'PSYDUCK', 'GOLDUCK', 'MANKEY', 'PRIMEAPE',
    'GROWLITHE', 'ARCANINE', 'POLIWAG', 'POLIWHIRL', 'POLIWRATH', 'ABRA', 'KADABRA', 'ALAKAZAM', 'MACHOP', 'MACHOKE',
    'MACHAMP', 'BELLSPROUT', 'WEEPINBELL', 'VICTREEBEL', 'TENTACOOL', 'TENTACRUEL', 'GEODUDE', 'GRAVELER', 'GOLEM',
    'PONYTA', 'RAPIDASH', 'SLOWPOKE', 'SLOWBRO', 'MAGNEMITE', 'MAGNETON', 'FARFETCH\'D', 'DODUO', 'DODRIO',
    'SEEL', 'DEWGONG', 'GRIMER', 'MUK', 'SHELLDER', 'CLOYSTER', 'GASTLY', 'HAUNTER', 'GENGAR', 'ONIX',
    'DROWZEE', 'HYPNO', 'KRABBY', 'KINGLER', 'VOLTORB', 'ELECTRODE', 'EXEGGCUTE', 'EXEGGUTOR', 'CUBONE', 'MAROWAK',
    'HITMONLEE', 'HITMONCHAN', 'LICKITUNG', 'KOFFING', 'WEEZING', 'RHYHORN', 'RHYDON', 'CHANSEY', 'TANGELA',
    'KANGASKHAN', 'HORSEA', 'SEADRA', 'GOLDEEN', 'SEAKING', 'STARYU', 'STARMIE', 'MR. MIME', 'SCYTHER', 'JYNX',
    'ELECTABUZZ', 'MAGMAR', 'PINSIR', 'TAUROS', 'MAGIKARP', 'GYARADOS', 'LAPRAS', 'DITTO', 'EEVEE', 'VAPOREON',
    'JOLTEON', 'FLAREON', 'PORYGON', 'OMANYTE', 'OMASTAR', 'KABUTO', 'KABUTOPS', 'AERODACTYL', 'SNORLAX',
    'ARTICUNO', 'ZAPDOS', 'MOLTRES', 'DRATINI', 'DRAGONAIR', 'DRAGONITE', 'MEWTWO', 'MEW'
];

/* ============================================================================
   ESTADO DEL JUEGO
   ========================================================================= */

const GameState = {
    pokemonData: POKEMON_NAMES.map((name, index) => ({ id: index + 1, name })),
    shuffledPokemon: [],
    currentPokemonIndex: 0,
    score: 0,
    failed: 0,
    streak: 0,
    isAnswering: false,
    highScore: 0
};

/* ============================================================================
   ELEMENTOS DEL DOM
   ========================================================================= */

const DOM = {
    // Pantallas
    screens: {
        start: document.getElementById('start-screen'),
        game: document.getElementById('game-screen'),
        end: document.getElementById('end-screen')
    },

    // Elementos del juego
    gameCard: document.getElementById('game-card'),
    imgEl: document.getElementById('pokemon-image'),
    spinner: document.getElementById('loading-spinner'),
    optionsContainer: document.getElementById('options-container'),
    optionButtons: document.querySelectorAll('.option-button'),

    // Displays de información
    scoreDisplay: document.getElementById('score-display'),
    streakDisplay: document.getElementById('streak-display'),
    streakBadge: document.getElementById('streak-badge'),
    pokemonCounter: document.getElementById('pokemon-counter'),
    highScoreDisplay: document.getElementById('high-score-display'),
    highScoreValue: document.getElementById('high-score-value'),

    // Pantalla final
    finalScore: document.getElementById('final-score'),
    finalCorrect: document.getElementById('final-correct'),
    finalFailed: document.getElementById('final-failed'),
    congratsMessage: document.getElementById('congratulations-message'),
    newRecordBadge: document.getElementById('new-record-badge'),

    // Botones
    startButton: document.getElementById('start-button'),
    playAgainButton: document.getElementById('play-again-button')
};

/* ============================================================================
   SISTEMA DE AUDIO
   ========================================================================= */

const AudioSystem = {
    context: null,

    /**
     * Inicializa el contexto de audio
     */
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API no disponible:', e);
        }
    },

    /**
     * Reproduce un tono sintetizado
     * @param {number} freq - Frecuencia en Hz
     * @param {string} type - Tipo de onda (sine, square, sawtooth, triangle)
     * @param {number} duration - Duración en segundos
     */
    playTone(freq, type, duration) {
        if (!this.context) return;

        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.type = type;
        oscillator.frequency.value = freq;
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        gainNode.gain.setValueAtTime(CONFIG.SOUND_VOLUME, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    },

    /**
     * Sonido de respuesta correcta
     */
    playCorrect() {
        this.playTone(600, 'sine', 0.1);
        setTimeout(() => this.playTone(800, 'sine', 0.2), 100);
    },

    /**
     * Sonido de respuesta incorrecta
     */
    playWrong() {
        this.playTone(150, 'sawtooth', 0.3);
    },

    /**
     * Reproduce el grito del Pokémon desde la PokeAPI
     * @param {number} id - ID del Pokémon
     */
    playPokemonCry(id) {
        const audio = new Audio(`${CONFIG.API.CRY_URL}${id}.ogg`);
        audio.volume = CONFIG.SOUND_VOLUME;
        audio.play().catch(e => console.log('No se pudo reproducir el grito:', e));
    },

    /**
     * Usa la API de síntesis de voz para decir el nombre del Pokémon
     * @param {string} name - Nombre del Pokémon
     */
    speak(name) {
        if (!('speechSynthesis' in window)) return;

        const utterance = new SpeechSynthesisUtterance(`¡Es ${name}!`);
        utterance.lang = 'es-ES';
        utterance.rate = CONFIG.SPEECH_RATE;
        utterance.pitch = CONFIG.SPEECH_PITCH;

        window.speechSynthesis.speak(utterance);
    }
};

/* ============================================================================
   SISTEMA DE ALMACENAMIENTO LOCAL
   ========================================================================= */

const Storage = {
    /**
     * Obtiene la mejor puntuación guardada
     * @returns {number}
     */
    getHighScore() {
        try {
            return parseInt(localStorage.getItem(CONFIG.STORAGE_KEY)) || 0;
        } catch (e) {
            console.warn('No se pudo acceder a localStorage:', e);
            return 0;
        }
    },

    /**
     * Guarda la mejor puntuación
     * @param {number} score
     * @returns {boolean} - true si es un nuevo récord
     */
    setHighScore(score) {
        try {
            const currentHighScore = this.getHighScore();
            if (score > currentHighScore) {
                localStorage.setItem(CONFIG.STORAGE_KEY, score.toString());
                return true;
            }
            return false;
        } catch (e) {
            console.warn('No se pudo guardar en localStorage:', e);
            return false;
        }
    }
};

/* ============================================================================
   UTILIDADES
   ========================================================================= */

const Utils = {
    /**
     * Mezcla un array usando el algoritmo Fisher-Yates
     * @param {Array} array
     * @returns {Array}
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    /**
     * Obtiene respuestas incorrectas aleatorias
     * @param {string} correctName - Nombre correcto a excluir
     * @param {number} count - Cantidad de respuestas incorrectas
     * @returns {Array<string>}
     */
    getWrongAnswers(correctName, count = 2) {
        const wrongs = [];
        const availableNames = GameState.pokemonData
            .map(p => p.name)
            .filter(name => name !== correctName);

        while (wrongs.length < count && wrongs.length < availableNames.length) {
            const randomName = availableNames[Math.floor(Math.random() * availableNames.length)];
            if (!wrongs.includes(randomName)) {
                wrongs.push(randomName);
            }
        }

        return wrongs;
    },

    /**
     * Genera mensaje de felicitación según la puntuación
     * @param {number} score
     * @param {number} total
     * @returns {string}
     */
    getCongratulationsMessage(score, total) {
        const percentage = (score / total) * 100;

        if (percentage === 100) return '¡PERFECTO! ¡Eres un Maestro Pokémon!';
        if (percentage >= 90) return '¡Increíble! ¡Casi perfecto!';
        if (percentage >= 75) return '¡Excelente trabajo!';
        if (percentage >= 50) return '¡Bien hecho! ¡Sigue practicando!';
        if (percentage >= 25) return '¡Buen intento! ¡Puedes mejorar!';
        return '¡Sigue intentándolo! ¡La práctica hace al maestro!';
    },

    /**
     * Muestra confeti con configuración personalizada
     * @param {Object} options
     */
    showConfetti(options = {}) {
        if (typeof confetti === 'undefined') return;

        confetti({
            particleCount: options.particleCount || 100,
            spread: options.spread || 70,
            origin: options.origin || { y: 0.6 },
            colors: options.colors || ['#FFCB05', '#2A75BB', '#E3350D']
        });
    }
};

/* ============================================================================
   CONTROLADOR DE UI
   ========================================================================= */

const UIController = {
    /**
     * Cambia entre pantallas
     * @param {string} screenName - 'start', 'game', o 'end'
     */
    showScreen(screenName) {
        Object.values(DOM.screens).forEach(screen => screen.classList.add('hidden'));

        if (DOM.screens[screenName]) {
            DOM.screens[screenName].classList.remove('hidden');
        }
    },

    /**
     * Actualiza todos los displays de información
     */
    updateDisplays() {
        DOM.scoreDisplay.textContent = GameState.score;
        DOM.streakDisplay.textContent = GameState.streak;
        DOM.pokemonCounter.textContent = GameState.currentPokemonIndex + 1;

        // Mostrar/ocultar badge de racha
        if (GameState.streak >= CONFIG.MIN_STREAK_DISPLAY) {
            DOM.streakBadge.classList.remove('opacity-0');
            DOM.streakBadge.classList.add('animate-pop');
            setTimeout(() => DOM.streakBadge.classList.remove('animate-pop'), 300);
        } else {
            DOM.streakBadge.classList.add('opacity-0');
        }
    },

    /**
     * Muestra el spinner de carga
     */
    showSpinner() {
        DOM.spinner.classList.remove('hidden');
        DOM.imgEl.classList.add('hidden');
        DOM.optionsContainer.classList.add('opacity-50', 'pointer-events-none');
    },

    /**
     * Oculta el spinner de carga
     */
    hideSpinner() {
        DOM.spinner.classList.add('hidden');
        DOM.imgEl.classList.remove('hidden');
        DOM.optionsContainer.classList.remove('opacity-50', 'pointer-events-none');
    },

    /**
     * Configura la imagen del Pokémon
     * @param {number} id - ID del Pokémon
     */
    setupPokemonImage(id) {
        return new Promise((resolve, reject) => {
            DOM.imgEl.onload = () => {
                this.hideSpinner();
                GameState.isAnswering = false;
                resolve();
            };

            DOM.imgEl.onerror = () => {
                console.error(`Error al cargar imagen del Pokémon #${id}`);
                this.hideSpinner();
                reject();
            };

            DOM.imgEl.src = `${CONFIG.API.SPRITE_URL}${id}.png`;
        });
    },

    /**
     * Configura los botones de opciones
     * @param {Array<string>} options
     */
    setupOptions(options) {
        DOM.optionButtons.forEach((btn, idx) => {
            btn.textContent = options[idx];
            btn.dataset.name = options[idx];
            btn.className = 'btn option-button w-full bg-[#FFCB05] hover:bg-[#ffe16b] py-4 px-2 text-xl leading-none min-h-[64px] flex items-center justify-center';
            btn.disabled = false;
            btn.style.opacity = '1';
        });
    },

    /**
     * Muestra la imagen del Pokémon en silueta
     */
    showSilhouette() {
        DOM.imgEl.classList.remove('pokemon-revealed');
        DOM.imgEl.classList.add('pokemon-silhouette');
    },

    /**
     * Revela la imagen del Pokémon
     */
    revealPokemon() {
        DOM.imgEl.classList.remove('pokemon-silhouette');
        DOM.imgEl.classList.add('pokemon-revealed');
    },

    /**
     * Muestra feedback visual para respuesta correcta
     * @param {HTMLElement} button
     */
    showCorrectFeedback(button) {
        button.classList.remove('bg-[#FFCB05]', 'hover:bg-[#ffe16b]');
        button.classList.add('bg-green-500', 'text-white', 'border-green-600');
    },

    /**
     * Muestra feedback visual para respuesta incorrecta
     * @param {HTMLElement} button
     */
    showWrongFeedback(button) {
        button.classList.remove('bg-[#FFCB05]', 'hover:bg-[#ffe16b]');
        button.classList.add('bg-red-500', 'text-white');
        DOM.gameCard.classList.add('animate-shake');

        setTimeout(() => {
            DOM.gameCard.classList.remove('animate-shake');
            button.disabled = true;
            button.style.opacity = '0.5';
        }, CONFIG.WRONG_SHAKE_DURATION);
    },

    /**
     * Muestra la pantalla final con resultados
     */
    showEndScreen() {
        DOM.finalScore.textContent = GameState.score;
        DOM.finalCorrect.textContent = GameState.score;
        DOM.finalFailed.textContent = GameState.failed;
        DOM.congratsMessage.textContent = Utils.getCongratulationsMessage(
            GameState.score,
            CONFIG.TOTAL_POKEMON
        );

        // Verificar si es nuevo récord
        const isNewRecord = Storage.setHighScore(GameState.score);
        if (isNewRecord && GameState.score > 0) {
            DOM.newRecordBadge.classList.remove('hidden');
            Utils.showConfetti({ particleCount: 300, spread: 100 });
        } else {
            DOM.newRecordBadge.classList.add('hidden');
        }

        // Confeti extra si la puntuación es muy alta
        if (GameState.score > 100) {
            Utils.showConfetti({ particleCount: 200, spread: 90 });
        }

        this.showScreen('end');
    },

    /**
     * Actualiza el display de mejor puntuación en la pantalla de inicio
     */
    updateHighScoreDisplay() {
        const highScore = Storage.getHighScore();
        if (highScore > 0) {
            DOM.highScoreValue.textContent = highScore;
            DOM.highScoreDisplay.classList.remove('hidden');
        } else {
            DOM.highScoreDisplay.classList.add('hidden');
        }
    }
};

/* ============================================================================
   CONTROLADOR DEL JUEGO
   ========================================================================= */

const GameController = {
    /**
     * Inicializa un nuevo juego
     */
    startGame() {
        // Reiniciar estado
        GameState.score = 0;
        GameState.failed = 0;
        GameState.streak = 0;
        GameState.currentPokemonIndex = 0;
        GameState.isAnswering = false;

        // Mezclar Pokémon
        GameState.shuffledPokemon = Utils.shuffleArray(GameState.pokemonData);

        // Inicializar audio
        AudioSystem.init();
        if (AudioSystem.context && AudioSystem.context.state === 'suspended') {
            AudioSystem.context.resume();
        }

        // Mostrar pantalla de juego
        UIController.showScreen('game');
        UIController.updateDisplays();

        // Cargar primer nivel
        this.loadLevel();
    },

    /**
     * Carga el nivel actual
     */
    async loadLevel() {
        // Verificar si el juego ha terminado
        if (GameState.currentPokemonIndex >= CONFIG.TOTAL_POKEMON) {
            this.endGame();
            return;
        }

        // Setup visual
        UIController.showSpinner();
        UIController.showSilhouette();

        const currentPokemon = GameState.shuffledPokemon[GameState.currentPokemonIndex];

        try {
            // Cargar imagen
            await UIController.setupPokemonImage(currentPokemon.id);

            // Generar opciones
            const wrongAnswers = Utils.getWrongAnswers(currentPokemon.name, 2);
            const options = Utils.shuffleArray([currentPokemon.name, ...wrongAnswers]);

            // Configurar botones
            UIController.setupOptions(options);

            // Actualizar displays
            UIController.updateDisplays();

        } catch (error) {
            console.error('Error al cargar nivel:', error);
            // Intentar cargar el siguiente
            GameState.currentPokemonIndex++;
            this.loadLevel();
        }
    },

    /**
     * Maneja la respuesta del jugador
     * @param {Event} event
     */
    handleAnswer(event) {
        // Evitar respuestas múltiples
        if (GameState.isAnswering) return;

        const selectedButton = event.target;
        const selectedName = selectedButton.dataset.name;
        const currentPokemon = GameState.shuffledPokemon[GameState.currentPokemonIndex];

        // Bloquear nuevas respuestas
        GameState.isAnswering = true;

        if (selectedName === currentPokemon.name) {
            this.handleCorrectAnswer(selectedButton, currentPokemon);
        } else {
            this.handleWrongAnswer(selectedButton);
        }
    },

    /**
     * Maneja una respuesta correcta
     * @param {HTMLElement} button
     * @param {Object} pokemon
     */
    handleCorrectAnswer(button, pokemon) {
        // Actualizar estado
        GameState.score++;
        GameState.streak++;

        // Feedback visual
        UIController.showCorrectFeedback(button);
        UIController.revealPokemon();

        // Efectos especiales
        Utils.showConfetti();

        // Sonidos
        AudioSystem.playCorrect();

        // Voz y grito del Pokémon (con delay para no solapar)
        setTimeout(() => {
            AudioSystem.playPokemonCry(pokemon.id);
            AudioSystem.speak(pokemon.name);
        }, 300);

        // Actualizar UI
        UIController.updateDisplays();

        // Pasar al siguiente nivel
        setTimeout(() => {
            GameState.currentPokemonIndex++;
            this.loadLevel();
        }, CONFIG.CORRECT_REVEAL_DELAY);
    },

    /**
     * Maneja una respuesta incorrecta
     * @param {HTMLElement} button
     */
    handleWrongAnswer(button) {
        // Actualizar estado
        GameState.streak = 0;
        GameState.failed++;

        // Feedback visual y sonoro
        UIController.showWrongFeedback(button);
        AudioSystem.playWrong();

        // Actualizar UI
        UIController.updateDisplays();

        // Permitir reintentar después de la animación
        setTimeout(() => {
            GameState.isAnswering = false;
        }, CONFIG.WRONG_SHAKE_DURATION);
    },

    /**
     * Finaliza el juego
     */
    endGame() {
        UIController.showEndScreen();
    }
};

/* ============================================================================
   INICIALIZACIÓN
   ========================================================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar sistema de audio
    AudioSystem.init();

    // Cargar mejor puntuación
    GameState.highScore = Storage.getHighScore();
    UIController.updateHighScoreDisplay();

    // Event listeners
    DOM.startButton.addEventListener('click', () => {
        GameController.startGame();
    });

    DOM.playAgainButton.addEventListener('click', () => {
        GameController.startGame();
    });

    DOM.optionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            GameController.handleAnswer(e);
        });
    });

    // Soporte para teclado (accesibilidad)
    document.addEventListener('keydown', (e) => {
        if (DOM.screens.game.classList.contains('hidden')) return;

        // Teclas 1, 2, 3 para seleccionar opciones
        if (e.key >= '1' && e.key <= '3') {
            const buttonIndex = parseInt(e.key) - 1;
            if (DOM.optionButtons[buttonIndex] && !DOM.optionButtons[buttonIndex].disabled) {
                DOM.optionButtons[buttonIndex].click();
            }
        }
    });

    console.log('🎮 Juego de Pokémon cargado correctamente');
});
