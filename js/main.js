/* Dover & Bloom — small site behaviors */

// ---- Botanical icon sprite (inlined so it works on any host, even file://) ----
const SPRITE = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="i-dahlia" viewBox="0 0 100 100">
    <g transform="translate(50 50)">
      ${Array.from({ length: 16 }, (_, i) => `<ellipse rx="8" ry="30" transform="rotate(${i * 22.5}) translate(0 -18)" fill="#e9876b" stroke="#2f4321" stroke-width="1.2"/>`).join("")}
      ${Array.from({ length: 12 }, (_, i) => `<ellipse rx="6" ry="17" transform="rotate(${i * 30 + 15}) translate(0 -11)" fill="#f5c3a6" stroke="#2f4321" stroke-width="1"/>`).join("")}
      <circle r="9" fill="#e8953a" stroke="#2f4321" stroke-width="1.2"/>
      <circle r="3.5" fill="#7d9660"/>
    </g>
  </symbol>
  <symbol id="i-snap" viewBox="0 0 60 100">
    <path d="M30 98 C30 70 30 40 30 6" stroke="#4d6438" stroke-width="2.4" fill="none"/>
    <path d="M30 80 C18 74 12 76 6 70 C14 66 22 70 30 78" fill="#7d9660" stroke="#2f4321" stroke-width="1"/>
    <path d="M30 70 C42 64 48 66 54 60 C46 56 38 60 30 68" fill="#7d9660" stroke="#2f4321" stroke-width="1"/>
    ${[[30, 54, 9], [22, 46, 8], [38, 40, 8], [24, 32, 7], [36, 25, 6], [29, 16, 5], [30, 8, 3.5]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e48b92" stroke="#2f4321" stroke-width="1"/>`).join("")}
  </symbol>
  <symbol id="i-bee" viewBox="0 0 100 80">
    <ellipse cx="40" cy="20" rx="18" ry="11" transform="rotate(-25 40 20)" fill="#fcfaf2" stroke="#2f4321" stroke-width="1.5" opacity=".95"/>
    <ellipse cx="58" cy="18" rx="15" ry="9" transform="rotate(20 58 18)" fill="#fcfaf2" stroke="#2f4321" stroke-width="1.5" opacity=".95"/>
    <ellipse cx="50" cy="48" rx="28" ry="20" fill="#e8b23a" stroke="#2f4321" stroke-width="1.8"/>
    <path d="M38 30 C34 40 34 56 38 66 M52 28 C48 40 48 58 52 68" stroke="#2f4321" stroke-width="7" fill="none"/>
    <circle cx="78" cy="46" r="10" fill="#2f4321"/>
    <path d="M84 38 C88 30 92 28 96 28 M80 37 C82 28 86 24 90 22" stroke="#2f4321" stroke-width="1.6" fill="none"/>
  </symbol>
  <symbol id="i-tuber" viewBox="0 0 100 100">
    <path d="M50 8 C50 20 50 28 50 34" stroke="#4d6438" stroke-width="3" fill="none"/>
    <path d="M50 14 C40 6 32 8 28 12 C36 16 44 18 50 16" fill="#7d9660" stroke="#2f4321" stroke-width="1"/>
    <rect x="42" y="30" width="16" height="10" rx="4" fill="#b08a5e" stroke="#2f4321" stroke-width="1.2"/>
    <path d="M44 40 C30 50 22 70 26 90 C32 92 38 80 46 44" fill="#c9a274" stroke="#2f4321" stroke-width="1.4"/>
    <path d="M50 40 C46 60 46 80 50 96 C56 96 56 64 52 40" fill="#b8915f" stroke="#2f4321" stroke-width="1.4"/>
    <path d="M56 40 C70 50 78 70 74 88 C68 90 62 76 54 44" fill="#c9a274" stroke="#2f4321" stroke-width="1.4"/>
  </symbol>
  <symbol id="i-ticket" viewBox="0 0 100 70">
    <path d="M6 10 H94 V26 A9 9 0 0 0 94 44 V60 H6 V44 A9 9 0 0 0 6 26 Z" fill="#fcfaf2" stroke="#2f4321" stroke-width="2"/>
    <path d="M70 12 V58" stroke="#2f4321" stroke-width="1.5" stroke-dasharray="3 4"/>
    <g transform="translate(38 35)">
      ${Array.from({ length: 8 }, (_, i) => `<ellipse rx="4" ry="10" transform="rotate(${i * 45}) translate(0 -8)" fill="#e48b92" stroke="#2f4321" stroke-width=".8"/>`).join("")}
      <circle r="4" fill="#e8953a"/>
    </g>
    <circle cx="82" cy="35" r="5" fill="#7d9660"/>
  </symbol>
  <symbol id="i-calendar" viewBox="0 0 100 100">
    <rect x="12" y="20" width="76" height="68" rx="8" fill="#fcfaf2" stroke="#2f4321" stroke-width="2"/>
    <path d="M12 38 H88" stroke="#2f4321" stroke-width="2"/>
    <path d="M32 12 V28 M68 12 V28" stroke="#2f4321" stroke-width="3" stroke-linecap="round"/>
    <g transform="translate(50 63)">
      ${Array.from({ length: 10 }, (_, i) => `<ellipse rx="4" ry="11" transform="rotate(${i * 36}) translate(0 -9)" fill="#e8953a" stroke="#2f4321" stroke-width=".8"/>`).join("")}
      <circle r="5" fill="#e9876b" stroke="#2f4321" stroke-width=".8"/>
    </g>
  </symbol>
  <symbol id="i-sprout" viewBox="0 0 100 100">
    <path d="M18 70 H82 L76 94 H24 Z" fill="#c98a5e" stroke="#2f4321" stroke-width="1.8"/>
    <rect x="14" y="62" width="72" height="10" rx="3" fill="#b8784f" stroke="#2f4321" stroke-width="1.8"/>
    <path d="M50 62 C50 46 50 36 50 26" stroke="#4d6438" stroke-width="3" fill="none"/>
    <path d="M50 40 C34 40 24 30 22 16 C38 16 48 26 50 40" fill="#7d9660" stroke="#2f4321" stroke-width="1.4"/>
    <path d="M50 32 C64 32 74 22 78 8 C62 8 52 18 50 32" fill="#a3b886" stroke="#2f4321" stroke-width="1.4"/>
  </symbol>
  <symbol id="i-class" viewBox="0 0 100 100">
    <rect x="14" y="18" width="72" height="50" rx="5" fill="#fcfaf2" stroke="#2f4321" stroke-width="2"/>
    <path d="M6 76 H94 L88 84 H12 Z" fill="#c9d4b2" stroke="#2f4321" stroke-width="2"/>
    <path d="M50 60 C50 50 50 44 50 38" stroke="#4d6438" stroke-width="2"/>
    <path d="M50 50 C42 50 38 46 36 40 C44 40 48 44 50 50" fill="#7d9660"/>
    <g transform="translate(50 34)">
      ${Array.from({ length: 8 }, (_, i) => `<ellipse rx="3.5" ry="8" transform="rotate(${i * 45}) translate(0 -6)" fill="#e9876b" stroke="#2f4321" stroke-width=".8"/>`).join("")}
      <circle r="3.5" fill="#e8953a"/>
    </g>
  </symbol>
  <symbol id="i-leaf" viewBox="0 0 100 100">
    <path d="M18 86 C18 40 48 14 88 12 C88 54 62 84 18 86 Z" fill="#7d9660" stroke="#2f4321" stroke-width="2"/>
    <path d="M18 86 C40 62 58 42 78 22 M38 66 L36 46 M52 52 L52 34 M44 60 L62 60 M58 46 L72 46" stroke="#2f4321" stroke-width="1.6" fill="none"/>
  </symbol>
  <symbol id="i-greenhouse" viewBox="0 0 100 100">
    <path d="M12 48 L50 18 L88 48 L88 86 L12 86 Z" fill="#eef3ea" stroke="#2f4321" stroke-width="2" stroke-linejoin="round"/>
    <path d="M31 33 L31 86 M50 18 L50 62 M69 33 L69 86 M12 62 L88 62" stroke="#2f4321" stroke-width="1.4" opacity=".55"/>
    <rect x="42" y="62" width="16" height="24" fill="#dfe6cf" stroke="#2f4321" stroke-width="1.6"/>
    <path d="M22 86 C22 78 22 74 22 70 M22 76 C17 76 15 72 15 69 C19 69 22 72 22 76 M22 73 C26 72 28 69 28 66 C24 66 22 69 22 73" stroke="#4d6438" stroke-width="1.6" fill="#7d9660"/>
    <g transform="translate(78 74)">${Array.from({ length: 8 }, (_, i) => `<ellipse rx="2.4" ry="6" transform="rotate(${i * 45}) translate(0 -5)" fill="#e9876b" stroke="#2f4321" stroke-width=".6"/>`).join("")}<circle r="2.6" fill="#e8953a"/></g>
  </symbol>
  <symbol id="i-cat" viewBox="0 0 100 100">
    <path d="M70 84 C86 82 92 70 86 58 C83 52 77 54 80 60 C83 67 79 75 68 76" fill="#d9a066" stroke="#2f4321" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M30 90 C26 72 30 56 40 50 L60 50 C70 56 74 72 70 90 Z" fill="#d9a066" stroke="#2f4321" stroke-width="2" stroke-linejoin="round"/>
    <path d="M33 34 L31 12 L45 25 Z M67 34 L69 12 L55 25 Z" fill="#d9a066" stroke="#2f4321" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="50" cy="38" rx="20" ry="17" fill="#d9a066" stroke="#2f4321" stroke-width="2"/>
    <path d="M34 17 L36 27 L41 25 Z M66 17 L64 27 L59 25 Z" fill="#f5c3a6"/>
    <ellipse cx="42" cy="36" rx="2.6" ry="3.6" fill="#2f4321"/><ellipse cx="58" cy="36" rx="2.6" ry="3.6" fill="#2f4321"/>
    <path d="M47 43 L53 43 L50 46 Z" fill="#e9876b"/>
    <path d="M50 46 C49 49 46 50 44 49 M50 46 C51 49 54 50 56 49" stroke="#2f4321" stroke-width="1.2" fill="none"/>
    <path d="M38 44 L24 42 M38 47 L25 49 M62 44 L76 42 M62 47 L75 49" stroke="#2f4321" stroke-width="1" opacity=".7"/>
    <path d="M40 66 C44 64 48 64 50 66 M50 66 C52 64 56 64 60 66" stroke="#2f4321" stroke-width="1.2" fill="none" opacity=".5"/>
  </symbol>
  <symbol id="i-hands" viewBox="0 0 100 100">
    <path d="M8 64 C22 60 36 66 50 74 C64 66 78 60 92 64 L88 82 C74 78 62 82 50 90 C38 82 26 78 12 82 Z" fill="#f5c3a6" stroke="#2f4321" stroke-width="1.8"/>
    <path d="M50 70 C50 54 50 44 50 34" stroke="#4d6438" stroke-width="2.6"/>
    <path d="M50 52 C38 52 30 46 28 36 C40 36 48 42 50 52" fill="#7d9660" stroke="#2f4321" stroke-width="1.2"/>
    <g transform="translate(50 28)">
      ${Array.from({ length: 12 }, (_, i) => `<ellipse rx="4" ry="12" transform="rotate(${i * 30}) translate(0 -9)" fill="#e9876b" stroke="#2f4321" stroke-width=".8"/>`).join("")}
      <circle r="5" fill="#e8953a"/>
    </g>
  </symbol>
  <symbol id="i-sprig" viewBox="0 0 120 40">
    <path d="M10 20 H110" stroke="currentColor" stroke-width="1.4"/>
    ${[25, 45, 65, 85].map((x, i) => `<path d="M${x} 20 C${x + 6} ${i % 2 ? 30 : 10} ${x + 14} ${i % 2 ? 32 : 8} ${x + 18} ${i % 2 ? 30 : 10} C${x + 12} ${i % 2 ? 24 : 16} ${x + 6} ${i % 2 ? 22 : 18} ${x} 20Z" fill="currentColor"/>`).join("")}
    <circle cx="60" cy="20" r="5" fill="#e9876b"/>
  </symbol>
  <symbol id="i-bucket" viewBox="0 0 100 100">
    ${[[30, 30, "#e9876b"], [50, 20, "#e48b92"], [70, 30, "#e8953a"], [40, 14, "#f5c3a6"], [60, 12, "#e9876b"]].map(([x, y, c]) => `<path d="M50 60 L${x} ${y + 8}" stroke="#4d6438" stroke-width="2"/><g transform="translate(${x} ${y})">${Array.from({ length: 8 }, (_, i) => `<ellipse rx="3.2" ry="8" transform="rotate(${i * 45}) translate(0 -5)" fill="${c}" stroke="#2f4321" stroke-width=".7"/>`).join("")}<circle r="3" fill="#f3e6bf"/></g>`).join("")}
    <path d="M24 52 H76 L70 94 H30 Z" fill="#a9b8c4" stroke="#2f4321" stroke-width="2"/>
    <path d="M24 52 C30 44 70 44 76 52" fill="none" stroke="#2f4321" stroke-width="2"/>
    <path d="M27 64 H73 M29 78 H71" stroke="#2f4321" stroke-width="1.2" opacity=".6"/>
  </symbol>
  <symbol id="i-bar" viewBox="0 0 100 100">
    <path d="M14 30 C26 18 74 18 86 30 Z" fill="#e48b92" stroke="#2f4321" stroke-width="1.8"/>
    <path d="M14 30 C20 36 26 36 32 30 C38 36 44 36 50 30 C56 36 62 36 68 30 C74 36 80 36 86 30" fill="#fcfaf2" stroke="#2f4321" stroke-width="1.5"/>
    <path d="M20 34 V64 M80 34 V64" stroke="#2f4321" stroke-width="2.5"/>
    <rect x="14" y="62" width="72" height="16" rx="3" fill="#c98a5e" stroke="#2f4321" stroke-width="1.8"/>
    ${[28, 42, 58, 72].map((x, i) => `<rect x="${x - 5}" y="50" width="10" height="12" rx="2" fill="#a9b8c4" stroke="#2f4321" stroke-width="1"/><circle cx="${x}" cy="46" r="5" fill="${["#e9876b", "#e8953a", "#e48b92", "#f5c3a6"][i]}" stroke="#2f4321" stroke-width=".8"/>`).join("")}
    <circle cx="26" cy="86" r="7" fill="#fcfaf2" stroke="#2f4321" stroke-width="2"/><circle cx="74" cy="86" r="7" fill="#fcfaf2" stroke="#2f4321" stroke-width="2"/>
  </symbol>
  <symbol id="i-party" viewBox="0 0 100 100">
    <path d="M6 16 C30 30 70 30 94 16" fill="none" stroke="#2f4321" stroke-width="1.6"/>
    ${[14, 30, 46, 62, 78].map((x, i) => `<path d="M${x} ${20 + (i === 0 || i === 4 ? 0 : 5)} l12 1 l-6 13 z" fill="${["#e9876b", "#f3e6bf", "#e48b92", "#e8953a", "#c9d4b2"][i]}" stroke="#2f4321" stroke-width="1"/>`).join("")}
    <rect x="22" y="62" width="56" height="28" rx="4" fill="#fcfaf2" stroke="#2f4321" stroke-width="2"/>
    <rect x="30" y="46" width="40" height="18" rx="4" fill="#f5c3a6" stroke="#2f4321" stroke-width="2"/>
    <path d="M22 72 C30 78 38 66 46 72 C54 78 62 66 70 72 C74 75 76 74 78 72" fill="none" stroke="#e48b92" stroke-width="2.5"/>
    <path d="M50 46 V36" stroke="#2f4321" stroke-width="2"/><path d="M50 36 C46 32 48 27 50 25 C52 28 55 31 50 36Z" fill="#e8953a"/>
  </symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15.5 15.5 L21 21" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></symbol>
  <symbol id="i-mail" viewBox="0 0 100 100">
    <rect x="12" y="26" width="76" height="52" rx="6" fill="#fcfaf2" stroke="#2f4321" stroke-width="2.2"/>
    <path d="M14 30 L50 56 L86 30" fill="none" stroke="#2f4321" stroke-width="2.2"/>
    <g transform="translate(76 26)">${Array.from({ length: 8 }, (_, i) => `<ellipse rx="3.5" ry="8" transform="rotate(${i * 45}) translate(0 -6)" fill="#e9876b" stroke="#2f4321" stroke-width=".8"/>`).join("")}<circle r="3.5" fill="#e8953a"/></g>
  </symbol>
  <symbol id="i-wreath" viewBox="0 0 100 100">
    <circle cx="50" cy="52" r="30" fill="none" stroke="#b08a5e" stroke-width="5"/>
    ${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, x = 50 + 30 * Math.cos(a), y = 52 + 30 * Math.sin(a), r = (a * 180) / Math.PI; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="10" transform="rotate(${(r + 50).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i % 2 ? "#7d9660" : "#a3b886"}" stroke="#2f4321" stroke-width=".8"/>`; }).join("")}
    ${[[0.2, "#e9876b"], [1.3, "#e8953a"], [2.5, "#e48b92"], [3.6, "#f3e6bf"], [4.8, "#e9876b"]].map(([a, c]) => `<circle cx="${(50 + 30 * Math.cos(a)).toFixed(1)}" cy="${(52 + 30 * Math.sin(a)).toFixed(1)}" r="5.5" fill="${c}" stroke="#2f4321" stroke-width="1"/>`).join("")}
    <path d="M42 84 C46 90 54 90 58 84 L54 96 M46 84 L44 96" fill="none" stroke="#e48b92" stroke-width="2.5"/>
  </symbol>
  <symbol id="i-suncatcher" viewBox="22 0 56 92">
    <circle cx="50" cy="5" r="3" fill="none" stroke="#2f4321" stroke-width="1.4"/>
    <path d="M50 8 L50 20" stroke="#b08a5e" stroke-width="1.4"/>
    <circle cx="50" cy="38" r="17" fill="none" stroke="#c9a274" stroke-width="3.2"/>
    <circle cx="50" cy="38" r="17" fill="none" stroke="#2f4321" stroke-width=".8" opacity=".5"/>
    <path d="M45 19 C47 23 53 23 55 19 M50 21 L47 26 M50 21 L53 26" fill="none" stroke="#e48b92" stroke-width="1.6" stroke-linecap="round"/>
    ${[[150, "#a3b886", 9], [190, "#7d9660", 8], [110, "#c9b27a", 10]].map(([a, c, l]) => { const r = (a * Math.PI) / 180, x = 50 + 17 * Math.cos(r), y = 38 + 17 * Math.sin(r); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="2.6" ry="${l / 2}" transform="rotate(${a + 60} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${c}" stroke="#2f4321" stroke-width=".6"/>`; }).join("")}
    ${[[125, "#e9876b", 4.6], [145, "#f3e6bf", 3.8], [165, "#e8953a", 4.2], [100, "#e48b92", 3.4], [182, "#f5c3a6", 3.2]].map(([a, c, r]) => { const rad = (a * Math.PI) / 180, x = 50 + 17 * Math.cos(rad), y = 38 + 17 * Math.sin(rad); return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">${Array.from({ length: 8 }, (_, i) => `<ellipse rx="${(r * 0.45).toFixed(1)}" ry="${r.toFixed(1)}" transform="rotate(${i * 45}) translate(0 -${(r * 0.7).toFixed(1)})" fill="${c}" stroke="#2f4321" stroke-width=".5"/>`).join("")}<circle r="${(r * 0.45).toFixed(1)}" fill="#e8953a" stroke="#2f4321" stroke-width=".4"/></g>`; }).join("")}
    ${[[40, 70, "#cfe0ee"], [50, 82, "#e6d6f0"], [60, 66, "#f6d9e0"]].map(([x, y, c]) => { const top = 38 + Math.sqrt(17 * 17 - (x - 50) * (x - 50)); return `<path d="M${x} ${top.toFixed(1)} L${x} ${y - 7}" stroke="#b08a5e" stroke-width="1"/><polygon points="${x},${y - 7} ${x + 4.5},${y - 2} ${x},${y + 8} ${x - 4.5},${y - 2}" fill="${c}" stroke="#2f4321" stroke-width="1"/><path d="M${x - 4.5} ${y - 2} L${x + 4.5} ${y - 2} M${x} ${y - 7} L${x - 1.6} ${y - 2} L${x} ${y + 8} M${x} ${y - 7} L${x + 1.6} ${y - 2}" stroke="#2f4321" stroke-width=".5" opacity=".7" fill="none"/>`; }).join("")}
    ${[[30, 74, 3], [70, 80, 3.5], [66, 52, 2.5], [33, 56, 2.2]].map(([x, y, r]) => `<path d="M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z" fill="#f2c94c" opacity=".9"/>`).join("")}
  </symbol>
  <symbol id="i-pumpkin" viewBox="0 0 100 100">
    <path d="M50 30 C46 22 48 14 54 10" fill="none" stroke="#4d6438" stroke-width="4" stroke-linecap="round"/>
    <path d="M54 22 C62 14 72 16 76 22 C68 24 60 26 54 24Z" fill="#7d9660" stroke="#2f4321" stroke-width="1.2"/>
    <ellipse cx="32" cy="60" rx="18" ry="28" fill="#e8953a" stroke="#2f4321" stroke-width="2"/>
    <ellipse cx="68" cy="60" rx="18" ry="28" fill="#e8953a" stroke="#2f4321" stroke-width="2"/>
    <ellipse cx="50" cy="60" rx="16" ry="30" fill="#f0a64e" stroke="#2f4321" stroke-width="2"/>
    ${[[42, 30, "#e48b92"], [52, 27, "#f3e6bf"], [60, 31, "#e9876b"]].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${Array.from({ length: 8 }, (_, i) => `<ellipse rx="2.6" ry="5.5" transform="rotate(${i * 45}) translate(0 -4)" fill="${c}" stroke="#2f4321" stroke-width=".6"/>`).join("")}<circle r="2.2" fill="#e8953a"/></g>`).join("")}
  </symbol>
  <symbol id="i-xmaswreath" viewBox="0 0 100 100">
    ${Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2, x = 50 + 28 * Math.cos(a), y = 48 + 28 * Math.sin(a), r = (a * 180) / Math.PI; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)} l0 -12 l3 4 l3 -4 l0 12 z" transform="rotate(${(r + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i % 2 ? "#4d6438" : "#2f4321"}"/>`; }).join("")}
    <circle cx="50" cy="48" r="28" fill="none" stroke="#4d6438" stroke-width="9"/>
    ${[0.4, 1.5, 2.6, 3.7, 4.8, 5.8].map((a, i) => `<circle cx="${(50 + 28 * Math.cos(a)).toFixed(1)}" cy="${(48 + 28 * Math.sin(a)).toFixed(1)}" r="4" fill="${i % 2 ? "#c0392b" : "#f3e6bf"}" stroke="#2f4321" stroke-width=".8"/>`).join("")}
    <path d="M50 78 C40 70 34 74 36 82 C42 84 46 80 50 78 C54 80 58 84 64 82 C66 74 60 70 50 78Z" fill="#c0392b" stroke="#2f4321" stroke-width="1.2"/>
    <path d="M48 80 L42 96 M52 80 L58 96" stroke="#c0392b" stroke-width="3" stroke-linecap="round"/>
  </symbol>
  <symbol id="i-ig" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor"/></symbol>
  <symbol id="i-fb" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13.2 20.5 V13 H15.6 L16 10.3 H13.2 V8.6 C13.2 7.8 13.5 7.3 14.6 7.3 H16.1 V4.9 C15.6 4.8 14.8 4.7 14 4.7 C11.9 4.7 10.6 5.9 10.6 8.2 V10.3 H8.2 V13 H10.6 V20.5" fill="currentColor"/></symbol>
  <symbol id="i-compost" viewBox="0 0 100 100">
    <path d="M18 34 H82 V88 H18 Z" fill="#c98a5e" stroke="#2f4321" stroke-width="2"/>
    <path d="M18 34 H82" stroke="#2f4321" stroke-width="2"/>
    ${[46, 58, 70, 82].map((y) => `<path d="M18 ${y} H82" stroke="#2f4321" stroke-width="1.2" opacity=".55"/>`).join("")}
    <path d="M22 40 C30 36 40 44 50 39 C60 35 70 43 78 39 L78 48 L22 48 Z" fill="#7d9660"/>
    <path d="M22 52 C34 50 44 56 56 52 C64 50 72 55 78 52 L78 60 L22 60 Z" fill="#8a6a4a"/>
    <path d="M22 64 C32 62 46 68 58 64 C66 62 72 66 78 64 L78 72 L22 72 Z" fill="#b8915f"/>
    <path d="M22 76 C34 74 44 80 56 76 C64 74 72 78 78 76 L78 85 L22 85 Z" fill="#5b4632"/>
    <path d="M34 34 C30 22 36 14 44 12 C44 22 40 28 34 34Z" fill="#a3b886" stroke="#2f4321" stroke-width="1.2"/>
    <path d="M60 34 C58 24 64 18 72 18 C70 26 66 30 60 34Z" fill="#7d9660" stroke="#2f4321" stroke-width="1.2"/>
    <path d="M44 66 c3 -2 6 0 8 -1" stroke="#e48b92" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  </symbol>
  <symbol id="i-covercrop" viewBox="0 0 100 100">
    <path d="M6 82 C30 76 70 76 94 82 V94 H6 Z" fill="#8a6a4a" stroke="#2f4321" stroke-width="1.8"/>
    ${[14, 26, 70, 84].map((x, i) => `<path d="M${x} 80 C${x - 2} 64 ${x + 2} 48 ${x - 1} ${36 + i * 3}" stroke="#a3b886" stroke-width="2" fill="none"/><path d="M${x - 1} ${36 + i * 3} l-3 6 M${x - 1} ${40 + i * 3} l3 6 M${x} ${44 + i * 3} l-3 6" stroke="#7d9660" stroke-width="1.5"/>`).join("")}
    ${[[40, 56], [56, 50]].map(([x, h]) => `<path d="M${x} 80 V${h + 10}" stroke="#4d6438" stroke-width="2"/>${[0, 120, 240].map((r) => `<ellipse cx="${x}" cy="${h + 4}" rx="4" ry="6" transform="rotate(${r} ${x} ${h + 10})" fill="#7d9660" stroke="#2f4321" stroke-width=".8"/>`).join("")}`).join("")}
    <path d="M48 80 V54" stroke="#4d6438" stroke-width="2"/>
    <circle cx="48" cy="48" r="7" fill="#e48b92" stroke="#2f4321" stroke-width="1"/>
    ${Array.from({ length: 8 }, (_, i) => `<circle cx="${(48 + 5 * Math.cos(i * 0.785)).toFixed(1)}" cy="${(48 + 5 * Math.sin(i * 0.785)).toFixed(1)}" r="2" fill="#f5c3a6"/>`).join("")}
    <path d="M62 80 V40" stroke="#4d6438" stroke-width="2"/>
    <circle cx="62" cy="36" r="6" fill="#f3e6bf" stroke="#2f4321" stroke-width="1"/><circle cx="62" cy="36" r="2.4" fill="#e8953a"/>
    <path d="M36 92 c4 -4 8 0 12 -3 M60 90 c3 -3 7 0 10 -2" stroke="#e48b92" stroke-width="2" fill="none" stroke-linecap="round"/>
  </symbol>
  <symbol id="i-datenight" viewBox="0 0 100 100">
    <path d="M50 92 C20 72 8 56 8 40 C8 26 18 18 30 18 C40 18 46 24 50 30 C54 24 60 18 70 18 C82 18 92 26 92 40 C92 56 80 72 50 92Z" fill="#f5d3d4" stroke="#2f4321" stroke-width="2"/>
    <path d="M38 80 L46 50 M62 80 L54 50" stroke="#4d6438" stroke-width="2.4"/>
    <path d="M42 66 C34 64 30 58 30 54 C38 56 42 60 42 66Z M58 66 C66 64 70 58 70 54 C62 56 58 60 58 66Z" fill="#7d9660"/>
    ${[[44, 44, "#e9876b", 8], [56, 44, "#e48b92", 8], [50, 36, "#f3e6bf", 6.5]].map(([x, y, c, r]) => `<g transform="translate(${x} ${y})">${Array.from({ length: 10 }, (_, i) => `<ellipse rx="${(r * 0.4).toFixed(1)}" ry="${r}" transform="rotate(${i * 36}) translate(0 -${(r * 0.6).toFixed(1)})" fill="${c}" stroke="#2f4321" stroke-width=".6"/>`).join("")}<circle r="${(r * 0.4).toFixed(1)}" fill="#e8953a"/></g>`).join("")}
    <path d="M40 80 C46 76 54 76 60 80 L56 86 C52 84 48 84 44 86Z" fill="#e48b92" stroke="#2f4321" stroke-width="1.2"/>
  </symbol>
</svg>`;
document.body.insertAdjacentHTML("afterbegin", SPRITE);

// ---- Mobile nav ----
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    toggle.textContent = open ? "Close" : "Menu";
  });
}

// ---- Footer year ----
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

// ---- Toast ----
const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
document.body.appendChild(toast);
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// ---- Newsletter sign-up (sent to Kit by netlify/functions/subscribe.js) ----
document.querySelectorAll("form[data-newsletter]").forEach((form) => {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = form.querySelector("button[type=submit]");
    const email = form.querySelector("input[type=email]").value.trim();
    const company = form.querySelector('input[name="company"]')?.value || "";
    btn.disabled = true;
    try {
      const res = await fetch("/.netlify/functions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
      form.reset();
      showToast("Thank you! Check your inbox to confirm your subscription.");
    } catch (err) {
      showToast(err.message && !/fetch|network|JSON/i.test(err.message) ? err.message : "We couldn't reach the sign-up right now. Please try again.");
    } finally {
      btn.disabled = false;
    }
  });
});

// ---- Blog filters ----
const filterBtns = document.querySelectorAll(".filters button");
filterBtns.forEach((btn) =>
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const f = btn.dataset.filter;
    document.querySelectorAll(".posts .post").forEach((p) => {
      p.style.display = f === "all" || p.dataset.cat === f ? "" : "none";
    });
  })
);

// ---- Print buttons ----
document.querySelectorAll("[data-print]").forEach((b) => b.addEventListener("click", () => window.print()));

// ---- Shop cards: clicking a card (not its buttons) opens the product page ----
document.addEventListener("click", (e) => {
  const card = e.target.closest("article.product[data-item]");
  if (!card || e.target.closest("a, button, input, select, label")) return;
  card.querySelector(".item-link")?.click();
});

// ---- Terms page: land on the linked section once fonts have loaded ----
// (the browser jumps to #section before web fonts finish, which shifts the page)
if (location.hash && document.querySelector(".legal")) {
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  const land = () => {
    const header = document.querySelector(".site-header");
    const offset = (header ? header.getBoundingClientRect().height : 80) + 24;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: "instant" });
  };
  if (target) {
    if (document.fonts) document.fonts.ready.then(land);
    window.addEventListener("load", () => setTimeout(land, 60));
  }
}
