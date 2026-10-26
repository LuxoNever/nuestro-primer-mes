# Nuestro primer mes juntos 💜

Un regalo interactivo para celebrar el 26 de octubre de 2026, un mes después del 26 de septiembre de 2026. React + TypeScript + Vite, en español, sin backend ni servicios externos.

## Ejecutar

Requisitos: Node.js 24 y npm. Abre una terminal **dentro de esta carpeta**.

```sh
npm ci
npm run dev
```

Abre la URL que indique Vite, normalmente `http://localhost:5173/nuestro-primer-mes/`.

```sh
npm run lint
npm run typecheck
npx playwright install chromium webkit
npm test
npm run build
npm run preview
```

`npm run preview` sirve la compilación en `http://localhost:4173/nuestro-primer-mes/`. No abras `dist/index.html` directamente con doble clic: los módulos necesitan un servidor HTTP.

## Personalización

Edita **`src/content.ts`**. Reúne las fechas, titulares, dedicatorias, carta, mensajes principales, fotos y música. La dedicatoria de «Mi flor más bonita» y la carta contienen los textos definitivos proporcionados por el autor para Johana, transcritos literalmente. Detalles de esta entrega en `DEDICATORIAS.md`.

### Fotografías

Las diez fotografías reales están registradas con su extensión **.jpeg**: portada `02.jpeg`, secundaria `01.jpeg`, después `03.jpeg`–`10.jpeg`. La primera entrada de `memories` es la portada y la segunda recibe el tratamiento secundario; cambia el orden del array para reordenar el álbum. Cinco se muestran inicialmente y el botón descubre las demás. No se añadieron fechas ni lugares.

1. Copia cada archivo a `public/photos/` (por ejemplo, `foto-01.webp`).
2. Cambia la entrada correspondiente en `memories`:

```ts
{
  id: 'foto-nueva',
  src: 'photos/foto-01.webp',
  title: 'Tu título real',
  date: null, // Añade una fecha solo cuando la conozcas.
  description: 'Tu descripción personal.',
  tone: 0,
  position: '50% 40%', // Encuadre CSS de la miniatura; no altera el archivo.
}
```

No incluyas `public/` ni una barra inicial en las rutas. Conserva `src: null` mientras no exista una fotografía. No se hace ninguna petición de imagen en ese caso. Si una ruta deja de funcionar, se vuelve al placeholder ilustrado. El campo `date` es una etiqueta de texto libre, no se convierte a otra zona horaria.

Recomendación de preparación: WebP/JPEG de hasta 1600–2000 px en el lado largo, idealmente menos de 400 KB por foto. El visor mantiene la imagen completa; las miniaturas recortan con `object-fit: cover`.

### Carta y dedicatoria

`story.dedication` es el mensaje breve del aniversario. `story.letter` conserva el saludo **Mi reina 💜**, trece párrafos definitivos, el cierre *Con todo mi amor,* y la firma **Tu esclavo. ♡**. Cada elemento de `paragraphs` es un párrafo y existe una sola copia original del texto.

La lectura ahora se divide en **cinco capítulos**, con Anterior/Siguiente, contador y progreso. `letterChapters`, exportado por separado en `src/content.ts`, solo define títulos y rangos `from`/`to` de `slice` (el extremo `to` no se incluye): 0–2, 2–4, 4–7, 7–10 y 10–13. La fecha y el saludo aparecen en la primera página; cierre y firma, únicamente en la última. La apertura conserva sus 4,4 segundos y las transiciones entre capítulos duran 0,5 s.

**Leer sin animación** abre la primera página y desactiva también sus transiciones. **Volver a leer** vuelve a la primera y repite la apertura según la preferencia de movimiento; **Volver al inicio**, al final, vuelve a la primera sin reabrir el sobre. **Cerrar el sobre** cancela con seguridad la transición. Cada página tiene altura natural y se desplaza con el resto del documento, sin scroll interno. Detalles, diez capturas y video en `CAPITULOS.md`.

### Mi flor más bonita

La sección utiliza la foto original `public/photos/Mi flor más bonita.jpeg`, completa y sin filtros. Personaliza `story.specialMoment` en `src/content.ts`; no es necesario modificar los componentes:

```ts
specialMoment: {
  eyebrow: 'UN DETALLE, SOLO PARA TI',
  title: 'Mi flor más bonita',
  src: 'photos/Mi flor más bonita.jpeg',
  alt: 'Mi esposa con el ramo de flores lavanda que le regalé',
  dedication: ['Tu primer párrafo.', 'Tu segundo párrafo.'],
  closing: 'Con todo mi amor,',
  signature: 'Siempre tuyo',
  caption: 'Tú, haciendo más bonito mi mundo.',
  note: 'Aquí guardaremos mi flor más bonita.',
  heartHint: 'Un pétalo para ti',
  heartMessage: 'Y todos los demás también serían para ti, mi preciosa. 💜',
},
```

`dedication` contiene la frase principal destacada y los cinco párrafos definitivos proporcionados por el autor. Esta sección conserva la firma **Siempre tuyo**. La entrada dura 3 segundos, una sola vez al hacer scroll: una máscara rectangular se abre desde el centro mientras los tulipanes se separan detrás del marco. Si no se admite `clip-path`, se utiliza un fundido sencillo. El corazón libera ocho pétalos de duración finita; con movimiento reducido solo cambia el mensaje. `src: null` o una carga fallida conservan una reserva accesible. Diseño en `MI-FLOR.md` y textos definitivos/capturas actuales en `DEDICATORIAS.md`.

### Música opcional

El recurso actual es **`public/audio/cancion-aniversario.mp4`**. Se verificó que contiene una sola pista de audio, sin video, y dura aproximadamente **203,36 segundos**. Se reproduce directamente con `<audio>` en Chromium y WebKit. No se instaló software ni se generó un MP3: el FFmpeg reducido de Playwright no tiene los decodificadores/codificadores necesarios para esa conversión.

En `src/content.ts`, `story.music` permite cambiar:

- `src`: ruta relativa a `public/`, sin barra inicial. Acepta un MP3 futuro, por ejemplo `'audio/cancion-aniversario.mp3'`. Usa `null` para desactivar el recurso.
- `title`: título visible; `initialVolume`: nivel inicial de 0 a 1.
- `loopStart` / `loopEnd`: límites en segundos. Los valores actuales, **0.85 / 199.75**, omiten el silencio de los extremos de este archivo, conservando margen alrededor de la música.
- `fadeSeconds`: fundido de entrada/salida, actualmente **0.35 s**.
- `introFadeSeconds`: fundido inicial al revelar la página, actualmente **1.2 s**; no cambia el bucle.

**Al sustituir la canción, restablece `loopStart: 0` y `loopEnd: null`** hasta verificar los límites del nuevo archivo. Un archivo con duración menor limita automáticamente el final a su duración real.

No hay reproducción ni descarga del audio antes de una interacción: el elemento no recibe el atributo `src` hasta el gesto, además de usar `preload="none"`. **Tocar el sobre** prepara la canción de forma inaudible dentro de ese gesto; al ejecutarse `onReveal()` comienza desde `loopStart` con un fundido de **1.2 s**. Si se salta tras abrir, o se entra desde el modo reducido, la salida de la introducción completa esa transición. Saltar sin abrir no inicia música. Abrir el panel tampoco la reproduce: **Reproducir** sigue disponible como control manual.

Pausa, volumen y **Silenciar / Activar sonido** conservan la decisión de la visitante. Una pausa manual impide que la introducción reactive la canción. Repetir la introducción o cambiar de sección no reinicia una reproducción existente. Si el navegador bloquea el audio, se abre el panel con un aviso accesible y el botón Reproducir. Detalles y pruebas en `AUDIO-INTRO.md`.

El bucle utiliza límites editables y fundidos, con reproducción nativa repetida como respaldo. Web Audio controla las rampas cuando está disponible; en caso contrario se usa el volumen nativo. No se decodifica la canción completa en memoria ni se superponen dos copias. Al desmontar se detiene y libera el elemento, el grafo y el contexto. Si falta el archivo, al intentar reproducirlo aparece un mensaje recuperable; con `src: null` no se solicita audio.

## Qué incluye

- Introducción independiente de 8,3 s: sobre centrado, expansión de tulipanes 2.5D hasta cubrir la pantalla, mensaje y revelación de la página. Permite saltar, repetir y elegir movimiento completo voluntariamente cuando el sistema pide movimiento reducido.
- Regalo CSS con perspectiva, tapa y lazo; partículas y pétalos de duración finita.
- Siete tulipanes originales generados con curvas SVG, sombreado y pétalos que se abren por fases. No necesita WebGL ni descarga Three.js. El efecto de profundidad es ilustrado.
- Controles para saltar, repetir el regalo y repetir el florecimiento.
- Álbum Polaroid con visor modal nativo, Escape, flechas, deslizamiento táctil y restauración de foco.
- Sobre animado y carta editable; jardín final y reinicio del recorrido.
- Fuentes locales, carga diferida de fotografías y `prefers-reduced-motion`.
- El contenido inferior siempre está disponible; no depende de que termine una animación.

## GitHub Pages — publicación manual autorizada

Repositorio: [LuxoNever/nuestro-primer-mes](https://github.com/LuxoNever/nuestro-primer-mes).

URL del sitio: [Nuestro primer mes juntos](https://luxonever.github.io/nuestro-primer-mes/).

El autor confirmó la publicación de las once fotografías, las dedicatorias y la canción. `publication/manifest.json` registra esas autorizaciones, la URL definitiva y las doce huellas SHA-256 originales, verificadas antes de incluir los archivos. La música, las fotos y `src/content.ts` no se modificaron.

```sh
npm ci
npm run lint
npm run typecheck
npm run publication
npm run publication:test
npm test -- --workers 2
npm run build
npm run publication:check
```

`publication` comprueba recursos y autorizaciones antes del build; `publication:check` comprueba además el artefacto de `dist`. Un cambio de contenido o medios exige revisar las nuevas huellas y sus permisos, sin reemplazar hashes a ciegas. `.gitattributes` conserva los bytes auditados de las fuentes y de los medios al trabajar entre Windows y Linux.

Las exclusiones personales de `.gitignore` permanecen. Solo se incluyen expresamente los doce medios aprobados. No se suben `dist`, `node_modules`, cachés, credenciales, grabaciones, capturas o ZIP. Vite sí copia `public/` a `dist`; cualquier recurso nuevo necesita revisión antes de publicar.

En **Settings → Pages → Source**, utilizar **GitHub Actions**. En **Actions → Publicar en GitHub Pages (manual) → Run workflow**, seleccionar `main` y habilitar **publicar**. Un push no despliega. El workflow preparado verifica permisos, inventario, auditoría npm, lint, TypeScript, pruebas y build antes de subir el artefacto y desplegarlo. No se necesita un token personal en el código.

`vite.config.ts` y Actions conservan `/nuestro-primer-mes/`. El workflow configura `VITE_SITE_URL` con el propietario del repositorio para generar canonical y Open Graph absolutos. La tarjeta de compartir utiliza únicamente tulipanes originales; WhatsApp puede conservar su propia caché de vista previa.

Para construir localmente con la metadata definitiva en PowerShell:

```powershell
$env:VITE_BASE_PATH = '/nuestro-primer-mes/'
$env:VITE_SITE_URL = 'https://luxonever.github.io/nuestro-primer-mes/'
npm run build
npm run publication:check
npm run preview
```

El sitio es público y no tiene autenticación. `noindex, nofollow` solicita que los buscadores no indexen; no restringe el acceso. La carta completa y los medios pueden descargarse, incluidos los capítulos que todavía no se hayan abierto en pantalla.

Fuentes de configuración: [guía de Vite para Pages](https://vite.dev/guide/static-deploy#github-pages) y [documentación de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Estructura

```text
src/content.ts               Contenido editable, fotos, audio e introducción
src/components/IntroExperience.tsx  Presentación y timeline maestra
src/components/IntroTulip.tsx       Flor original para primeros planos
src/components/intro.css           Estilos aislados de la introducción
src/components/Gift.tsx       Apertura y repetición del regalo
src/components/Tulips.tsx     Ilustración procedural original
src/components/Memories.tsx   Álbum y visor accesible
src/components/Letter.tsx     Sobre y carta en cinco capítulos
src/components/letter-chapters.css  Navegación, progreso y lectura responsive
src/components/Music.tsx      Reproductor persistente, mute y bucle suave
src/components/SpecialMoment.tsx   Mi flor más bonita: foto, dedicatoria y GSAP
src/components/special-moment.css  Composición editorial responsive de esta sección
src/animation/gsap.ts         Registro, preferencia de movimiento y floración
src/animation/useEntrances.ts Entradas ScrollTrigger por sección
src/App.tsx                  Composición y reinicio
src/index.css                Variables, diseño y movimiento reducido
public/photos/               Diez fotografías reales y futuras incorporaciones
public/audio/                MP4 de audio del aniversario
public/licenses/             Licencias de fuentes
tests/                       Experiencia, recursos y progreso de animaciones
scripts/capture-demo.mjs     Capturas y videos reproducibles
.github/workflows/pages.yml  Publicación manual
.agents/skills/              UI UX Pro Max y ocho skills oficiales de GSAP
```

## Verificación y límites

Consulta `INFORME.md` para los resultados y pendientes. Playwright comprueba Chromium, emulación móvil Chrome y emulación iPhone con WebKit; esto **no equivale** a probar teléfonos físicos.

WebKit en este Windows rechaza el WAV PCM de prueba con `MEDIA_ERR_SRC_NOT_SUPPORTED`, también en una reproducción aislada. Solo esa prueba se omite en WebKit/Windows; las demás se ejecutan. El archivo MP4 real se prueba en Chromium escritorio, Chrome móvil y WebKit móvil emulados, incluidos volumen, mute y dos reinicios del bucle. La omisión afecta solo al fixture WAV antiguo. Actions ejecuta la suite completa en macOS, con una pila de reproducción más cercana a Safari y sin esa exclusión; el trabajo de despliegue sigue en Ubuntu. Hay que comprobar la canción definitiva en un iPhone real. [Playwright explica las diferencias de códecs por sistema operativo](https://playwright.dev/docs/browsers#webkit).

## Referencias y autoría

### Skills de GSAP y dependencias de animación

Instaladas las ocho skills oficiales de [greensock/gsap-skills](https://github.com/greensock/gsap-skills) en `.agents/skills/`: `gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline` y `gsap-utils`. El CLI confirma su asociación a Codex; `skills-lock.json` registra su procedencia.

Comandos utilizados desde la raíz del proyecto:

```sh
npx skills add https://github.com/greensock/gsap-skills --list
npx skills add https://github.com/greensock/gsap-skills --agent codex --yes
npm install gsap @gsap/react
npx skills list --agent codex
```

Versiones instaladas: GSAP 3.15.0 y `@gsap/react` 2.1.2. El regalo, la floración, el sobre y las entradas al desplazarse conservan GSAP con `useGSAP`, selectores acotados y limpieza automática. Las ocho skills están instaladas localmente; no fue necesario reinstalarlas en esta iteración.

### Diseño y licencias

`DESIGN.md` registra las referencias, el sistema visual y la instalación de UI UX Pro Max (incluido el rechazo de `--dry-run` en 2.15.0 y la revisión temporal alternativa). La skill está instalada en `.agents/skills/ui-ux-pro-max/SKILL.md` y fue leída/aplicada durante el desarrollo.

No se copiaron modelos, animaciones ni imágenes de los sitios de referencia. Tipografías Cormorant Garamond y DM Sans bajo SIL Open Font License, con textos incluidos en `public/licenses/`. Dependencias y versiones exactas: `package-lock.json`.

## Revisar las animaciones

El regalo dura **4,8 segundos**: anticipación → lazo → tapa → tallos y capullos → pétalos → mensaje. La carta completa su secuencia en aproximadamente **4,4 segundos**. Ambas se pueden omitir o repetir. La preferencia de movimiento reducido se respeta también si cambia con la página abierta.

`tests/motion.spec.ts` comprueba estados iniciales, intermedios y finales con `reducedMotion: "no-preference"`. La carta se muestrea dentro de `requestAnimationFrame` para que la latencia de las capturas no haga perder los estados intermedios. WebKit expone las transformaciones SVG mediante su matriz de presentación, por lo que se usa esa matriz cuando el transform CSS es `none`.

Para generar una demostración local de la compilación:

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
# En una segunda terminal:
npm run demo
```

Abre `artifacts/animaciones/index.html`: contiene fotogramas y videos WebM con controles. Se genera localmente y no forma parte de `dist`. Puedes cambiar el destino con `DEMO_OUTPUT` y la URL con `DEMO_URL`. La entrega incluye esa galería en la carpeta hermana `animaciones/`.

Consulta `ANIMACIONES.md` para el registro de la segunda iteración y `INTRODUCCION.md` para la nueva presentación y su verificación.

## Introducción floral

La introducción se muestra al cargar la página. **Saltar introducción** o Escape llevan directamente al contenido. Al final de la página, **Repetir la introducción floral** vuelve a abrirla sin reiniciar el álbum ni la carta.

Personaliza `story.intro` en `src/content.ts`: titular, frase de la hoja, nota del sobre, instrucción y fechas. El mensaje principal reutiliza `story.reveal`; la fecha del pie utiliza `story.anniversary`.

Con movimiento reducido, abrir el sobre muestra directamente el mensaje y un botón para entrar. **Ver animación completa** autoriza solo esa reproducción de la introducción; no cambia Windows, el navegador ni la preferencia de las demás secciones. El modo tranquilo permite scroll propio en pantallas cortas o con texto ampliado.

```sh
# Con npm run preview activo en otra terminal:
npm run demo:intro
```

Genera `artifacts/intro/index.html`, 14 capturas principales, dos videos WebM y `verificacion.json`. Las grabaciones se realizan en pasadas independientes de las capturas. `INTRO_OUTPUT` cambia el directorio de salida; `DEMO_URL` cambia la dirección del servidor. Estos archivos no forman parte del sitio desplegado.

La entrega incluye [la galería de introducción](../intro/index.html), además del proyecto ZIP. No se necesitan fotografías ni audio para usarla.

## Personalización del 26 de octubre

Consulta `PERSONALIZACION.md` para el inventario de fotos, el análisis del MP4, los archivos modificados y las pruebas actuales. El ZIP local actualizado incluye las fotografías y el audio reales. No se publicó nada ni se cambió la configuración manual de GitHub Pages.
