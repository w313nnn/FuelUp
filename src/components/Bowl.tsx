export function Bowl({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={small ? "bowl small" : "bowl"}
      viewBox="0 0 400 320"
      role="img"
      aria-label="Illustration of a nourishing rice bowl with greens and egg"
    >
      <ellipse
        cx="206"
        cy="278"
        rx="128"
        ry="17"
        fill="#a7472e"
        opacity=".09"
      />
      <path d="M72 142 Q82 268 200 277 Q316 267 329 142" fill="#dde3d3" />
      <path d="M72 142 Q91 243 200 254 Q307 243 329 142" fill="#f7f6f2" />
      <ellipse cx="201" cy="145" rx="131" ry="71" fill="#dde3d3" />
      <ellipse cx="201" cy="140" rx="120" ry="63" fill="#f7f6f2" />
      <g fill="#f7f6f2">
        {Array.from({ length: 34 }, (_, i) => (
          <ellipse
            key={i}
            cx={111 + ((i * 37) % 177)}
            cy={108 + ((i * 17) % 63)}
            rx="8"
            ry="3"
            transform={`rotate(${i * 31} ${111 + ((i * 37) % 177)} ${108 + ((i * 17) % 63)})`}
          />
        ))}
      </g>
      <g fill="#2e332b" stroke="#2e332b" strokeWidth="2">
        <path d="M89 139 Q65 104 105 99 Q79 70 119 81 Q131 58 145 87 Q178 78 163 108 Q184 130 143 140Z" />
        <path d="M106 133 L143 91 M115 110 L136 111" />
        <path d="M247 107 Q247 74 270 83 Q282 62 293 92 Q324 80 315 113 Q344 122 317 141 L278 142Z" />
      </g>
      <g fill="#a7472e" stroke="#dde3d3" strokeWidth="3">
        <path d="M196 86 Q213 73 231 87 L263 133 Q259 150 239 151Z" />
        <path d="M176 98 Q190 80 208 93 L241 151 Q230 167 214 159Z" />
        <path d="M164 112 Q175 94 193 105 L218 162 Q203 176 187 164Z" />
      </g>
      <path
        d="M111 143 Q124 116 151 130 Q165 116 181 138 Q210 153 183 175 Q170 199 147 182 Q106 185 111 143"
        fill="#f7f6f2"
        stroke="#dde3d3"
        strokeWidth="2"
      />
      <circle cx="150" cy="155" r="23" fill="#dde3d3" />
      <circle cx="143" cy="149" r="8" fill="#dde3d3" />
      <g fill="#2e332b">
        <rect
          x="224"
          y="149"
          width="7"
          height="15"
          rx="2"
          transform="rotate(28 224 149)"
        />
        <rect x="265" y="131" width="7" height="15" rx="2" />
        <rect
          x="188"
          y="117"
          width="7"
          height="13"
          rx="2"
          transform="rotate(-40 188 117)"
        />
      </g>
      <path
        d="M277 76 L347 14 M289 81 L362 26"
        stroke="#a7472e"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M137 47 Q123 32 136 18 M177 52 Q161 34 176 11"
        stroke="#f7f6f2"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity=".7"
      />
    </svg>
  );
}
