// Genera los íconos PWA a partir del logo SVG del sistema de tickets.
// Uso: node scripts/generate-icons.mjs  (requiere devDependency "sharp")
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "fs";

// rounded=true → esquinas redondeadas (ícono normal)
// rounded=false + safeScale → cuadrado full-bleed con contenido achicado (maskable)
function logoSvg({ rounded = true, safeScale = 1 } = {}) {
  const rx = rounded ? 108 : 0;
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00e5a0"/>
      <stop offset="1" stop-color="#2563eb"/>
    </linearGradient>
    <radialGradient id="bg" cx="0.3" cy="0.22" r="1.25">
      <stop offset="0" stop-color="#1b1b34"/>
      <stop offset="1" stop-color="#07070f"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${rx}" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="170" fill="#00e5a0" opacity="0.07"/>
  <g transform="translate(256 256) scale(${safeScale}) rotate(-12) translate(-256 -256)">
    <!-- ticket -->
    <rect x="86" y="170" width="340" height="172" rx="26" fill="url(#g)"/>
    <!-- muescas laterales: círculos color fondo recortados al ticket -->
    <clipPath id="ticketClip">
      <rect x="86" y="170" width="340" height="172" rx="26"/>
    </clipPath>
    <g clip-path="url(#ticketClip)">
      <circle cx="86" cy="256" r="18" fill="#0a0a15"/>
      <circle cx="426" cy="256" r="18" fill="#0a0a15"/>
    </g>
    <!-- perforación del talón -->
    <line x1="352" y1="188" x2="352" y2="324" stroke="#0b0b16" stroke-width="5" stroke-dasharray="2 12" stroke-linecap="round"/>
    <!-- rayo (soporte / energía) -->
    <path fill="#071018" opacity="0.92" d="M240 180 L170 268 L214 268 L196 332 L270 242 L226 242 Z"/>
    <!-- cruz de salud en el talón -->
    <rect x="371" y="234" width="14" height="44" rx="6" fill="#071018" opacity="0.92"/>
    <rect x="356" y="249" width="44" height="14" rx="6" fill="#071018" opacity="0.92"/>
  </g>
</svg>`;
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon.svg", logoSvg({ rounded: true }));

const jobs = [
  { file: "public/icons/icon-192.png", size: 192, svg: logoSvg({ rounded: true }) },
  { file: "public/icons/icon-512.png", size: 512, svg: logoSvg({ rounded: true }) },
  { file: "public/icons/icon-maskable-512.png", size: 512, svg: logoSvg({ rounded: false, safeScale: 0.78 }) },
  { file: "public/apple-touch-icon.png", size: 180, svg: logoSvg({ rounded: false }) },
  { file: "public/icons/favicon-32.png", size: 32, svg: logoSvg({ rounded: true }) },
];

for (const { file, size, svg } of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
  console.log("✓", file);
}
