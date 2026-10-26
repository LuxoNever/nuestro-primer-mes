export type Memory = {
  id: string;
  src: string | null;
  title: string;
  date: string | null;
  description: string;
  tone: number;
  position?: string;
};

// Rutas relativas a public/, sin una barra inicial. Deja null hasta añadir el archivo.
export const story = {
  title: "Nuestro primer mes juntos",
  start: { iso: "2026-09-26", label: "26.09.2026" },
  anniversary: { iso: "2026-10-26", label: "26.10.2026" },
  intro: {
    title: "Para ti, mi preciosa...",
    paper: "Para mi preciosa",
    envelopeNote: "con amor, siempre",
    hint: "Toca para abrir tu sorpresa 💜",
    dates: "26 de septiembre — 26 de octubre de 2026",
  },
  welcome: {
    dateLine: "26 DE OCTUBRE DE 2026 · SOLO PARA TI",
    title: ["Un mes contigo.", "Toda una vida", "por soñar."],
    note: "Tengo una sorpresa para ti, mi amor...",
    description:
      "Un pequeño regalo, un jardín de tus flores favoritas y todo lo que mi corazón quiere decirte.",
    giftNote: "para mi persona favorita",
  },
  anniversaryHeading: ["Qué suerte la mía,", "que seas tú."],
  albumHeading: ["Nuestros mejores", "momentos"],
  albumNote: "Pequeños recuerdos de todo lo bonito que hemos vivido juntos.",
  letterHeading: ["Hay cosas que", "solo quiero decirte a ti."],
  final: {
    title: ["Por muchos meses más", "a tu lado."],
    message: "Mi reina, lo más bonito todavía está por florecer.",
  },
  dedication:
    "Un mes de nosotros. Y tantas ganas de seguir eligiéndote, de cuidarte y de descubrir la vida a tu lado. Este pequeño jardín es para ti, Hermosa.",
  reveal: "Feliz primer mes, mi amor",
  letter: {
    greeting: "Mi reina 💜",
    paragraphs: [
      "Bb, hoy es un día muy especial para nosotros. Un día como hoy, hace un mes, fui a buscarte porque sabía que no quería perderte y porque deseaba con todo mi corazón arreglar lo nuestro.",
      "Una vez te dije que aquel día fue el mejor de mi vida, y lo sigo pensando. Recuerdo lo nervioso que estaba, pero eran más grandes mis ganas de verte, de estar contigo y de volver a tenerte entre mis brazos.",
      "Mi amor, reconozco que cometí errores y que te hice daño. Hay cosas que quisiera haber hecho de otra manera, pero hoy quiero demostrarte con mis acciones cuánto he aprendido y cuánto deseo cuidar nuestro amor. Quiero sanar contigo, recuperar cada sonrisa y construir una vida hermosa a tu lado.",
      "Quiero que nuestro «te amo» dure para siempre. Te prometí que algún día te llevaría al altar y te vestiría de blanco, y es una promesa que guardo con muchísimo amor en mi corazón. Sé que en esta vida encontraremos dificultades, pero también creo que, si permanecemos juntos, unidos como esposos, siendo una sola carne, podremos enfrentar cualquier problema que se presente.",
      "Hay algo que nunca quiero que olvides, Johana...",
      "Una vez me preguntaste si de verdad valía la pena. Y quiero que sepas que mi respuesta siempre será sí, mi amor, mil veces sí.",
      "Sí vales la pena. Vale la pena luchar por nuestro amor, aprender, cambiar, crecer y construir algo bonito contigo.",
      "Eres como un diamante escondido entre tantas piedras, como esa aguja en un pajar que parece imposible encontrar. Eres tan única y especial que a veces todavía me cuesta creer lo afortunado que soy de tenerte en mi vida.",
      "Porque como tú, mi amor, no hay dos. No existe otra Johana en este mundo, y tampoco existe alguien con quien yo quiera compartir mi vida tanto como contigo.",
      "A veces siento que las palabras se quedan demasiado cortas para expresar todo lo que llevo en el corazón. Por eso me encanta demostrarte con pequeños detalles y acciones lo importante que eres para mí, lo mucho que te valoro y lo inmenso que es mi amor por ti.",
      "Hoy cumplimos nuestro primer mes, mi preciosa, y deseo de todo corazón que sea apenas el comienzo de una historia llena de recuerdos, sueños cumplidos, abrazos, risas y muchísimo amor.",
      "Feliz primer mes juntos, mi reina. Que este sea el primero de muchos, muchísimos aniversarios más.",
      "Te amo con todo mi corazón, bb. Hoy, mañana y todos los días que la vida nos regale. 💜",
    ],
    closing: "Con todo mi amor,",
    signature: "Tu esclavo. ♡",
  },
  specialMoment: {
    eyebrow: "UN DETALLE, SOLO PARA TI",
    title: "Mi flor más bonita",
    src: "photos/Mi flor más bonita.jpeg" as string | null,
    alt: "Mi esposa con el ramo de flores lavanda que le regalé",
    // Dedicatoria definitiva, transcrita literalmente del texto del autor.
    dedication: [
      "Te regalé flores, pero mi flor más bonita siempre vas a ser tú.",
      "Mi amor, cada vez que veo esta foto recuerdo lo mucho que te amo y lo afortunado que soy de tenerte en mi vida.",
      "Verte con las flores que te regalé me llena de paz y tranquilidad, y me recuerda que estoy con la chica de mis sueños, esa persona tan hermosa y especial con la que quiero compartir mi vida.",
      "Quiero darte siempre lo mejor de mí, bb, porque tú me das fuerzas para seguir adelante y me inspiras a ser mejor cada día. Quiero cuidarte, hacerte feliz y seguir construyendo muchos momentos bonitos a tu lado.",
      "Te mereces el mundo entero, mi amor… pero lo que quizás no sabes es que, para mí, tú ya eres mi mundo.",
      "Te amo muchísimo, mi preciosa. 💜",
    ],
    closing: "Con todo mi amor,",
    signature: "Siempre tuyo",
    caption: "Tú, haciendo más bonito mi mundo.",
    note: "Aquí guardaremos mi flor más bonita.",
    heartHint: "Un pétalo para ti",
    heartMessage: "Y todos los demás también serían para ti, mi preciosa. 💜",
  },
  music: {
    // El MP4 suministrado contiene únicamente audio; se reproduce sin conversión.
    src: "audio/cancion-aniversario.mp4" as string | null,
    title: "Nuestra canción",
    initialVolume: 0.35,
    // Límites verificados para esta canción. Restablecer a 0/null al cambiarla.
    loopStart: 0.85,
    loopEnd: 199.75 as number | null,
    fadeSeconds: 0.35,
    // Fundido al entrar a la página tras tocar el sobre; independiente del bucle.
    introFadeSeconds: 1.2,
  },
};

// Metadatos de presentación. from/to son índices de slice (to no se incluye).
// Los trece párrafos originales permanecen únicamente en story.letter.paragraphs.
export const letterChapters = [
  { title: "Aquel día que volví a ti", from: 0, to: 2 },
  { title: "Lo que quiero construir contigo", from: 2, to: 4 },
  { title: "Sí, mi amor, mil veces sí", from: 4, to: 7 },
  { title: "Porque como tú no hay dos", from: 7, to: 10 },
  { title: "El primero de muchos", from: 10, to: 13 },
] as const;

// El orden de este array es el del álbum: portada 02, secundaria 01, luego 03–10.
// Se conservan las extensiones .jpeg de los archivos reales; sin fechas ni lugares.
export const memories: Memory[] = [
  {
    id: "foto-02",
    src: "photos/02.jpeg",
    title: "Tú y yo",
    date: null,
    description: "",
    tone: 0,
    position: "50% 40%",
  },
  {
    id: "foto-01",
    src: "photos/01.jpeg",
    title: "Contigo",
    date: null,
    description: "",
    tone: 1,
    position: "50% 40%",
  },
  {
    id: "foto-03",
    src: "photos/03.jpeg",
    title: "Cerquita",
    date: null,
    description: "",
    tone: 2,
    position: "50% 40%",
  },
  {
    id: "foto-04",
    src: "photos/04.jpeg",
    title: "Mi alegría",
    date: null,
    description: "",
    tone: 3,
    position: "50% 40%",
  },
  {
    id: "foto-05",
    src: "photos/05.jpeg",
    title: "Nosotros",
    date: null,
    description: "",
    tone: 0,
    position: "50% 40%",
  },
  {
    id: "foto-06",
    src: "photos/06.jpeg",
    title: "Qué suerte",
    date: null,
    description: "",
    tone: 1,
    position: "50% 40%",
  },
  {
    id: "foto-07",
    src: "photos/07.jpeg",
    title: "A tu lado",
    date: null,
    description: "",
    tone: 2,
    position: "50% 40%",
  },
  {
    id: "foto-08",
    src: "photos/08.jpeg",
    title: "Mi lugar",
    date: null,
    description: "",
    tone: 3,
    position: "50% 40%",
  },
  {
    id: "foto-09",
    src: "photos/09.jpeg",
    title: "Así, juntos",
    date: null,
    description: "",
    tone: 0,
    position: "50% 40%",
  },
  {
    id: "foto-10",
    src: "photos/10.jpeg",
    title: "Siempre tú",
    date: null,
    description: "",
    tone: 1,
    position: "50% 40%",
  },
];

export function assetUrl(path: string | null) {
  return path
    ? `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`
    : undefined;
}
