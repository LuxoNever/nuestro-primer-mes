import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useSyncExternalStore } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);
export { gsap, useGSAP, ScrollTrigger };

const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribe(callback: () => void) {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
export function useReducedMotion() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );
}

// Placement remains on the outer SVG group. Only these inner groups animate.
// Each flower first grows as a closed bud, then opens around its own receptacle.
export function bloomTimeline(root: Element) {
  const timeline = gsap.timeline({ defaults: { ease: "power2.inOut" } });
  root.querySelectorAll(".flower-stem").forEach((stem, index) => {
    const head = stem.querySelector(".flower-head");
    const offset = index * 0.1;
    timeline.fromTo(
      stem,
      { scaleY: 0.08, opacity: 0, svgOrigin: "260 565" },
      { scaleY: 1, opacity: 1, duration: 1 },
      offset,
    );
    timeline.fromTo(
      head,
      { scaleX: 0.48, scaleY: 0.85, svgOrigin: "0 22" },
      { scaleX: 1, scaleY: 1, duration: 1.4 },
      0.85 + offset,
    );
    timeline.fromTo(
      stem.querySelector(".petal-left"),
      { rotation: 31, scaleX: 0.7, svgOrigin: "0 20" },
      { rotation: -12, scaleX: 1, duration: 1.5 },
      1 + offset,
    );
    timeline.fromTo(
      stem.querySelector(".petal-right"),
      { rotation: -31, scaleX: 0.7, svgOrigin: "0 20" },
      { rotation: 12, scaleX: 1, duration: 1.5 },
      1.12 + offset,
    );
    timeline.fromTo(
      stem.querySelector(".petal-back"),
      { scaleX: 0.55, scaleY: 0.8, svgOrigin: "0 20" },
      { scaleX: 1.07, scaleY: 1, duration: 1.3 },
      0.8 + offset,
    );
    timeline.fromTo(
      stem.querySelector(".petal-front"),
      { scaleX: 0.6, scaleY: 1.1, svgOrigin: "0 20" },
      { scaleX: 1, scaleY: 0.9, duration: 1.3 },
      1.1 + offset,
    );
    timeline.fromTo(
      stem.querySelectorAll(".flower-leaf"),
      { scaleX: 0.15, svgOrigin: "260 510" },
      { scaleX: 1, duration: 1.1, stagger: 0.08 },
      0.35 + offset,
    );
    timeline.fromTo(
      stem.querySelector(".flower-sway"),
      { rotation: index % 2 ? 3 : -3, svgOrigin: "0 22" },
      { rotation: 0, duration: 0.65, ease: "sine.out" },
      2.35 + offset,
    );
  });
  return timeline;
}
