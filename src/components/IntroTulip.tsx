import { useId } from "react";

// Original flower head, drawn for close-up use. Six cupped petals, a shaded
// throat and separate reflected-light surfaces; never a photograph of a bouquet.
export function IntroTulip({ tone = 0 }: { tone?: number }) {
  const id = useId().replace(/:/g, "");
  const colors = [
    ["#f4e8ff", "#b58aca", "#80539d", "#543369"],
    ["#e8d4f8", "#9d70bd", "#704495", "#422655"],
    ["#fff4ff", "#d6b7e4", "#aa7fc0", "#78558b"],
    ["#fff2f6", "#d9b6d6", "#b58dbb", "#805d93"],
  ][tone % 4];
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      aria-hidden="true"
      className="intro-tulip"
    >
      <defs>
        <linearGradient
          id={`${id}-outer`}
          x1="45"
          y1="30"
          x2="168"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={colors[0]} />
          <stop offset=".35" stopColor={colors[1]} />
          <stop offset=".75" stopColor={colors[2]} />
          <stop offset="1" stopColor={colors[3]} />
        </linearGradient>
        <radialGradient
          id={`${id}-front`}
          cx=".3"
          cy=".27"
          r=".86"
          gradientTransform="translate(0 .04) scale(1 .95)"
        >
          <stop stopColor={colors[0]} />
          <stop offset=".3" stopColor={colors[1]} />
          <stop offset=".72" stopColor={colors[2]} />
          <stop offset="1" stopColor={colors[3]} />
        </radialGradient>
        <linearGradient
          id={`${id}-edge`}
          x1="30"
          y1="65"
          x2="133"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff9ff" stopOpacity=".9" />
          <stop offset=".5" stopColor={colors[0]} stopOpacity=".22" />
          <stop offset="1" stopColor={colors[2]} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-throat`} cx=".5" cy=".6" r=".6">
          <stop stopColor="#37213f" />
          <stop offset=".6" stopColor={colors[2]} />
          <stop offset="1" stopColor={colors[1]} />
        </radialGradient>
      </defs>
      <path
        d="M113 202 Q119 218 113 235 L127 235 Q130 218 127 202"
        fill="#8b9b76"
      />
      <path
        d="M120 185 C62 159 57 64 86 22 C112 34 135 82 120 185Z"
        fill={`url(#${id}-outer)`}
      />
      <path
        d="M115 186 C107 103 131 41 161 18 C190 67 181 153 115 186Z"
        fill={`url(#${id}-front)`}
      />
      <path
        d="M120 169 C79 146 84 85 124 52 C164 84 168 146 120 169Z"
        fill={`url(#${id}-throat)`}
      />
      <path
        d="M112 130 L116 100 M125 129 L132 95 M118 128 L124 105"
        stroke="#dbc3a6"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M121 205 C44 202 16 139 25 57 C80 50 123 111 121 205Z"
        fill={`url(#${id}-outer)`}
      />
      <path
        d="M121 205 C197 201 230 127 210 48 C158 54 117 118 121 205Z"
        fill={`url(#${id}-outer)`}
      />
      <path
        d="M120 210 C55 201 47 120 72 72 C110 83 145 147 120 210Z"
        fill={`url(#${id}-front)`}
      />
      <path
        d="M120 210 C174 200 197 127 171 69 C130 84 102 148 120 210Z"
        fill={`url(#${id}-front)`}
      />
      <path
        d="M120 211 C80 207 79 150 100 117 C109 103 120 97 125 94 C160 117 168 172 143 198 C137 205 129 210 120 211Z"
        fill={`url(#${id}-front)`}
      />
      <path
        d="M25 57 C50 60 86 95 98 125 C77 91 46 64 25 61Z M210 48 C194 65 178 92 174 113 C184 83 198 62 210 52Z M72 72 C82 100 94 133 100 164 C89 128 77 91 71 77Z M125 94 C102 114 97 143 103 179 C97 145 105 113 127 98Z"
        fill={`url(#${id}-edge)`}
      />
      <g
        stroke={colors[0]}
        strokeOpacity=".24"
        strokeWidth=".8"
        strokeLinecap="round"
      >
        <path d="M34 72 Q48 158 108 197" />
        <path d="M41 76 Q61 147 112 199" />
        <path d="M202 63 Q191 155 135 197" />
        <path d="M195 73 Q180 149 131 199" />
        <path d="M78 88 Q71 155 116 204" />
        <path d="M164 87 Q172 157 128 204" />
        <path d="M121 108 Q105 151 123 204" />
      </g>
      <path
        d="M84 188 Q118 224 151 187 Q137 214 120 215 Q100 211 84 188Z"
        fill={colors[3]}
        opacity=".18"
      />
    </svg>
  );
}
