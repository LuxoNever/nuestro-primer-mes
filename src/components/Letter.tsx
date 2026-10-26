import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { letterChapters, story } from "../content";
import "./letter-chapters.css";
import {
  gsap,
  useGSAP,
  useReducedMotion,
  ScrollTrigger,
} from "../animation/gsap";

export function Letter() {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [animate, setAnimate] = useState(true);
  const [version, setVersion] = useState(0);
  const [page, setPage] = useState(0);
  const [turning, setTurning] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const paper = useRef<HTMLElement>(null);
  const chapterContent = useRef<HTMLDivElement>(null);
  const pageTitle = useRef<HTMLHeadingElement>(null);
  const turn = useRef<gsap.core.Timeline | null>(null);
  const locked = useRef(true);
  const readyRef = useRef(false);
  const openedVersion = useRef<number | null>(null);
  const focusRequest = useRef<"opening" | "page" | null>(null);
  const scrollRequest = useRef(false);
  const chapter = letterChapters[page];
  const last = page === letterChapters.length - 1;

  useEffect(() => {
    if (!open || !ready || turning) return;
    const request = focusRequest.current;
    focusRequest.current = null;
    if (request === "page" || (request === "opening" && root.current?.contains(document.activeElement)))
      pageTitle.current?.focus({ preventScroll: true });
    if (scrollRequest.current) {
      scrollRequest.current = false;
      paper.current?.scrollIntoView({ behavior: reduced || !animate ? "instant" : "smooth", block: "start" });
    }
  }, [open, ready, turning, page, version, reduced, animate]);

  const { contextSafe } = useGSAP(
    () => {
      const wasReady = readyRef.current;
      turn.current = null;
      locked.current = true;
      readyRef.current = false;
      setTurning(false);
      if (!open) {
        openedVersion.current = null;
        ScrollTrigger.refresh();
        return;
      }
      // A preference change cancels a turn safely and keeps the current chapter.
      // An already opened letter must not replay its envelope when motion changes.
      if (wasReady && openedVersion.current === version) {
        readyRef.current = true;
        locked.current = false;
        setReady(true);
        setAnnouncement(`Página ${page + 1} de ${letterChapters.length}`);
        if (turning) {
          focusRequest.current = "page";
          scrollRequest.current = true;
        }
        ScrollTrigger.refresh();
        return;
      }
      openedVersion.current = version;
      const select = gsap.utils.selector(root);
      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          readyRef.current = true;
          locked.current = false;
          setReady(true);
          setAnnouncement(`Página ${page + 1} de ${letterChapters.length}`);
          ScrollTrigger.refresh();
        },
      });
      timeline
        .addLabel("seal", 0)
        .addLabel("flap", 0.25)
        .addLabel("sheet", 0.85)
        .addLabel("unfold", 1.55)
        .addLabel("words", 2.3);
      timeline.fromTo(
        select(".wax-seal"),
        { scale: 1, opacity: 1 },
        { scale: 0.75, opacity: 0, duration: 0.35 },
        "seal",
      );
      timeline.fromTo(
        select(".envelope-flap"),
        { rotationX: 0 },
        { rotationX: 180, duration: 0.85 },
        "flap",
      );
      timeline.set(select(".envelope-flap"), { zIndex: 0 }, "sheet");
      timeline.fromTo(
        select(".envelope-paper"),
        { y: 0, opacity: 1 },
        { y: -65, duration: 0.9 },
        "sheet",
      );
      timeline.to(
        select(".envelope-paper"),
        { opacity: 0, duration: 0.35 },
        "unfold",
      );
      timeline.fromTo(
        select(".letter-paper"),
        { autoAlpha: 0, scaleY: 0.08, y: -35 },
        { autoAlpha: 1, scaleY: 1, y: 0, duration: 0.9 },
        "unfold",
      );
      timeline.fromTo(
        select(".letter-page-meta, .letter-progress, .letter-chapter-content > *, .letter-pagination"),
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.6, stagger: { amount: 1.5 } },
        "words",
      );
      // A fixed total stagger keeps long letters ready in 4.4 s, regardless of
      // paragraph count. Remove transitional styles so every paragraph stays readable.
      timeline.set(select(".letter-paper > *, .letter-chapter-content > *"), {
        clearProps: "opacity,transform",
      }, 4.4);
      ScrollTrigger.refresh();
      if (reduced || !animate) timeline.progress(1).pause();
      else timeline.play();
    },
    {
      scope: root,
      dependencies: [open, animate, version, reduced],
      revertOnUpdate: true,
    },
  );

  function finishPage(target: number) {
    locked.current = false;
    setTurning(false);
    setAnnouncement(`Página ${target + 1} de ${letterChapters.length}`);
    focusRequest.current = "page";
    scrollRequest.current = true;
    ScrollTrigger.refresh();
  }

  const changePage = (target: number) => contextSafe(() => {
    if (!open || !readyRef.current || locked.current || target === page || target < 0 || target >= letterChapters.length) return;
    // A synchronous lock also protects multiple clicks before React commits disabled.
    locked.current = true;
    setTurning(true);
    turn.current?.kill();
    if (reduced || !animate || !chapterContent.current) {
      flushSync(() => setPage(target));
      finishPage(target);
      return;
    }
    const direction = target > page ? 1 : -1;
    const content = chapterContent.current;
    turn.current = gsap.timeline({ defaults: { ease: "sine.inOut" } });
    turn.current
      .to(content, { x: -14 * direction, rotationY: -1.2 * direction, transformPerspective: 1000, opacity: 0, duration: 0.2 })
      .call(() => {
        // Keep one content container; commit only the new chapter at zero opacity.
        flushSync(() => setPage(target));
      })
      .fromTo(content, { x: 14 * direction, rotationY: 1.2 * direction, opacity: 0 }, { x: 0, rotationY: 0, opacity: 1, duration: 0.3, immediateRender: false })
      .set(content, { clearProps: "transform,opacity" })
      .call(() => finishPage(target));
    if (target === letterChapters.length - 1) {
      // Runs after React has mounted the final signature, within this context.
      turn.current.call(contextSafe(() => {
        const heart = root.current?.querySelector(".letter-heart");
        if (heart) gsap.fromTo(heart, { scale: 0.88 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
      }), [], 0.2);
    }
  })();

  function read(animated: boolean) {
    turn.current?.kill();
    locked.current = true;
    readyRef.current = false;
    focusRequest.current = "opening";
    scrollRequest.current = true;
    setPage(0);
    setTurning(false);
    setAnnouncement("");
    setReady(false);
    setAnimate(animated);
    setVersion((v) => v + 1);
    setOpen(true);
  }
  function close() {
    turn.current?.kill();
    locked.current = true;
    readyRef.current = false;
    focusRequest.current = null;
    scrollRequest.current = false;
    setReady(false);
    setTurning(false);
    setAnnouncement("");
    root.current?.querySelector<HTMLButtonElement>(".envelope")?.focus({ preventScroll: true });
    setOpen(false);
    setPage(0);
    setVersion((value) => value + 1);
  }
  return (
    <section
      ref={root}
      className={`letter-section ${open ? "letter-open" : ""}`}
      id="carta"
      aria-labelledby="letter-title"
    >
      <div className="letter-intro">
        <p className="eyebrow">03 / DE MI CORAZÓN AL TUYO</p>
        <h2 id="letter-title">
          {story.letterHeading[0]}
          <br />
          <em>{story.letterHeading[1]}</em>
        </h2>
        <p>Amor, esta carta tiene un solo destino.</p>
      </div>
      <button
        className="envelope"
        aria-label="Abrir mi carta de amor"
        aria-expanded={open}
        aria-controls={open ? "love-letter" : undefined}
        onClick={() => read(true)}
      >
        <span className="envelope-paper handwritten">
          Para mi vida, con amor.
        </span>
        <span className="envelope-flap" />
        <span className="envelope-front" />
        <span className="wax-seal" aria-hidden="true">
          ♡
        </span>
      </button>
      {!open && (
        <p className="touch-hint">Toca el sello para abrir tu carta.</p>
      )}
      <div className="letter-controls">
        <button className="text-button" onClick={() => read(false)}>
          Leer sin animación
        </button>
        {open && (
          <>
            <button
              className="text-button"
              onClick={close}
            >
              Cerrar el sobre
            </button>
            <button className="text-button" onClick={() => read(true)}>
              ↻ Volver a leer
            </button>
          </>
        )}
      </div>
      {open && (
        <article
          ref={paper}
          id="love-letter"
          aria-busy={!ready || turning}
          aria-hidden={!ready}
          aria-labelledby="letter-chapter-title"
          key={version}
          className={`letter-paper ${animate ? "animate-letter" : ""}`}
        >
          <div className="letter-page-meta">
            {page === 0 ? <span className="letter-date">{story.anniversary.label}</span> : <span aria-hidden="true">♡</span>}
            <span className="letter-page-count">Página {page + 1} de {letterChapters.length}</span>
          </div>
          <progress className="letter-progress" value={page + 1} max={letterChapters.length} aria-label="Progreso de la carta" />
          <div className="letter-chapter-content" ref={chapterContent}>
            {page === 0 && <p className="letter-greeting">{story.letter.greeting}</p>}
            <h3 className="letter-chapter-title" id="letter-chapter-title" tabIndex={-1} ref={pageTitle}>{chapter.title}</h3>
            {story.letter.paragraphs.slice(chapter.from, chapter.to).map((p, index) => (
              <p className="letter-paragraph" data-paragraph={chapter.from + index + 1} key={p}>{p}</p>
            ))}
            {last && (
              <p className="letter-closing">
                <em>{story.letter.closing}</em><br />
                <span className="letter-signature-wrap">
                  <strong className="handwritten">{story.letter.signature}</strong>
                  <span className="letter-heart" aria-hidden="true">♡</span>
                </span>
              </p>
            )}
          </div>
          <nav className="letter-pagination" aria-label="Navegación de la carta">
            {page > 0 && <button type="button" className="letter-page-button" disabled={!ready || turning} onClick={() => changePage(page - 1)}><span aria-hidden="true">←</span> Anterior</button>}
            <button type="button" className="letter-page-button letter-page-next" disabled={!ready || turning} onClick={() => changePage(last ? 0 : page + 1)}>{last ? "Volver al inicio" : "Siguiente"} <span aria-hidden="true">{last ? "↻" : "→"}</span></button>
          </nav>
        </article>
      )}
      <span className="letter-announcement" aria-live="polite" aria-atomic="true">{announcement}</span>
    </section>
  );
}
