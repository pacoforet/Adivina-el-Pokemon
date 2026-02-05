# 🎮 ¿Quién es este Pokémon?

Un juego interactivo y divertido para adivinar los 150 Pokémon originales de la primera generación. Perfecto para fans de Pokémon de todas las edades.

![Pokémon Game](https://img.shields.io/badge/Pokémon-Generation%201-FFCB05?style=for-the-badge&logo=pokemon&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ Características

- 🎯 **150 Pokémon originales** de la primera generación
- 🎨 **Interfaz atractiva** con diseño inspirado en Pokémon
- 🔊 **Efectos de sonido** y voces para cada Pokémon
- 🏆 **Sistema de puntuación** con mejor puntuación guardada
- 🔥 **Sistema de rachas** para seguir tu progreso
- 🎊 **Efectos de confeti** cuando aciertas
- 📱 **Totalmente responsive** - funciona en móviles y tablets
- ♿ **Accesible** - soporte para teclado y lectores de pantalla
- 💾 **Guarda tu progreso** - tu mejor puntuación se guarda automáticamente

## 🎮 Cómo Jugar

1. **Haz clic en "¡JUGAR AHORA!"** para comenzar el juego
2. **Observa la silueta** del Pokémon en la pantalla
3. **Selecciona la respuesta correcta** entre las tres opciones
4. Si **aciertas**:
   - ✅ Verás el Pokémon a todo color
   - 🎉 Se activará confeti
   - 🔊 Escucharás el grito del Pokémon
   - 🗣️ Una voz dirá su nombre
5. Si **fallas**:
   - ❌ El botón se pondrá rojo
   - 🔄 Puedes intentar de nuevo con las opciones restantes
6. **Completa los 150 Pokémon** y compara tu puntuación

### 🎹 Atajos de Teclado

Durante el juego, puedes usar:
- **Tecla 1**: Seleccionar primera opción
- **Tecla 2**: Seleccionar segunda opción
- **Tecla 3**: Seleccionar tercera opción

## 🚀 Instalación y Uso

### Opción 1: Uso Directo (Recomendado)

Simplemente abre el archivo `index.html` en tu navegador favorito. ¡No necesitas instalar nada!

```bash
# Clona el repositorio
git clone https://github.com/tu-usuario/Adivina-el-Pokemon.git

# Navega al directorio
cd Adivina-el-Pokemon

# Abre index.html en tu navegador
# En Linux/Mac:
open index.html
# En Windows:
start index.html
```

### Opción 2: Servidor Local

Si prefieres usar un servidor local:

```bash
# Con Python 3
python -m http.server 8000

# Con Node.js (si tienes http-server instalado)
npx http-server

# Luego abre http://localhost:8000 en tu navegador
```

## 📁 Estructura del Proyecto

```
Adivina-el-Pokemon/
│
├── index.html          # Estructura HTML del juego
├── styles.css          # Estilos y animaciones
├── game.js            # Lógica del juego
└── README.md          # Este archivo
```

## 🎨 Características Técnicas

### 🏗️ Arquitectura

El código está organizado en módulos limpios y mantenibles:

- **GameState**: Maneja el estado global del juego
- **AudioSystem**: Sistema de audio con Web Audio API y síntesis de voz
- **Storage**: Gestión de localStorage para puntuaciones
- **UIController**: Control de la interfaz de usuario
- **GameController**: Lógica principal del juego
- **Utils**: Funciones de utilidad reutilizables

### 🎯 APIs Utilizadas

- **PokeAPI** - Imágenes oficiales de Pokémon
- **Web Audio API** - Efectos de sonido sintetizados
- **Web Speech API** - Síntesis de voz
- **LocalStorage API** - Guardado de puntuaciones

### ♿ Accesibilidad

- ✅ Etiquetas ARIA para lectores de pantalla
- ✅ Navegación completa por teclado
- ✅ Soporte para modo de alto contraste
- ✅ Respeta preferencias de movimiento reducido
- ✅ Textos alternativos en imágenes

### 📱 Responsive Design

- ✅ Funciona en pantallas desde 320px hasta 4K
- ✅ Optimizado para touch en dispositivos móviles
- ✅ Previene zoom accidental en móviles

## 🎓 Características Educativas

Este proyecto es perfecto para:

- 👶 **Niños**: Aprender los nombres de Pokémon de forma divertida
- 🎮 **Fans de Pokémon**: Poner a prueba su conocimiento
- 💻 **Desarrolladores**: Ejemplo de código limpio y bien estructurado

## 🔧 Personalización

### Cambiar el idioma

Para cambiar el idioma del juego, modifica las siguientes líneas en `game.js`:

```javascript
// Línea ~330
utterance.lang = 'es-ES'; // Cambia a 'en-US' para inglés
```

Y actualiza los textos en `index.html`.

### Ajustar dificultad

En `game.js`, modifica la configuración:

```javascript
const CONFIG = {
    OPTIONS_PER_QUESTION: 3, // Cambia a 4 para más opciones
    CORRECT_REVEAL_DELAY: 2500, // Tiempo antes del siguiente (ms)
    // ...
};
```

### Cambiar generación de Pokémon

Para usar Pokémon de otras generaciones, actualiza el array `POKEMON_NAMES` y ajusta `TOTAL_POKEMON` en la configuración.

## 🐛 Solución de Problemas

### El sonido no funciona
- Asegúrate de interactuar con la página primero (navegadores modernos requieren interacción del usuario)
- Verifica que el volumen no esté silenciado
- Comprueba que tu navegador soporte Web Audio API

### Las imágenes no cargan
- Verifica tu conexión a internet
- Comprueba que no haya bloqueadores que impidan el acceso a GitHub
- Algunos Pokémon pueden tardar más en cargar dependiendo de tu conexión

### La mejor puntuación no se guarda
- Asegúrate de que tu navegador permita el uso de localStorage
- No uses el modo incógnito (el localStorage se borra al cerrar)

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si quieres mejorar el juego:

1. Fork el proyecto
2. Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Mejoras Futuras

- [ ] Añadir modo multijugador
- [ ] Incluir todas las generaciones de Pokémon
- [ ] Sistema de logros y medallas
- [ ] Modo de dificultad (fácil/medio/difícil)
- [ ] Temporizador opcional
- [ ] Compartir puntuación en redes sociales
- [ ] Modo oscuro
- [ ] Más idiomas

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Siéntete libre de usar, modificar y distribuir el código.

## 🙏 Agradecimientos

- **Nintendo/Game Freak/Pokémon Company** - Por crear Pokémon
- **PokeAPI** - Por proporcionar las imágenes y datos de Pokémon
- **Tailwind CSS** - Por el framework CSS
- **Canvas Confetti** - Por los efectos de confeti

## 📧 Contacto

Si tienes preguntas o sugerencias, no dudes en abrir un issue en el repositorio.

---

**¡Diviértete jugando y convirtiéndote en un Maestro Pokémon!** 🎯⚡🔥

*Made with ❤️ for Lucas and all Pokémon fans*
