import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Gift } from "./components/Gift";
import { Tulips } from "./components/Tulips";
import { Memories } from "./components/Memories";
import { Letter } from "./components/Letter";
import { SpecialMoment } from "./components/SpecialMoment";
import { Music, type MusicHandle } from "./components/Music";
import { story } from "./content";
import { IntroExperience } from "./components/IntroExperience";
import { ScrollTrigger } from "./animation/gsap";
import { useEntrances } from "./animation/useEntrances";

export default function App() {
  const music = useRef<MusicHandle>(null);
  const prepareMusic = useCallback(() => music.current?.prepareIntro(), []);
  const [musicHost, setMusicHost] = useState<HTMLDivElement | null>(null);
  const [introVisible, setIntroVisible] = useState(true);
  const [pageRevealed, setPageRevealed] = useState(false);
  const revealPage = useCallback(() => {
    music.current?.revealIntro();
    setPageRevealed(true);
  }, []);
  const finishIntro = useCallback(() => {
    music.current?.revealIntro();
    setPageRevealed(true);
    setIntroVisible(false);
  }, []);
  useEffect(() => {
    if (!introVisible) {
      ScrollTrigger.refresh();
      document.getElementById("contenido")?.focus({ preventScroll: true });
    }
  }, [introVisible]);
  function replayIntro() {
    window.scrollTo({ top: 0, behavior: "instant" });
    setPageRevealed(false);
    setIntroVisible(true);
  }
  const [replay, setReplay] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEntrances(root, replay);
  function restart() {
    flushSync(() => setReplay((v) => v + 1));
    document.getElementById("sorpresa")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
    document
      .querySelector<HTMLButtonElement>(".hero-copy .primary")
      ?.focus({ preventScroll: true });
  }
  return (
    <>
      <div
        ref={root}
        className="page-shell"
        inert={introVisible}
        aria-hidden={introVisible}
        style={{ opacity: pageRevealed ? 1 : 0 }}
      >
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <header className="site-header">
          <a
            className="brand"
            href="#sorpresa"
            aria-label="Nuestro primer mes, inicio"
          >
            <span aria-hidden="true">♡</span> tú <i>&</i> yo
            <span className="brand-dot">.</span>
          </a>
          <nav aria-label="Navegación principal">
            <a href="#nosotros">Nosotros</a>
            <a href="#recuerdos">Recuerdos</a>
            <a href="#carta">Mi carta</a>
          </nav>
          <span className="header-date">
            NUESTRO PRIMER MES <span aria-hidden="true">✧</span>
          </span>
        </header>
        <main id="contenido" tabIndex={-1}>
          <Gift key={replay} />
          <section
            className="anniversary section-wrap"
            id="nosotros"
            aria-labelledby="anniversary-title"
          >
            <div className="anniversary-flower">
              <Tulips />
            </div>
            <div className="month-number" aria-hidden="true">
              01<span>MES JUNTOS</span>
            </div>
            <div className="anniversary-copy">
              <p className="eyebrow">01 / LO BONITO DE ENCONTRARNOS</p>
              <h2 id="anniversary-title">
                {story.anniversaryHeading[0]}
                <br />
                <em>{story.anniversaryHeading[1]}</em>
              </h2>
              <p>{story.dedication}</p>
              <div className="timeline">
                <span>
                  <small>NUESTRO COMIENZO</small>
                  <time dateTime={story.start.iso}>{story.start.label}</time>
                </span>
                <span className="timeline-heart" aria-hidden="true">
                  ♡
                </span>
                <span>
                  <small>NUESTRO PRIMER MES</small>
                  <time dateTime={story.anniversary.iso}>
                    {story.anniversary.label}
                  </time>
                </span>
              </div>
            </div>
          </section>
          <Memories key={`memories-${replay}`} />
          <SpecialMoment />
          <Letter key={`letter-${replay}`} />
          <section className="finale" aria-labelledby="final-title">
            <p className="eyebrow">ESTO ES SOLO EL COMIENZO</p>
            <h2 id="final-title">
              {story.final.title[0]}
              <br />
              <em>{story.final.title[1]}</em>
            </h2>
            <p>{story.final.message}</p>
            <button className="button primary" onClick={restart}>
              Volver a vivir nuestra sorpresa <span aria-hidden="true">↻</span>
            </button>
            <button className="text-button intro-replay" onClick={replayIntro}>
              Repetir la introducción floral ↻
            </button>
            <div className="final-garden" aria-hidden="true">
              <Tulips />
              <Tulips />
              <Tulips />
            </div>
            <span className="final-heart" aria-hidden="true">
              ♡
            </span>
          </section>
        </main>
        <footer>
          <span className="brand">
            tú <i>&</i> yo.
          </span>
          <p>Hecho con todo mi amor. Solo para ti.</p>
          <span>{story.anniversary.label.split(".").join(" · ")}</span>
        </footer>
      </div>
      {introVisible && (
        <IntroExperience
          onOpen={prepareMusic}
          onReveal={revealPage}
          onDone={finishIntro}
          onMusicHost={setMusicHost}
        />
      )}
      <Music ref={music} host={musicHost} />
    </>
  );
}
