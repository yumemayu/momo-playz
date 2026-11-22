(() => {
  'use strict';
  // Add new games at the end. Each row contains the route, Japanese and English
  // names, card color, artwork, optional artwork class, and optional NEW expiry.
  const games = [
  [
    "mood-stars",
    "きょうのきぶん星",
    "Mood Stars",
    "#eee2ff",
    "<img class=\"game-art\" src=\"mood-stars/rainbow.webp\" width=\"40\" height=\"40\" alt=\"\">",
    "",
    "2026-12-13"
  ],
  [
    "tic-tac-toe",
    "三目ならべ",
    "Tic-Tac-Toe",
    "#ffd0e4",
    "<span class=\"game-art\" aria-hidden=\"true\">⭕</span>",
    "",
    ""
  ],
  [
    "waffle-deco-show",
    "ワッフル・デコショー",
    "Waffle Deco Show",
    "#dcf2e5",
    "<span class=\"game-art\" aria-hidden=\"true\">🧇</span>",
    "",
    "2026-12-06"
  ],
  [
    "penguin-slide",
    "ぺんぎん すいーっ",
    "Penguin Glide",
    "#fff2cd",
    "<span class=\"game-art\" aria-hidden=\"true\">🐧</span>",
    "",
    "2026-12-06"
  ],
  [
    "cream-soda",
    "クリームソーダ屋さん",
    "Cream Soda Shop",
    "#def4fa",
    "<span class=\"game-art\" aria-hidden=\"true\">🥤</span>",
    "",
    "2026-12-10"
  ],
  [
    "pudding-table-jump",
    "プリンのテーブルジャンプ",
    "Pudding Table Jump",
    "#eee2ff",
    "<span class=\"game-art\" aria-hidden=\"true\">🍮</span>",
    "",
    "2026-12-09"
  ],
  [
    "whats-next",
    "つぎはなに？",
    "What's Next?",
    "#e7ddff",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#e7ddff\"/><rect x=\"12\" y=\"20\" width=\"11\" height=\"11\" rx=\"3\" fill=\"#f272a7\"/><circle cx=\"32\" cy=\"26\" r=\"6\" fill=\"#4f9dd8\"/><rect x=\"41\" y=\"20\" width=\"11\" height=\"11\" rx=\"3\" fill=\"#f6efff\" stroke=\"#a06cd5\" stroke-width=\"1.6\" stroke-dasharray=\"3 2\"/><text x=\"46.5\" y=\"29.5\" text-anchor=\"middle\" font-size=\"9\" font-weight=\"900\" fill=\"#a06cd5\">?</text><polygon points=\"20,40 26,50 14,50\" fill=\"#52b788\"/><rect x=\"30\" y=\"41\" width=\"10\" height=\"10\" rx=\"2.5\" fill=\"#f6a83e\"/><circle cx=\"47\" cy=\"46\" r=\"5.5\" fill=\"#a06cd5\"/></svg>",
    "picker-whatsnext",
    "2026-12-09"
  ],
  [
    "cube-count",
    "キューブかぞえ",
    "Cube Count",
    "#d8f3dc",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#d8f3dc\"/><polygon points=\"32,10 50,19 32,28 14,19\" fill=\"#ffedb0\" stroke=\"#c9a44a\" stroke-width=\"1.6\"/><polygon points=\"14,19 32,28 32,44 14,35\" fill=\"#f2d67c\" stroke=\"#c9a44a\" stroke-width=\"1.6\"/><polygon points=\"32,28 50,19 50,35 32,44\" fill=\"#e0b95c\" stroke=\"#c9a44a\" stroke-width=\"1.6\"/><circle cx=\"47\" cy=\"47\" r=\"10\" fill=\"#f272a7\"/><text x=\"47\" y=\"52\" text-anchor=\"middle\" font-size=\"13\" font-weight=\"900\" fill=\"#fff\">?</text></svg>",
    "picker-cubecount",
    "2026-12-09"
  ],
  [
    "shadow-light",
    "シャドーライト",
    "Shadow Light",
    "#ffedb0",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#ffedbe\"/><circle cx=\"20\" cy=\"17\" r=\"6\" fill=\"#ffb84d\"/><polygon points=\"38,13 50,19 38,25 26,19\" fill=\"#ffedb0\" stroke=\"#c9a44a\" stroke-width=\"1.6\"/><polygon points=\"26,19 38,25 38,35 26,29\" fill=\"#f2d67c\" stroke=\"#c9a44a\" stroke-width=\"1.6\"/><polygon points=\"38,25 50,19 50,29 38,35\" fill=\"#e0b95c\" stroke=\"#c9a44a\" stroke-width=\"1.6\"/><rect x=\"24\" y=\"42\" width=\"9\" height=\"9\" rx=\"2\" fill=\"#57344a\"/><rect x=\"35\" y=\"39\" width=\"9\" height=\"12\" rx=\"2\" fill=\"#57344a\"/></svg>",
    "picker-shadowlight",
    "2026-12-09"
  ],
  [
    "cube-net",
    "キューブネット",
    "Cube Net",
    "#ffd7e8",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#ffe3ef\"/><polygon points=\"32,10 50,19 32,28 14,19\" fill=\"#ffd7e8\" stroke=\"#c98aa5\" stroke-width=\"1.8\"/><polygon points=\"14,19 32,28 32,46 14,37\" fill=\"#ffedb0\" stroke=\"#c9a44a\" stroke-width=\"1.8\"/><polygon points=\"32,28 50,19 50,37 32,46\" fill=\"#ffc9c9\" stroke=\"#c97f7f\" stroke-width=\"1.8\"/><path d=\"M23 31l1.4 3.5 3.8.2-2.9 2.4 1 3.7-3.3-2.1-3.2 2.1 1-3.7-2.9-2.4 3.8-.2z\" fill=\"#f2a007\"/></svg>",
    "picker-cubenet",
    "2026-12-09"
  ],
  [
    "one-stroke",
    "ひとふでがき",
    "One-Stroke Drawing",
    "#eee2ff",
    "<img class=\"game-art\" src=\"one-stroke/banner.svg\" alt=\"\" width=\"40\" height=\"40\">",
    "",
    "2026-12-09"
  ],
  [
    "bun-owner",
    "肉まん屋オーナー",
    "Bun Shop Owner",
    "#ffd0e4",
    "<img class=\"game-art\" src=\"assets/game-bun.png\" alt=\"\" width=\"40\" height=\"40\">",
    "",
    "2026-12-07"
  ],
  [
    "hanoi",
    "ハノイの塔",
    "Tower of Hanoi",
    "#ffe6c7",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#fff3e2\"/><rect x=\"11\" y=\"48\" width=\"42\" height=\"5\" rx=\"2.5\" fill=\"#b57e42\"/><g fill=\"#57344a\"><rect x=\"17.5\" y=\"15\" width=\"4\" height=\"33\" rx=\"2\"/><rect x=\"30\" y=\"15\" width=\"4\" height=\"33\" rx=\"2\"/><rect x=\"42.5\" y=\"15\" width=\"4\" height=\"33\" rx=\"2\"/></g><rect x=\"11.5\" y=\"41\" width=\"16\" height=\"7\" rx=\"3.5\" fill=\"#ff6482\"/><rect x=\"13\" y=\"34\" width=\"13\" height=\"7\" rx=\"3.5\" fill=\"#ffcf3f\"/><rect x=\"24.5\" y=\"22\" width=\"12\" height=\"7\" rx=\"3.5\" fill=\"#34ce8b\"/><path d=\"M44.5 9.5 l1.3 3 3 1.3 -3 1.3 -1.3 3 -1.3 -3 -3 -1.3 3 -1.3 Z\" fill=\"#f6b73e\"/></svg>",
    "picker-hanoi",
    "2026-12-07"
  ],
  [
    "minesweeper",
    "マインスイーパ",
    "Minesweeper",
    "#d9f2e2",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#e6f7ec\"/><rect x=\"12\" y=\"12\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#34ce8b\"/><rect x=\"26\" y=\"12\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#fdf6ec\" stroke=\"#f3e3d3\" stroke-width=\"1.6\"/><rect x=\"40\" y=\"12\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#34ce8b\"/><rect x=\"12\" y=\"26\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#fdf6ec\" stroke=\"#f3e3d3\" stroke-width=\"1.6\"/><rect x=\"26\" y=\"26\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#34ce8b\"/><rect x=\"40\" y=\"26\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#fdf6ec\" stroke=\"#f3e3d3\" stroke-width=\"1.6\"/><rect x=\"12\" y=\"40\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#34ce8b\"/><rect x=\"26\" y=\"40\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#fdf6ec\" stroke=\"#f3e3d3\" stroke-width=\"1.6\"/><rect x=\"40\" y=\"40\" width=\"12\" height=\"12\" rx=\"3\" fill=\"#34ce8b\"/><text x=\"32\" y=\"21.5\" font-family=\"Arial, sans-serif\" font-weight=\"900\" font-size=\"10\" fill=\"#4fa3ff\" text-anchor=\"middle\">1</text><text x=\"18\" y=\"35.5\" font-family=\"Arial, sans-serif\" font-weight=\"900\" font-size=\"10\" fill=\"#34b06b\" text-anchor=\"middle\">2</text><g><rect x=\"45\" y=\"42\" width=\"2\" height=\"9\" fill=\"#57344a\"/><path d=\"M47 42 L54 44.5 L47 47 Z\" fill=\"#ff5252\"/></g></svg>",
    "picker-minesweeper",
    "2026-12-07"
  ],
  [
    "hit-blow",
    "ヒット＆ブロー",
    "Hit & Blow",
    "#ffe0ec",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#fff0f6\"/><circle cx=\"20\" cy=\"24\" r=\"8.5\" fill=\"#ff6482\"/><circle cx=\"44\" cy=\"24\" r=\"8.5\" fill=\"#4fa3ff\"/><circle cx=\"20\" cy=\"44\" r=\"8.5\" fill=\"#ffcf3f\"/><circle cx=\"44\" cy=\"44\" r=\"8.5\" fill=\"#34ce8b\"/><g fill=\"#ffffff\" opacity=\".8\"><ellipse cx=\"17\" cy=\"21\" rx=\"3\" ry=\"2.2\"/><ellipse cx=\"41\" cy=\"21\" rx=\"3\" ry=\"2.2\"/><ellipse cx=\"17\" cy=\"41\" rx=\"3\" ry=\"2.2\"/><ellipse cx=\"41\" cy=\"41\" rx=\"3\" ry=\"2.2\"/></g></svg>",
    "picker-hitblow",
    "2026-12-07"
  ],
  [
    "fry-catch",
    "フライキャッチ",
    "Fry Catch",
    "#eee2ff",
    "<img class=\"game-art\" src=\"assets/game-fries.png\" alt=\"\" width=\"40\" height=\"40\">",
    "",
    ""
  ],
  [
    "smiley-bun-catch",
    "にこにこ肉まんキャッチ",
    "Smiley Bun Catch",
    "#ffd0e4",
    "<img class=\"game-art\" src=\"assets/game-bun.png\" alt=\"\" width=\"40\" height=\"40\">",
    "",
    ""
  ],
  [
    "glasses-cat",
    "メガネ猫さがし",
    "Find the Glasses Cat",
    "#dcf2e5",
    "<img class=\"game-art\" src=\"assets/game-cat.png\" alt=\"\" width=\"40\" height=\"40\">",
    "",
    ""
  ],
  [
    "piano",
    "Momoピアノ",
    "Momo Piano",
    "#fff2cd",
    "<span class=\"picker-illustration\" aria-hidden=\"true\">♪</span>",
    "picker-piano",
    ""
  ],
  [
    "capybara-merge",
    "カピバラ温泉マージ",
    "Capybara Onsen Merge",
    "#ffe1d6",
    "<span class=\"picker-illustration\" aria-hidden=\"true\"></span>",
    "picker-merge",
    ""
  ],
  [
    "capybara-memory",
    "カピバラ神経衰弱",
    "Capybara Memory Match",
    "#fff2cd",
    "<span class=\"picker-illustration\" aria-hidden=\"true\"></span>",
    "picker-memory",
    ""
  ],
  [
    "capybara-tap",
    "カピバラ温泉タップ",
    "Capybara Onsen Tap",
    "#def4fa",
    "<span class=\"picker-illustration\" aria-hidden=\"true\"></span>",
    "picker-bath",
    "2026-12-07"
  ],
  [
    "cat-trap",
    "ねこを かこもう！",
    "Trap the Cat",
    "#eee2ff",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"7\" y=\"7\" width=\"50\" height=\"50\" rx=\"11\" fill=\"#cdeeb2\"/><rect x=\"43\" y=\"1\" width=\"17\" height=\"14\" rx=\"2.5\" fill=\"#d9a066\" stroke=\"#b57e42\" stroke-width=\"1.6\"/><g transform=\"translate(9.6 7) scale(0.7)\"><path d=\"M9 30 11 11 26 19 Q32 17 38 19 L53 11 55 30 C65 65 -1 65 9 30Z\" fill=\"#fdf3e3\" stroke=\"#57344a\" stroke-width=\"3\"/><path d=\"M15 17 21 23 14 26Z M49 17 50 26 43 23Z\" fill=\"#f987aa\"/><circle cx=\"23\" cy=\"35\" r=\"2.4\" fill=\"#57344a\"/><circle cx=\"41\" cy=\"35\" r=\"2.4\" fill=\"#57344a\"/><path d=\"M28 43Q30 46 32 42Q34 46 37 43\" fill=\"none\" stroke=\"#57344a\" stroke-width=\"2.5\" stroke-linecap=\"round\"/><path d=\"M29 35h6\" stroke=\"#493153\" stroke-width=\"3.5\"/><circle cx=\"22\" cy=\"35\" r=\"7\" fill=\"none\" stroke=\"#493153\" stroke-width=\"3.5\"/><circle cx=\"42\" cy=\"35\" r=\"7\" fill=\"none\" stroke=\"#493153\" stroke-width=\"3.5\"/></g></svg>",
    "picker-trap",
    "2026-12-07"
  ],
  [
    "quoridor",
    "コリドール",
    "Quoridor",
    "#ffe3ba",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"10\" fill=\"#f3dfba\"/><rect x=\"12\" y=\"40\" width=\"26\" height=\"7\" rx=\"3.5\" fill=\"#c98a4b\"/><rect x=\"42\" y=\"16\" width=\"7\" height=\"26\" rx=\"3.5\" fill=\"#c98a4b\"/><path d=\"M19 21l1.8-6.2L25 18M31 21l-1.8-6.2L25 18\" fill=\"#fff5fa\" stroke=\"#57344a\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/><circle cx=\"25\" cy=\"25\" r=\"8\" fill=\"#fff5fa\" stroke=\"#57344a\" stroke-width=\"2.4\"/><circle cx=\"22.2\" cy=\"24.4\" r=\"1.5\" fill=\"#57344a\"/><circle cx=\"27.8\" cy=\"24.4\" r=\"1.5\" fill=\"#57344a\"/><path d=\"M22.8 28.4q2.2 1.8 4.4 0\" fill=\"none\" stroke=\"#57344a\" stroke-width=\"1.8\" stroke-linecap=\"round\"/></svg>",
    "picker-quoridor",
    "2026-12-07"
  ],
  [
    "lights-out",
    "ライトアウト",
    "Lights Out",
    "#fff3b8",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#fff6d8\"/><rect x=\"13\" y=\"13\" width=\"17\" height=\"17\" rx=\"5\" fill=\"#ffd94d\"/><rect x=\"34\" y=\"13\" width=\"17\" height=\"17\" rx=\"5\" fill=\"#cfc8e8\"/><rect x=\"13\" y=\"34\" width=\"17\" height=\"17\" rx=\"5\" fill=\"#cfc8e8\"/><rect x=\"34\" y=\"34\" width=\"17\" height=\"17\" rx=\"5\" fill=\"#ffd94d\"/><path d=\"M21 8v-3M10 15l-2-2M32 15l2-2M43 39l3-1M46 46l3 1\" stroke=\"#f6b73e\" stroke-width=\"2.4\" stroke-linecap=\"round\"/></svg>",
    "picker-lights",
    "2026-12-07"
  ],
  [
    "flow",
    "フローパズル",
    "Flow",
    "#dff3ff",
    "<svg class=\"game-art\" viewBox=\"0 0 64 64\" aria-hidden=\"true\"><rect x=\"6\" y=\"6\" width=\"52\" height=\"52\" rx=\"12\" fill=\"#eaf7ff\"/><path d=\"M20 44V20h24\" fill=\"none\" stroke=\"#f272a7\" stroke-width=\"7\" stroke-linecap=\"round\"/><circle cx=\"20\" cy=\"44\" r=\"6.5\" fill=\"#f272a7\"/><circle cx=\"44\" cy=\"20\" r=\"6.5\" fill=\"#f272a7\"/><path d=\"M44 44H28\" stroke=\"#58cf9e\" stroke-width=\"7\" stroke-linecap=\"round\"/><circle cx=\"44\" cy=\"44\" r=\"6.5\" fill=\"#58cf9e\"/><circle cx=\"28\" cy=\"44\" r=\"6.5\" fill=\"#58cf9e\"/></svg>",
    "picker-flow",
    "2026-12-07"
  ],
  [
    "bun-lights",
    "肉まんライト",
    "Bun Lights",
    "#def4fa",
    "<img class=\"game-art\" src=\"assets/game-bun.png\" alt=\"\" width=\"42\" height=\"42\">",
    "picker-bath",
    ""
  ],
  [
    "clicky-keys",
    "カチカチキー",
    "Clicky Keys",
    "#dcf2e5",
    "<span class=\"game-art\" aria-hidden=\"true\">⌨</span>",
    "picker-piano",
    ""
  ],
  [
    "switch-shine",
    "ピカッとスイッチ",
    "Switch & Shine",
    "#fff2cd",
    "<span class=\"game-art\" aria-hidden=\"true\">⚡</span>",
    "",
    ""
  ],
  [
    "dodgeball",
    "Momo ドッジボール",
    "Momo Dodgeball",
    "#def4fa",
    "<span class=\"game-art\" aria-hidden=\"true\">🏐</span>",
    "",
    ""
  ]
];
  const site = new URL('./', document.currentScript.src);
  const here = location.pathname.replace(/index\.html$/, '').replace(/\/$/, '');
  const home = document.querySelector('#all-games-picker');
  const footer = document.querySelector('[data-game-catalog]');
  const picker = home || footer;
  if (!picker) return;
  const labels = [];
  const links = document.createDocumentFragment();
  for (const [route, ja, en, color, artwork, cssClass, newUntil] of games) {
    const target = new URL(route + '/', site);
    if (!home && target.pathname.replace(/\/$/, '') === here) continue;
    const link = document.createElement('a');
    link.href = home ? route + '/' : target.href;
    if (cssClass) link.className = cssClass;
    link.style.setProperty('--picker-color', color);
    // Artwork is static catalog markup. Resolve image paths from the site root.
    link.innerHTML = artwork;
    for (const image of link.querySelectorAll('img[src]')) {
      image.src = new URL(image.getAttribute('src'), site).href;
    }
    const label = document.createElement('span');
    label.textContent = en;
    label.setAttribute('data-ja', ja);
    link.append(label);
    labels.push({label, ja, en});
    if (home && newUntil) {
      const badge = document.createElement('span');
      badge.className = 'new-badge';
      badge.dataset.newUntil = newUntil;
      badge.textContent = 'NEW';
      link.append(badge);
    }
    links.append(link);
  }
  picker.replaceChildren(links);
  if (home) return; // The homepage language controller also manages its cloned cards.
  const localize = () => {
    const japanese = document.documentElement.lang.startsWith('ja');
    picker.setAttribute('aria-label', japanese ? 'ほかのMomoゲーム' : 'More Momo games');
    for (const {label, ja, en} of labels) label.textContent = japanese ? ja : en;
  };
  localize();
  new MutationObserver(localize).observe(document.documentElement, {attributeFilter: ['lang']});
})();
