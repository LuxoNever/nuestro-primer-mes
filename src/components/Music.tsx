import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { assetUrl, story } from "../content";

function bounds(element: HTMLAudioElement) {
  const duration = Number.isFinite(element.duration)
    ? element.duration
    : Infinity;
  const end = Math.min(story.music.loopEnd ?? duration, duration);
  const start = Math.min(
    Math.max(0, story.music.loopStart),
    Math.max(0, end - 1),
  );
  return {
    start,
    end,
    fade: Math.min(Math.max(0, story.music.fadeSeconds), (end - start) / 3),
  };
}

export type MusicHandle = {
  prepareIntro: () => void;
  revealIntro: () => void;
};

export function Music({ host = null, ref }: {
  host?: HTMLElement | null;
  ref?: Ref<MusicHandle>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"blocked" | "unavailable" | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [volume, setVolume] = useState(story.music.initialVolume);
  const [muted, setMuted] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);
  const intent = useRef(false);
  const request = useRef(0);
  const introAttempted = useRef(false);
  const manualPlayback = useRef(false);
  const introGate = useRef(false);
  const revealRequested = useRef(false);
  const introFadeStart = useRef<number | null>(null);
  const graph = useRef<{
    context: AudioContext;
    gain: GainNode;
    source: MediaElementAudioSourceNode;
  } | null>(null);
  const src = assetUrl(story.music.src);

  const envelope = useCallback(() => {
    const element = audio.current;
    if (!element) return;
    const { start, end, fade } = bounds(element);
    const time = element.currentTime;
    const level = muted || introGate.current ? 0 : volume;
    const loopFactor = fade
      ? Math.max(0, Math.min(1, (time - start) / fade, (end - time) / fade))
      : 1;
    const introEnd = introFadeStart.current === null
      ? null
      : introFadeStart.current + Math.max(0, story.music.introFadeSeconds);
    const introFactor = introEnd === null || story.music.introFadeSeconds <= 0
      ? 1
      : Math.max(0, Math.min(1, (time - introFadeStart.current!) / story.music.introFadeSeconds));
    if (introEnd !== null && time >= introEnd) introFadeStart.current = null;
    const factor = Math.min(loopFactor, introFactor);
    const advancing = !element.paused && !element.seeking && element.readyState >= 3;
    // Native mute is the silence guarantee where mobile volume setters are ignored.
    element.muted = muted || (introGate.current && !graph.current);
    const chain = graph.current;
    if (chain) {
      element.volume = 1;
      const now = chain.context.currentTime;
      chain.gain.gain.cancelScheduledValues(now);
      chain.gain.gain.setValueAtTime(level * factor, now);
      if (advancing && !introGate.current && introEnd !== null && time < introEnd)
        chain.gain.gain.linearRampToValueAtTime(level, now + Math.max(0.01, introEnd - time));
      else if (advancing && fade && time < start + fade)
        chain.gain.gain.linearRampToValueAtTime(
          level,
          now + Math.max(0.01, start + fade - time),
        );
      else if (advancing && fade && time > end - fade)
        chain.gain.gain.linearRampToValueAtTime(
          0,
          now + Math.max(0.01, end - time),
        );
    } else element.volume = level * factor;
  }, [muted, volume]);

  function revealIntro() {
    if (!introGate.current || !intent.current) return;
    revealRequested.current = true;
    const element = audio.current;
    // A slow download can finish after the page reveals. Keep it silent until seekable.
    if (!element || element.readyState < 1) return;
    const { start } = bounds(element);
    element.currentTime = start;
    introFadeStart.current = start;
    introGate.current = false;
    setPreparing(false);
    envelope();
  }

  function syncLoop() {
    const element = audio.current;
    if (!element) return;
    if (revealRequested.current && introGate.current) revealIntro();
    const { start, end } = bounds(element);
    // Native looping remains a fallback when background event delivery is delayed.
    // The configured boundaries remove only the supplied file's edge silence.
    if (
      intent.current &&
      element.readyState >= 1 &&
      Number.isFinite(end) &&
      (element.currentTime >= end || element.currentTime < start)
    )
      element.currentTime = start;
    envelope();
  }
  useEffect(() => {
    envelope();
  }, [envelope]);
  const dispose = useCallback((element: HTMLAudioElement | null) => {
    request.current += 1;
    intent.current = false;
    introGate.current = false;
    revealRequested.current = false;
    introFadeStart.current = null;
    element?.pause();
    element?.removeAttribute("src");
    element?.load();
    const chain = graph.current;
    if (chain) {
      chain.source.disconnect();
      chain.gain.disconnect();
      void chain.context.close().catch(() => {});
      graph.current = null;
    }
  }, []);
  useEffect(() => {
    const element = audio.current;
    return () => dispose(element);
  }, [src, dispose]);

  function fail(reason: "blocked" | "unavailable" = "unavailable") {
    const attempted = intent.current || introGate.current;
    intent.current = false;
    introGate.current = false;
    introFadeStart.current = null;
    audio.current?.pause();
    setError(reason);
    // A codec probe may fail before a gesture; do not unexpectedly open the panel.
    if (attempted) setExpanded(true);
    setPreparing(false);
    setPlaying(false);
    setPending(false);
  }
  async function startPlayback() {
    const element = audio.current;
    if (!element || !src) return;
    const token = ++request.current;
    intent.current = true;
    setPending(true);
    setError(null);
    try {
      // preload="none" is only a browser hint. No URL exists on the element
      // until this real user gesture, so native media loaders cannot prefetch it.
      if (element.getAttribute("src") !== src) element.setAttribute("src", src);
      // Construct/resume audio resources only in response to the visitor's gesture.
      if (!graph.current && typeof window.AudioContext === "function") {
        const context = new AudioContext();
        const source = context.createMediaElementSource(element);
        const gain = context.createGain();
        gain.gain.value = 0;
        source.connect(gain);
        gain.connect(context.destination);
        graph.current = { context, source, gain };
      }
      if (element.error) element.load();
      syncLoop();
      const resumed = graph.current?.context.resume();
      const started = element.play();
      await Promise.all([resumed, started]);
      if (request.current !== token || !intent.current) return;
      setPending(false);
      envelope();
    } catch (cause) {
      if (request.current === token)
        fail(cause instanceof DOMException && cause.name === "NotAllowedError" ? "blocked" : "unavailable");
    }
  }

  function prepareIntro() {
    if (!src || introAttempted.current || manualPlayback.current || intent.current) return;
    introAttempted.current = true;
    introGate.current = true;
    revealRequested.current = false;
    setPreparing(true);
    // Called synchronously by the envelope click, never by a GSAP callback/effect.
    void startPlayback();
  }
  useImperativeHandle(ref, () => ({ prepareIntro, revealIntro }));

  function toggle() {
    manualPlayback.current = true;
    introGate.current = false;
    revealRequested.current = false;
    introFadeStart.current = null;
    setPreparing(false);
    if (intent.current) {
      request.current += 1;
      intent.current = false;
      audio.current?.pause();
      setPending(false);
      envelope();
    } else void startPlayback();
  }

  const controls = (
    <aside className="music-widget" aria-label="Música opcional">
      {expanded && (
        <div className="music-panel" id="music-panel">
          <p>{story.music.title}</p>
          {src ? (
            <>
              <div className="music-actions">
                <button className="button primary" onClick={toggle}>
                  {playing || pending ? "Pausar" : "Reproducir"}
                </button>
                <button
                  className="music-mute"
                  onClick={() => setMuted((value) => !value)}
                  aria-pressed={muted}
                >
                  {muted ? "Activar sonido" : "Silenciar"}
                </button>
              </div>
              <label htmlFor="volume">
                Volumen <span>{Math.round(volume * 100)}%</span>
              </label>
              <input
                id="volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
              />
              {pending && <p role="status">Preparando nuestra canción…</p>}
              {preparing && !pending && <p role="status">Nuestra canción está lista para recibirte.</p>}
              {error && (
                <p role="status">
                  {error === "blocked"
                    ? "Tu navegador necesita otro toque. Pulsa Reproducir para escuchar nuestra canción."
                    : "La canción no está disponible por ahora. Puedes volver a intentarlo."}
                </p>
              )}
            </>
          ) : (
            <p className="music-empty">
              Nuestra canción llegará pronto.
              <br />
              Por ahora, disfruta este momento en silencio.
            </p>
          )}
        </div>
      )}
      <button
        className={`music-toggle ${playing ? "playing" : ""}`}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls={expanded ? "music-panel" : undefined}
        aria-label={
          expanded ? "Cerrar controles de música" : "Abrir controles de música"
        }
      >
        <span aria-hidden="true">♫</span>
        <span>{preparing ? "Preparando nuestra canción" : playing ? "Sonando contigo" : "Un poco de música"}</span>
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
    </aside>
  );

  return (
    <>
      {src && (
        <audio
          ref={audio}
          key={src}
          preload="none"
          loop
          onLoadedMetadata={syncLoop}
          onTimeUpdate={syncLoop}
          onSeeked={envelope}
          onPlaying={envelope}
          onWaiting={envelope}
          onPlay={() => {
            setPlaying(true);
            envelope();
          }}
          onPause={() => {
            setPlaying(false);
            // Some mobile policies pause a previously muted element when unmuted.
            if (intent.current) fail("blocked");
          }}
          onError={() => fail()}
        />
      )}
      {createPortal(controls, host ?? document.body)}
    </>
  );
}
