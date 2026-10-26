import { useEffect, useRef, useState } from "react";
import { assetUrl, memories, story, type Memory } from "../content";
import { Tulips } from "./Tulips";
import {
  gsap,
  useGSAP,
  useReducedMotion,
  ScrollTrigger,
} from "../animation/gsap";

function Photo({ memory }: { memory: Memory }) {
  const [failed, setFailed] = useState(false);
  const src = assetUrl(memory.src);
  return (
    <div className={`photo tone-${memory.tone}`}>
      {src && !failed ? (
        <img
          src={src}
          alt={memory.title}
          style={{ objectPosition: memory.position || "50% 50%" }}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="photo-placeholder">
          <Tulips />
          <span>
            {src
              ? "Este recuerdo volverá pronto"
              : "Aquí florecerá un recuerdo"}
          </span>
          <small>ESPACIO PARA NUESTRA FOTO</small>
        </div>
      )}
    </div>
  );
}

export function Memories() {
  const root = useRef<HTMLElement>(null);
  const seen = useRef(new Set<string>());
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      if (reduced) {
        ScrollTrigger.refresh();
        return;
      }
      const animations = Array.from(
        root.current.querySelectorAll<HTMLElement>(".polaroid-slot"),
      )
        .filter((slot) => !seen.current.has(slot.dataset.memory!))
        .map((slot, index) => {
          const tween = gsap.fromTo(
            slot,
            { opacity: 0.15, y: 32, rotation: index % 2 ? -3 : 3, scale: 0.97 },
            {
              opacity: 1,
              y: 0,
              rotation: 0,
              scale: 1,
              duration: 0.85,
              delay: (index % 3) * 0.09,
              ease: "power2.out",
              onStart: () => {
                seen.current.add(slot.dataset.memory!);
              },
              scrollTrigger: { trigger: slot, start: "top 92%", once: true },
            },
          );
          return { slot, tween };
        });
      const focus = (event: FocusEvent) =>
        animations.forEach(({ slot, tween }) => {
          if (event.target instanceof Node && slot.contains(event.target))
            tween.progress(1);
        });
      const element = root.current;
      element.addEventListener("focusin", focus);
      ScrollTrigger.refresh();
      return () => element.removeEventListener("focusin", focus);
    },
    { scope: root, dependencies: [expanded, reduced], revertOnUpdate: true },
  );
  const current = memories[active];
  function show(index: number, trigger: HTMLButtonElement) {
    opener.current = trigger;
    setActive(index);
    dialog.current?.showModal();
  }
  function close() {
    dialog.current?.close();
  }
  function step(delta: number) {
    setActive((i) => (i + delta + memories.length) % memories.length);
  }
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const restore = () => {
      opener.current?.focus();
    };
    el.addEventListener("close", restore);
    return () => el.removeEventListener("close", restore);
  }, []);
  return (
    <section
      ref={root}
      className="memories section-wrap"
      id="recuerdos"
      aria-labelledby="memory-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">02 / NUESTRO ÁLBUM</p>
          <h2 id="memory-heading">
            {story.albumHeading[0]}
            <br />
            <em>{story.albumHeading[1]}</em>
          </h2>
        </div>
        <p>{story.albumNote}</p>
      </div>
      <div className="album">
        {(expanded ? memories : memories.slice(0, 5)).map((memory, i) => (
          <div
            key={memory.id}
            data-memory={memory.id}
            className={`polaroid-slot ${i === 0 ? "featured-slot" : i === 1 ? "secondary-slot" : ""}`}
          >
            <button
              className={`polaroid ${i === 0 ? "featured" : i === 1 ? "secondary" : ""}`}
              onClick={(e) => show(i, e.currentTarget)}
              aria-label={`Ampliar recuerdo ${i + 1}: ${memory.title}`}
            >
              <span className="photo-tape" aria-hidden="true" />
              <Photo memory={memory} />
              <span className="photo-caption">
                <span>{memory.title}</span>
                <small>
                  {memory.date || `Nº ${String(i + 1).padStart(2, "0")}`}{" "}
                  <span aria-hidden="true">↗</span>
                </small>
              </span>
            </button>
          </div>
        ))}
      </div>
      <div className="album-bottom">
        <p className="handwritten">Nuestra historia, a nuestra manera.</p>
        <button
          className="text-button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
        >
          {expanded
            ? "Ver menos recuerdos ↑"
            : `Explorar los ${memories.length} recuerdos ↓`}
        </button>
      </div>
      <dialog
        ref={dialog}
        className="lightbox"
        aria-labelledby="lightbox-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            const controls =
              e.currentTarget.querySelectorAll<HTMLButtonElement>(
                "button:not([disabled])",
              );
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            step(1);
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            step(-1);
          }
        }}
      >
        <div
          className="lightbox-inner"
          onTouchStart={(e) => {
            touch.current = {
              x: e.touches[0].clientX,
              y: e.touches[0].clientY,
            };
          }}
          onTouchEnd={(e) => {
            const start = touch.current;
            if (start) {
              const dx = e.changedTouches[0].clientX - start.x;
              const dy = e.changedTouches[0].clientY - start.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy))
                step(dx < 0 ? 1 : -1);
            }
            touch.current = null;
          }}
        >
          <button
            className="icon-button close-dialog"
            onClick={close}
            aria-label="Cerrar fotografía"
          >
            ×
          </button>
          <Photo key={current.id} memory={current} />
          <h3 id="lightbox-title">{current.title}</h3>
          {current.date && <p>{current.date}</p>}
          {current.description && <p>{current.description}</p>}
          <div className="lightbox-nav">
            <button
              className="icon-button"
              onClick={() => step(-1)}
              aria-label="Foto anterior"
            >
              ←
            </button>
            <span aria-live="polite">
              {active + 1} / {memories.length}
            </span>
            <button
              className="icon-button"
              onClick={() => step(1)}
              aria-label="Foto siguiente"
            >
              →
            </button>
          </div>
          <small>Desliza o usa las flechas para seguir mirando.</small>
        </div>
      </dialog>
    </section>
  );
}
