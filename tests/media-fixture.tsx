// Solo se sirve desde Vite dev; no es una entrada del build de producción.
import { createRoot } from "react-dom/client";
import { Music } from "../src/components/Music";
import { Memories } from "../src/components/Memories";
import { story, memories } from "../src/content";
import "../src/index.css";

if (import.meta.env.DEV) {
  const empty = new URLSearchParams(location.search).has("empty");
  story.music.src = empty ? null : "audio/test.wav";
  story.music.loopStart = 0;
  story.music.loopEnd = null;
  story.music.fadeSeconds = 0.08;
  memories[0].src = empty ? null : "photos/test.svg";
  createRoot(document.getElementById("root")!).render(
    <main>
      <Music />
      <Memories />
    </main>,
  );
}
