import { useId } from "react";

// Geometría original: tallos curvos, hojas lanceoladas y tres capas de pétalos.
export function Tulips({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const flowers = [
    { x: 170, y: 182, s: 0.86, r: -22 },
    { x: 331, y: 146, s: 0.92, r: 18 },
    { x: 232, y: 110, s: 1.05, r: -8 },
    { x: 395, y: 225, s: 0.73, r: 29 },
    { x: 113, y: 262, s: 0.68, r: -32 },
    { x: 290, y: 235, s: 0.85, r: 7 },
    { x: 265, y: 175, s: 1, r: 1 },
  ];
  return (
    <svg
      className={`tulips ${className}`}
      viewBox="0 0 520 580"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${id}-stem`}>
          <stop stopColor="#415E48" />
          <stop offset=".5" stopColor="#9AAE7B" />
          <stop offset="1" stopColor="#4F7054" />
        </linearGradient>
        <linearGradient
          id={`${id}-petal`}
          x1="-50"
          y1="-70"
          x2="45"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F8E9FF" />
          <stop offset=".42" stopColor="#C8A2D4" />
          <stop offset=".8" stopColor="#9A6AAE" />
          <stop offset="1" stopColor="#6E487E" />
        </linearGradient>
        <linearGradient
          id={`${id}-front`}
          x1="-35"
          y1="-68"
          x2="38"
          y2="25"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#ECD6F7" />
          <stop offset=".55" stopColor="#B88EC9" />
          <stop offset="1" stopColor="#80508E" />
        </linearGradient>
        <linearGradient id={`${id}-leaf`}>
          <stop stopColor="#384E3C" />
          <stop offset=".46" stopColor="#849B6F" />
          <stop offset=".52" stopColor="#A9BB8D" />
          <stop offset="1" stopColor="#657F58" />
        </linearGradient>
      </defs>
      {flowers.map((f, i) => (
        <g key={i} className="flower-stem">
          <path
            d={`M260 565 Q${f.x + 35} 410 ${f.x} ${f.y}`}
            stroke={`url(#${id}-stem)`}
            strokeWidth={6 * f.s}
            strokeLinecap="round"
          />
          <path
            d={`M${250 + i * 2} ${505 - i * 7} Q${f.x - 95} ${340 - i * 8} ${f.x - 55} ${285 + i * 7} Q${f.x + 6} 382 ${250 + i * 2} ${505 - i * 7}`}
            className="flower-leaf"
            fill={`url(#${id}-leaf)`}
          />
          <path
            d={`M${255 + i} ${520 - i * 5} Q${f.x + 112} 390 ${f.x + 90} ${320 + i * 9} Q${f.x + 45} 400 ${255 + i} ${520 - i * 5}`}
            className="flower-leaf"
            fill={`url(#${id}-leaf)`}
          />
          <g
            transform={`translate(${f.x} ${f.y}) rotate(${f.r}) scale(${f.s})`}
          >
            <g className="flower-sway">
              <g className="flower-head">
                <path
                  className="petal-back"
                  d="M0 18 C-46 5 -47 -49 -21 -77 C-5 -67 10 -60 18 -35 C27 -61 36 -65 43 -67 C55 -20 35 17 0 18Z"
                  fill={`url(#${id}-petal)`}
                />
                <path
                  className="petal petal-left"
                  d="M4 20 C-39 22 -60 -10 -51 -65 C-22 -61 8 -26 4 20Z"
                  fill={`url(#${id}-petal)`}
                />
                <path
                  className="petal petal-right"
                  d="M-2 20 C41 21 62 -16 47 -69 C21 -55 -7 -22 -2 20Z"
                  fill={`url(#${id}-petal)`}
                />
                <path
                  className="petal-front"
                  d="M0 24 C-32 22 -43 -12 -24 -52 C-13 -62 -3 -66 1 -68 C30 -56 43 -9 22 15 C16 21 8 24 0 24Z"
                  fill={`url(#${id}-front)`}
                />
                <path
                  d="M0 19 Q-11 -22 1 -57"
                  stroke="#F3DEFC"
                  strokeOpacity=".35"
                  strokeWidth="1.2"
                />
              </g>
            </g>
          </g>
        </g>
      ))}
    </svg>
  );
}
