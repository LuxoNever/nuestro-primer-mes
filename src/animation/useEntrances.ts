import type { RefObject } from "react";
import { gsap, useGSAP, useReducedMotion } from "./gsap";

export function useEntrances(
  root: RefObject<HTMLDivElement | null>,
  version: number,
) {
  const reduced = useReducedMotion();
  useGSAP(
    () => {
      if (reduced || !root.current) return;
      const scenes = [
        [".anniversary", ".month-number, .anniversary-copy > *"],
        [
          ".section-heading",
          ".section-heading > div > *, .section-heading > p",
        ],
        [".letter-intro", ".letter-intro > *"],
        [
          ".finale",
          ".finale > .eyebrow, .finale > h2, .finale > p:not(.eyebrow), .finale > button, .final-garden",
        ],
      ];
      const animations = scenes.flatMap(([selector, children]) => {
        const scene = root.current!.querySelector(selector);
        if (!scene) return [];
        const tween = gsap.fromTo(
          scene.querySelectorAll(children),
          { opacity: 0.15, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            stagger: 0.13,
            ease: "power2.out",
            scrollTrigger: { trigger: scene, start: "top 88%", once: true },
          },
        );
        return [{ scene, tween }];
      });
      // Keyboard navigation can jump directly into a section: reveal it immediately.
      const focus = (event: FocusEvent) =>
        animations.forEach(({ scene, tween }) => {
          if (event.target instanceof Node && scene.contains(event.target))
            tween.progress(1);
        });
      const element = root.current;
      element.addEventListener("focusin", focus);
      return () => element.removeEventListener("focusin", focus);
    },
    { scope: root, dependencies: [version, reduced], revertOnUpdate: true },
  );
}
