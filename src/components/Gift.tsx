import { useRef, useState } from "react";
import { Tulips } from "./Tulips";
import { story } from "../content";
import {
  gsap,
  useGSAP,
  useReducedMotion,
  bloomTimeline,
  ScrollTrigger,
} from "../animation/gsap";

export function Gift() {
  const [phase, setPhase] = useState<"closed" | "opening" | "open">("closed");
  const root = useRef<HTMLElement>(null);
  const art = useRef<HTMLDivElement>(null);
  const master = useRef<gsap.core.Timeline | null>(null);
  const bloomReplay = useRef<gsap.core.Timeline | null>(null);
  const hasOpened = useRef(false);
  const reduced = useReducedMotion();
  const { contextSafe } = useGSAP(
    () => {
      const select = gsap.utils.selector(root);
      const mobile = window.innerWidth <= 700;
      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          setPhase("open");
          ScrollTrigger.refresh();
        },
      });
      master.current = timeline;
      timeline
        .addLabel("anticipation", 0)
        .addLabel("untie", 0.2)
        .addLabel("lift", 0.65)
        .addLabel("grow", 1.05)
        .addLabel("bloom", 2.05)
        .addLabel("message", 3.9)
        .addLabel("settled", 4.8);
      timeline.fromTo(
        select(".gift-object"),
        { y: 0, rotation: -9, scale: 1 },
        { y: -9, rotation: -6, scale: 1.035, duration: 0.22 },
        "anticipation",
      );
      timeline.to(
        select(".gift-object"),
        {
          y: mobile ? 70 : 64,
          rotation: -5,
          scale: mobile ? 0.72 : 0.82,
          duration: 1.05,
        },
        "lift",
      );
      timeline.fromTo(
        select(".bow-left"),
        { x: 0, rotation: 28, scaleX: 1, opacity: 1 },
        { x: -28, rotation: -8, scaleX: 0.25, opacity: 0, duration: 0.65 },
        "untie",
      );
      timeline.fromTo(
        select(".bow-right"),
        { x: 0, rotation: -35, scaleX: -1, opacity: 1 },
        { x: 28, rotation: 5, scaleX: -0.25, opacity: 0, duration: 0.65 },
        "untie",
      );
      timeline.fromTo(
        select(".ribbon-tail"),
        { y: 0, rotation: -22, opacity: 1 },
        { y: 38, rotation: 18, opacity: 0, duration: 0.65 },
        "untie",
      );
      timeline.fromTo(
        select(".bow-knot"),
        { scale: 1, opacity: 1 },
        { scale: 0.6, opacity: 0, duration: 0.4 },
        "untie+=0.15",
      );
      timeline.fromTo(
        select(".box-lid"),
        { x: 0, y: 0, z: 0, rotation: 0, rotationX: 0, opacity: 1 },
        {
          x: 85,
          y: -175,
          z: 90,
          rotation: 25,
          rotationX: 40,
          opacity: 0,
          duration: 1.2,
        },
        "lift",
      );
      timeline.fromTo(
        select(".gift-whisper"),
        { opacity: 1 },
        { opacity: 0, duration: 0.4 },
        "untie",
      );
      // The bouquet is full size before its buds unfold. No bloom hidden by a scale-in.
      timeline.fromTo(
        select(".gift-bouquet"),
        { opacity: 0, y: mobile ? -16 : -20, scale: mobile ? 0.93 : 1 },
        { opacity: 1, duration: 0.3 },
        "grow",
      );
      timeline.add(
        bloomTimeline(root.current!.querySelector(".gift-bouquet")!),
        "grow",
      );
      select(".burst i").forEach((particle: HTMLElement, i: number) => {
        const angle = (i * Math.PI) / 6;
        timeline.fromTo(
          particle,
          { x: 0, y: 0, opacity: 0, rotation: 0, scale: 0.4 },
          {
            x: Math.cos(angle) * 150,
            y: Math.sin(angle) * 140 - 65,
            opacity: 0.85,
            rotation: i * 23,
            scale: 1,
            duration: 1,
          },
          1.2 + i * 0.025,
        );
        timeline.to(
          particle,
          { y: "+=32", opacity: 0, duration: 0.9 },
          2.2 + i * 0.025,
        );
      });
      timeline.fromTo(
        select(".reveal-copy"),
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.9 },
        "message",
      );
      if (hasOpened.current) timeline.progress(1).pause();
      return () => {
        bloomReplay.current?.kill();
        bloomReplay.current = null;
        master.current = null;
      };
    },
    { scope: root, dependencies: [reduced], revertOnUpdate: true },
  );

  function open() {
    hasOpened.current = true;
    bloomReplay.current?.pause();
    if (!master.current) {
      setPhase("open");
      return;
    }
    master.current.pause(0);
    setPhase(reduced ? "open" : "opening");
    if (reduced) master.current.progress(1).pause();
    else master.current.restart();
    ScrollTrigger.refresh();
    if (window.innerWidth <= 700)
      art.current?.scrollIntoView({
        block: "center",
        behavior: reduced ? "instant" : "smooth",
      });
  }
  const skip = () => {
    master.current?.progress(1).pause();
    setPhase("open");
    root.current
      ?.querySelector<HTMLButtonElement>(".hero-copy .primary")
      ?.focus({ preventScroll: true });
  };
  function repeatBloom() {
    contextSafe(() => {
      if (!bloomReplay.current) {
        bloomReplay.current = bloomTimeline(
          root.current!.querySelector(".gift-bouquet")!,
        );
      } else {
        bloomReplay.current.restart();
      }
      if (reduced) bloomReplay.current.progress(1).pause();
      if (window.innerWidth <= 700)
        art.current?.scrollIntoView({
          block: "center",
          behavior: reduced ? "instant" : "smooth",
        });
    })();
  }
  return (
    <section
      ref={root}
      className={`welcome ${reduced ? "instant" : ""} ${phase}`}
      id="sorpresa"
      aria-labelledby="welcome-title"
    >
      <div className="hero-copy">
        <p className="eyebrow">
          <span /> {story.welcome.dateLine}
        </p>
        <h1 id="welcome-title">
          {story.welcome.title[0]}
          <br />
          <em>{story.welcome.title[1]}</em>
          <br />
          {story.welcome.title[2]}
        </h1>
        <p className="hero-note">{story.welcome.note}</p>
        <p className="hero-description">{story.welcome.description}</p>
        <button className="button primary" onClick={open}>
          {phase === "closed" ? "Abre tu sorpresa" : "Volver a abrir el regalo"}{" "}
          <span aria-hidden="true">↗</span>
        </button>
        <p className="touch-hint">
          Toca el regalo o el botón. Este momento es tuyo.
        </p>
        <div className="hero-dates">
          <time dateTime={story.start.iso}>{story.start.label}</time>
          <span aria-hidden="true">── ♡ ──</span>
          <time dateTime={story.anniversary.iso}>
            {story.anniversary.label}
          </time>
        </div>
      </div>
      <div className="gift-art" ref={art}>
        <div className="ambient" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} style={{ "--i": i } as React.CSSProperties} />
          ))}
        </div>
        <div className="arch" aria-hidden="true">
          <span className="orbit orbit-one" />
          <span className="orbit orbit-two" />
          <span className="art-star star-one">✧</span>
          <span className="art-star star-two">✦</span>
          <span className="art-heart">♡</span>
        </div>
        <p className="handwritten gift-whisper">{story.welcome.giftNote}</p>
        <div className="gift-bouquet">
          <Tulips />
        </div>
        <button
          className="gift-hit"
          onClick={open}
          aria-label="Abrir la caja de regalo"
        >
          <span className="gift-object" aria-hidden="true">
            <span className="box-base">
              <span className="box-ribbon" />
              <span className="box-label">
                con amor
                <br />
                <b>para ti</b>
                <span>♡</span>
              </span>
            </span>
            <span className="box-lid">
              <span className="lid-band" />
              <span className="bow bow-left" />
              <span className="bow bow-right" />
              <span className="bow-knot" />
              <span className="ribbon-tail" />
            </span>
          </span>
        </button>
        <div className="burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ "--i": i } as React.CSSProperties}>
              {i % 3 === 0 ? "♡" : "✧"}
            </i>
          ))}
        </div>
        <span className="art-caption">
          UN PEQUEÑO DETALLE. UN AMOR INMENSO.
        </span>
      </div>
      <div className="reveal-message" aria-live="polite">
        {phase === "opening" && (
          <button className="text-button" onClick={skip}>
            Saltar animación →
          </button>
        )}
        <div
          className="reveal-copy"
          hidden={phase === "closed"}
          inert={phase !== "open"}
          aria-hidden={phase !== "open"}
        >
          <p className="eyebrow">EL PRIMERO DE MUCHOS</p>
          <h2>
            {story.reveal} <span className="purple-heart">♥</span>
          </h2>
          <div className="reveal-actions">
            <button className="text-button" onClick={repeatBloom}>
              ↻ Volver a florecer
            </button>
            <a className="text-button" href="#recuerdos">
              Descubrir nuestros recuerdos ↓
            </a>
          </div>
        </div>
      </div>
      <a href="#nosotros" className="scroll-cue">
        <span>LA HISTORIA APENAS COMIENZA</span>
        <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
