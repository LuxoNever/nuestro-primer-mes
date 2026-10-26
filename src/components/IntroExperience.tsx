import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, useGSAP, useReducedMotion } from "../animation/gsap";
import { story } from "../content";
import { IntroTulip } from "./IntroTulip";
import "./intro.css";

type Phase =
  | "waiting"
  | "opening"
  | "emerging"
  | "expanding"
  | "immersed"
  | "message"
  | "leaving";
type Props = {
  onOpen: () => void;
  onReveal: () => void;
  onDone: () => void;
  onMusicHost: (element: HTMLDivElement | null) => void;
};

export function IntroExperience({ onOpen, onReveal, onDone, onMusicHost }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const envelope = useRef<HTMLButtonElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const forced = useRef(false);
  const [mode, setMode] = useState<"idle" | "full" | "quiet">("idle");
  const [phase, setPhase] = useState<Phase>("waiting");
  const reduced = useReducedMotion();
  const [layout] = useState(() => {
    const mobile = window.innerWidth <= 700;
    const limited = navigator.hardwareConcurrency <= 4;
    return {
      columns: mobile ? (limited ? 4 : 5) : 8,
      rows: mobile ? 7 : limited ? 5 : 6,
    };
  });
  const count = layout.columns * layout.rows;

  useEffect(() => {
    const oldOverflow = document.documentElement.style.overflow;
    const oldBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    envelope.current?.focus({ preventScroll: true });
    return () => {
      document.documentElement.style.overflow = oldOverflow;
      document.body.style.overflow = oldBodyOverflow;
    };
  }, []);

  useGSAP(
    () => {
      if (mode === "idle" || !root.current) return;
      if (mode === "full" && reduced && !forced.current) {
        setMode("quiet");
        return;
      }
      const select = gsap.utils.selector(root);
      if (mode === "quiet") {
        gsap.set(
          select(
            ".intro-invitation, .intro-envelope, .intro-hint, .intro-field, .intro-glow",
          ),
          { autoAlpha: 0 },
        );
        gsap.set(select(".intro-message"), { autoAlpha: 1 });
        setPhase("message");
        return;
      }
      const { width, height } = root.current.getBoundingClientRect();
      const blooms = select(".intro-bloom") as HTMLDivElement[];
      const master = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: onDone,
      });
      timeline.current = master;
      master
        .addLabel("envelope", 0)
        .addLabel("emerge", 0.95)
        .addLabel("expand", 1.85)
        .addLabel("immerse", 4.25)
        .addLabel("part", 5.05)
        .addLabel("message", 5.45)
        .addLabel("page", 7.45);
      master.call(() => setPhase("opening"), [], 0);
      master.to(
        select(".intro-seal"),
        { scale: 0.8, rotation: -14, opacity: 0, duration: 0.38 },
        "envelope",
      );
      master.to(
        select(".intro-flap"),
        { rotationX: 180, duration: 0.8, transformOrigin: "50% 0" },
        0.25,
      );
      master.set(select(".intro-flap"), { zIndex: 0 }, 0.8);
      master.to(select(".intro-paper"), { y: -52, duration: 0.8 }, 0.6);
      master.to(
        select(".intro-invitation, .intro-hint, .intro-topline > span"),
        { opacity: 0, y: -12, duration: 0.6 },
        0.6,
      );
      master.fromTo(
        select(".intro-glow"),
        { opacity: 0, scale: 0.3 },
        { opacity: 0.7, scale: 1, duration: 1.2 },
        0.65,
      );
      master.to(
        select(".intro-envelope"),
        { scale: 0.84, y: 45, opacity: 0, duration: 1 },
        1.6,
      );
      master.call(() => setPhase("emerging"), [], "emerge");
      master.call(() => setPhase("expanding"), [], "expand");
      // Alternate rows stagger their final positions. Each independent head moves
      // from a compact spiral to a viewport-spanning field, with different depths.
      blooms.forEach((flower, i) => {
        const column = i % layout.columns;
        const row = Math.floor(i / layout.columns);
        const u = (column + (row % 2 ? 0.35 : 0.05)) / (layout.columns - 0.5);
        const v = row / (layout.rows - 1);
        const angle = i * 2.39996;
        const radius = 12 + Math.sqrt(i) * (width < 700 ? 9 : 13);
        const clusterX = Math.cos(angle) * radius;
        const clusterY = Math.sin(angle) * radius * 0.8 - 45;
        const originX = (0.5 - u) * width;
        const originY = (0.5 - v) * height;
        const layer = i % 3;
        const rotation = Math.sin(i * 7.1) * 45;
        const delay = (i % 9) * 0.045;
        master.fromTo(
          flower,
          {
            x: originX,
            y: originY + 12,
            z: -220,
            scale: 0.025,
            rotation: rotation - 24,
            rotationY: -25 + layer * 20,
            rotationX: 15,
            autoAlpha: 0,
          },
          {
            x: originX + clusterX,
            y: originY + clusterY,
            z: -70 + layer * 35,
            scale: 0.34 + layer * 0.045,
            rotation,
            rotationY: -12 + layer * 12,
            rotationX: -8,
            autoAlpha: 1,
            duration: 1.1,
            ease: "power2.out",
          },
          0.95 + delay + Math.floor(i / 9) * 0.07,
        );
        master.to(
          flower,
          {
            x: 0,
            y: 0,
            z: 45 + layer * 55,
            scale: 1.08 + layer * 0.05,
            rotation: rotation * 0.75,
            rotationY: -9 + layer * 9,
            rotationX: 5 - layer * 6,
            duration: 2.05,
            ease: "power2.inOut",
          },
          1.85 + delay,
        );
        master.to(
          flower,
          {
            z: 75 + layer * 65,
            rotation: rotation * 0.75 + (i % 2 ? 3 : -3),
            duration: 0.75,
            ease: "sine.inOut",
          },
          4.25,
        );
        master.to(
          flower,
          {
            x: (u - 0.5) * width * 0.9,
            y: (v - 0.5) * height * 0.8,
            z: 400 + layer * 80,
            scale: 1.38,
            opacity: 0,
            duration: 1.25,
            ease: "power2.in",
          },
          5.05 + delay,
        );
      });
      master.to(select(".intro-glow"), { opacity: 0, duration: 0.7 }, 3.6);
      master.fromTo(
        select(".intro-heart"),
        { opacity: 0, scale: 0.3, y: 30 },
        { opacity: 0.7, scale: 1, y: -12, stagger: 0.12, duration: 0.8 },
        4.85,
      );
      master.call(() => setPhase("immersed"), [], "immerse");
      master.call(() => setPhase("message"), [], "message");
      master.fromTo(
        select(".intro-message"),
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 1.1 },
        "message",
      );
      master.call(
        () => {
          setPhase("leaving");
          onReveal();
        },
        [],
        "page",
      );
      master.to(
        root.current,
        { opacity: 0, duration: 0.85, ease: "sine.inOut" },
        "page",
      );
      return () => {
        timeline.current = null;
      };
    },
    { scope: root, dependencies: [mode, reduced], revertOnUpdate: true },
  );

  function begin(full = false) {
    if (mode === "full") return;
    onOpen();
    forced.current = full;
    setMode(reduced && !full ? "quiet" : "full");
  }
  function skip() {
    timeline.current?.pause();
    onDone();
  }
  useEffect(() => {
    const dialog = root.current;
    if (!dialog) return;
    // Native bubbling includes the music controls rendered through a portal.
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        timeline.current?.pause();
        onDone();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = Array.from(
        dialog!.querySelectorAll<HTMLElement>(
          "button:not(:disabled), a[href], input:not(:disabled)",
        ),
      ).filter(
        (element) =>
          getComputedStyle(element).visibility !== "hidden" &&
          element.getClientRects().length > 0,
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    dialog.addEventListener("keydown", handleKey);
    return () => dialog.removeEventListener("keydown", handleKey);
  }, [onDone]);
  return (
    <div
      ref={root}
      className="intro-experience"
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-title"
      data-phase={phase}
      data-motion={mode}
    >
      <div className="intro-topline">
        <span>UNA SORPRESA, SOLO PARA TI</span>
        <button className="intro-skip" onClick={skip}>
          Saltar introducción <span aria-hidden="true">↗</span>
        </button>
      </div>
      <div className="intro-invitation">
        <p className="eyebrow">CON TODO MI AMOR</p>
        <h1 id="intro-title">{story.intro.title}</h1>
      </div>
      <div className="intro-glow" aria-hidden="true" />
      <button
        ref={envelope}
        className="intro-envelope"
        onClick={() => begin()}
        disabled={mode !== "idle"}
        aria-label="Abrir sobre de la introducción"
      >
        <span className="intro-paper">
          <span className="handwritten">{story.intro.paper}</span>
          <span>♡</span>
        </span>
        <span className="intro-front" />
        <span className="intro-flap" />
        <span className="intro-seal" aria-hidden="true">
          ♡
        </span>
        <span className="intro-envelope-note" aria-hidden="true">
          {story.intro.envelopeNote}
        </span>
      </button>
      <div className="intro-hint">
        <p>{story.intro.hint}</p>
        <span className="intro-little-line" />
      </div>
      <div
        className="intro-field"
        aria-hidden="true"
        style={
          {
            "--columns": layout.columns,
            "--rows": layout.rows,
          } as CSSProperties
        }
      >
        {Array.from({ length: count }, (_, i) => {
          const column = i % layout.columns;
          const row = Math.floor(i / layout.columns);
          return (
            <div
              key={i}
              className="intro-bloom"
              data-layer={i % 3}
              style={{
                left: `${((column + (row % 2 ? 0.35 : 0.05)) / (layout.columns - 0.5)) * 100}%`,
                top: `${(row / (layout.rows - 1)) * 100}%`,
                zIndex: i % 3,
              }}
            >
              <IntroTulip tone={i % 7 === 0 ? 3 : i % 3} />
            </div>
          );
        })}
      </div>
      <div
        className="intro-message"
        aria-live="polite"
        aria-hidden={phase !== "message" && phase !== "leaving"}
      >
        <span className="intro-message-heart" aria-hidden="true">
          ♡
        </span>
        <p className="eyebrow">EL PRIMERO DE MUCHOS</p>
        <h2>
          {story.reveal} <span className="intro-purple-heart">💜</span>
        </h2>
        <p className="intro-message-dates">{story.intro.dates}</p>
      </div>
      <div className="intro-hearts" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            className="intro-heart"
            key={i}
            style={{
              left: `${[8, 86, 5, 90, 48][i]}%`,
              top: `${[20, 21, 72, 70, 86][i]}%`,
            }}
          >
            ♡
          </span>
        ))}
      </div>
      {mode === "quiet" && (
        <button className="button primary intro-enter" onClick={skip}>
          Entrar a nuestra historia <span aria-hidden="true">↗</span>
        </button>
      )}
      {reduced && mode !== "full" && (
        <div className="intro-motion-choice">
          <p>Una bienvenida tranquila, como tú prefieras.</p>
          <button className="text-button" onClick={() => begin(true)}>
            Ver animación completa
          </button>
        </div>
      )}
      <div ref={onMusicHost} className="intro-music-host" />
      <p className="intro-bottom-note" aria-hidden="true">
        {story.anniversary.label.split(".").join(" · ")} <span>♡</span> NUESTRO
        PRIMER MES
      </p>
    </div>
  );
}
