import { useId, useRef, useState } from "react";
import { assetUrl, story } from "../content";
import { gsap, ScrollTrigger, useGSAP, useReducedMotion } from "../animation/gsap";
import "./special-moment.css";

// Original botanical ornament. It sits behind the frame, never over the photograph.
function SpecialTulip({ mirror = false }: { mirror?: boolean }) {
  const id = `special-${useId().replace(/:/g, "")}`;
  return (
    <svg viewBox="0 0 115 270" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="20" y1="30" x2="92" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#eee0f4" /><stop offset=".55" stopColor="#c8a2c8" /><stop offset="1" stopColor="#9775ac" />
        </linearGradient>
      </defs>
      <g transform={mirror ? "translate(115 0) scale(-1 1)" : undefined}>
        <path d="M54 251C65 181 40 146 52 89M72 253C67 199 79 162 85 140" stroke="#8f9d82" strokeWidth="2" strokeLinecap="round" />
        <path d="M56 220C25 202 14 166 20 146C50 166 59 190 56 220Z" fill="#b6bca6" />
        <path d="M57 194C85 180 100 154 97 134C71 152 60 172 57 194Z" fill="#c6cbb7" />
        <path d="M52 102C29 93 23 60 33 28C48 39 54 57 54 70C57 49 68 32 79 24C90 58 81 93 52 102Z" fill={`url(#${id})`} stroke="#a78ab5" strokeWidth=".8" />
        <path d="M52 102C33 93 35 63 42 52C54 57 65 78 52 102Z" fill="#d8bde3" />
        <path d="M52 102C72 97 78 73 69 50C55 62 48 81 52 102Z" fill="#b48ec5" />
        <path d="M54 101C44 95 43 78 52 65C66 76 65 96 54 101Z" fill="#e9d5f5" />
        <path d="M85 150C71 142 69 121 76 106L85 118L96 104C105 125 100 145 85 150Z" fill={`url(#${id})`} stroke="#a78ab5" strokeWidth=".7" />
        <path d="M85 150C79 141 80 130 86 123C94 136 94 145 85 150Z" fill="#e9d5f5" />
        <path d="M40 43C37 62 41 82 47 89M75 38C77 52 73 68 70 73" stroke="#fff9f6" strokeOpacity=".65" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function SpecialMoment() {
  const [failed, setFailed] = useState(false);
  const [sent, setSent] = useState(false);
  const root = useRef<HTMLElement>(null);
  const reveal = useRef<gsap.core.Timeline | null>(null);
  const burst = useRef<gsap.core.Timeline | null>(null);
  const revealed = useRef(false);
  const reduced = useReducedMotion();
  const moment = story.specialMoment;
  const src = assetUrl(moment.src);
  const { contextSafe } = useGSAP(() => {
    if (!root.current) return;
    if (reduced || revealed.current) {
      revealed.current = true;
      return;
    }
    const select = gsap.utils.selector(root);
    const canRevealWithMask = CSS.supports("clip-path", "inset(0% 35% 0% 35%)");
    const sequence = gsap.timeline({
      paused: true,
      defaults: { ease: "power2.out", immediateRender: false },
      onStart: () => { revealed.current = true; },
    });
    reveal.current = sequence;
    sequence
      .fromTo(select(".special-frame"), { y: 26, rotation: -2.5, rotationX: 5, scale: 0.97 }, { y: 0, rotation: -0.8, rotationX: 0, scale: 1, duration: 2.35 }, 0)
      // A light rectangular mask opens from the center; no overlay paints over her.
      .fromTo(select(".special-photo"),
        canRevealWithMask ? { clipPath: "inset(0% 35% 0% 35%)" } : { opacity: 0.08 },
        { ...(canRevealWithMask ? { clipPath: "inset(0% 0% 0% 0%)" } : { opacity: 1 }), duration: 2.05, ease: "sine.inOut" }, 0.15)
      .fromTo(select(".special-botanical-left"), { x: 12, rotation: 5, opacity: 0.45 }, { x: -18, rotation: -7, opacity: 1, duration: 2.2, ease: "sine.inOut" }, 0)
      .fromTo(select(".special-botanical-right"), { x: -12, rotation: -5, opacity: 0.45 }, { x: 18, rotation: 7, opacity: 1, duration: 2.2, ease: "sine.inOut" }, 0)
      .fromTo(select(".special-reveal"), { y: 15, opacity: 0.08 }, { y: 0, opacity: 1, duration: 1.05, stagger: { amount: 0.8 } }, 1.15)
      .set(select(".special-frame, .special-photo, .special-reveal, .special-botanical"), { clearProps: "transform,opacity,clipPath,willChange" }, 3);
    const trigger = ScrollTrigger.create({
      trigger: root.current,
      start: "top 82%",
      once: true,
      onEnter: () => { sequence.play(); },
    });
    const finish = () => {
      revealed.current = true;
      trigger.kill();
      sequence.progress(1);
    };
    const element = root.current;
    element.addEventListener("focusin", finish);
    return () => {
      element.removeEventListener("focusin", finish);
      reveal.current = null;
      burst.current = null;
    };
  }, { scope: root, dependencies: [reduced], revertOnUpdate: true });

  const sendHeart = () => contextSafe(() => {
    setSent(true);
    if (reduced || !root.current) return;
    burst.current?.kill();
    const petals = root.current.querySelectorAll(".special-petal");
    const heart = root.current.querySelector(".special-heart-icon");
    burst.current = gsap.timeline();
    burst.current
      .fromTo(heart, { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "back.out(2)" }, 0)
      .fromTo(petals, { x: 0, y: 0, scale: 0.4, opacity: 0, rotation: 0 }, {
        x: (index) => [-25, 23, 60, 83, -8, 48, 18, 72][index],
        y: (index) => [-65, -95, -80, -46, -36, -54, -68, -104][index],
        rotation: (index) => index * 37 - 80,
        scale: 1,
        opacity: 0.9,
        duration: 0.8,
        stagger: 0.035,
        ease: "power2.out",
      }, 0)
      .to(petals, { opacity: 0, duration: 0.45, stagger: 0.025 }, 0.7);
  })();
  return (
    <section
      ref={root}
      className="special-moment section-wrap"
      id="mi-flor"
      aria-labelledby="special-title"
    >
      <div className="special-visual">
        <div className="special-botanical special-botanical-left" aria-hidden="true"><SpecialTulip /></div>
        <div className="special-botanical special-botanical-right" aria-hidden="true"><SpecialTulip mirror /></div>
        <figure className="special-frame">
          <div className={`special-photo ${src && !failed ? "has-photo" : ""}`}>
        {src && !failed ? (
          <img
            src={src}
            alt={moment.alt}
            width={1280}
            height={1280}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        ) : (
          <div className="special-placeholder">
            <span aria-hidden="true">♡</span>
            <p>{moment.note}</p>
          </div>
        )}
          </div>
          <figcaption>{moment.caption}</figcaption>
        </figure>
      </div>
      <div className="special-copy">
        <p className="eyebrow special-reveal">{moment.eyebrow}</p>
        <h2 id="special-title" className="special-reveal">{moment.title}</h2>
        <span className="special-rule" aria-hidden="true" />
        <div className="special-dedication">
          {moment.dedication.map((paragraph, index) => <p className="special-reveal" key={index}>{paragraph}</p>)}
        </div>
        <div className="special-signature special-reveal">
          <p>{moment.closing}</p>
          <span>{moment.signature}</span>
        </div>
        <div className="special-heart-action special-reveal">
          <div className="special-heart-burst" aria-hidden="true">
            {Array.from({ length: 8 }, (_, index) => <span className="special-petal" key={index} />)}
          </div>
          <button className={`special-heart ${sent ? "is-sent" : ""}`} onClick={sendHeart} aria-label={sent ? "Enviar otro corazón" : "Enviar un corazón"}>
            <svg className="special-heart-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20S3 14.7 3 8.7C3 3.8 9 2.4 12 6.3C15 2.4 21 3.8 21 8.7C21 14.7 12 20 12 20Z" /></svg>
          </button>
          <span className="special-heart-note" aria-live="polite">{sent ? moment.heartMessage : moment.heartHint}</span>
        </div>
      </div>
    </section>
  );
}
