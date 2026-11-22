const scope = new URL(self.registration.scope);
const prefix = 'offline:' + scope.pathname + ':';
const live = prefix + 'visited';
const pack = prefix + 'games-07d965cb83ce';
const marker = new URL('offline-ready', scope).href;
const files = [
  "assets/banner-dodgeball.jpg",
  "assets/banner-quoridor.jpg",
  "assets/catch-chicken.webp",
  "assets/catch-cola.webp",
  "assets/devil-bun.png",
  "assets/fry-squirrel.png",
  "assets/game-bun.png",
  "assets/game-cat.png",
  "assets/game-fries.png",
  "assets/hello-rainbow.png",
  "assets/momo-squirrels.png",
  "assets/ogp/capybara-merge.jpg",
  "assets/ogp/capybara-tap.jpg",
  "assets/ogp/cat-trap.jpg",
  "assets/toy-shelf-bun.webp",
  "assets/toy-shelf-capybara.webp",
  "assets/toy-shelf-pudding.webp",
  "assets/toy-shelf-shelf.webp",
  "assets/toy-shelf-strawberry.webp",
  "assets/toy-shelf.jpg",
  "bun-lights/banner.svg",
  "bun-lights/index.html",
  "bun-lights/layout.css",
  "bun-lights/manifest.webmanifest",
  "bun-owner/bun-art.js",
  "bun-owner/customers-art.js",
  "bun-owner/customers.webp",
  "bun-owner/index.html",
  "bun-owner/manifest.webmanifest",
  "bun-owner/model.js",
  "bun-owner/owner.css",
  "bun-owner/owner.js",
  "bun-owner/portraits/baby-clean.webp",
  "bun-owner/portraits/baby.webp",
  "bun-owner/portraits/bear-clean.webp",
  "bun-owner/portraits/bear.webp",
  "bun-owner/portraits/cat-clean.webp",
  "bun-owner/portraits/cat.webp",
  "bun-owner/portraits/fox-clean.webp",
  "bun-owner/portraits/fox.webp",
  "bun-owner/portraits/friend-clean.webp",
  "bun-owner/portraits/friend.webp",
  "bun-owner/portraits/girl-clean.webp",
  "bun-owner/portraits/girl.webp",
  "bun-owner/portraits/mama-clean.webp",
  "bun-owner/portraits/mama.webp",
  "bun-owner/portraits/panda-clean.webp",
  "bun-owner/portraits/panda.webp",
  "bun-owner/portraits/papa-clean.webp",
  "bun-owner/portraits/papa.webp",
  "bun-owner/portraits/rabbit-clean.webp",
  "bun-owner/portraits/rabbit.webp",
  "bun-owner/portraits/squirrel-clean.webp",
  "bun-owner/portraits/squirrel.webp",
  "bun-owner/restaurant.webp",
  "capybara-memory/index.html",
  "capybara-memory/manifest.webmanifest",
  "capybara-memory/memory.css",
  "capybara-memory/memory.js",
  "capybara-merge/banner.svg",
  "capybara-merge/index.html",
  "capybara-merge/manifest.webmanifest",
  "capybara-merge/merge.css",
  "capybara-merge/merge.js",
  "capybara-merge/pieces/1.webp",
  "capybara-merge/pieces/10.webp",
  "capybara-merge/pieces/2.webp",
  "capybara-merge/pieces/3.webp",
  "capybara-merge/pieces/4.webp",
  "capybara-merge/pieces/5.webp",
  "capybara-merge/pieces/6.webp",
  "capybara-merge/pieces/7.webp",
  "capybara-merge/pieces/8.webp",
  "capybara-merge/pieces/9.webp",
  "capybara-tap/banner.svg",
  "capybara-tap/index.html",
  "capybara-tap/manifest.webmanifest",
  "capybara-tap/tap.css",
  "capybara-tap/tap.js",
  "cat-trap/banner.svg",
  "cat-trap/cat-trap.css",
  "cat-trap/cat-trap.js",
  "cat-trap/index.html",
  "cat-trap/manifest.webmanifest",
  "catch.js",
  "clicky-keys/banner.svg",
  "clicky-keys/index.html",
  "clicky-keys/layout.css",
  "clicky-keys/manifest.webmanifest",
  "coins.js",
  "cream-soda/index.html",
  "cream-soda/manifest.webmanifest",
  "cream-soda/melon-soda.webp",
  "cream-soda/soda.css",
  "cream-soda/soda.js",
  "cube-count/banner.svg",
  "cube-count/cube-count.css",
  "cube-count/cube-count.js",
  "cube-count/index.html",
  "cube-count/manifest.webmanifest",
  "cube-net/banner.svg",
  "cube-net/cube-net.css",
  "cube-net/cube-net.js",
  "cube-net/index.html",
  "cube-net/manifest.webmanifest",
  "dodgeball/boba.webp",
  "dodgeball/cat-dizzy.webp",
  "dodgeball/cat-squint.webp",
  "dodgeball/cat-surprised.webp",
  "dodgeball/cat.webp",
  "dodgeball/chicken.webp",
  "dodgeball/dodgeball.css",
  "dodgeball/dodgeball.js",
  "dodgeball/index.html",
  "dodgeball/manifest.webmanifest",
  "flow/banner.svg",
  "flow/flow.css",
  "flow/flow.js",
  "flow/index.html",
  "flow/manifest.webmanifest",
  "fry-catch/index.html",
  "fry-catch/manifest.webmanifest",
  "game-picker.css",
  "game-title-banner.css",
  "game.css",
  "glasses-cat/cats.js",
  "glasses-cat/index.html",
  "glasses-cat/layout.css",
  "glasses-cat/manifest.webmanifest",
  "hanoi/banner.svg",
  "hanoi/hanoi.css",
  "hanoi/hanoi.js",
  "hanoi/index.html",
  "hanoi/manifest.webmanifest",
  "hit-blow/banner.svg",
  "hit-blow/hit-blow.css",
  "hit-blow/hit-blow.js",
  "hit-blow/index.html",
  "hit-blow/manifest.webmanifest",
  "home.css",
  "home.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "index.html",
  "language.css",
  "language.js",
  "lights-out/banner.svg",
  "lights-out/index.html",
  "lights-out/lights-out.css",
  "lights-out/lights-out.js",
  "lights-out/manifest.webmanifest",
  "manifest.webmanifest",
  "minesweeper/banner.svg",
  "minesweeper/index.html",
  "minesweeper/manifest.webmanifest",
  "minesweeper/minesweeper.css",
  "minesweeper/minesweeper.js",
  "mood-stars/blue.webp",
  "mood-stars/crystal.webp",
  "mood-stars/index.html",
  "mood-stars/mood-stars.css",
  "mood-stars/mood-stars.js",
  "mood-stars/night-sky.webp",
  "mood-stars/rainbow.webp",
  "mood-stars/rose.webp",
  "nickname.css",
  "nickname.js",
  "offline.js",
  "one-stroke/banner.svg",
  "one-stroke/game.css",
  "one-stroke/game.js",
  "one-stroke/gesture.js",
  "one-stroke/index.html",
  "one-stroke/manifest.webmanifest",
  "one-stroke/model.js",
  "penguin-slide/index.html",
  "penguin-slide/manifest.webmanifest",
  "penguin-slide/penguin.js",
  "piano/index.html",
  "piano/manifest.webmanifest",
  "piano/momo-avatar.webp",
  "piano/piano.css",
  "piano/piano.js",
  "popular.js",
  "pudding-table-jump/index.html",
  "pudding-table-jump/kitchen.jpg",
  "pudding-table-jump/manifest.webmanifest",
  "pudding-table-jump/pudding.css",
  "pudding-table-jump/pudding.js",
  "pudding-table-jump/table-sprites.jpg",
  "pwa.js",
  "quoridor/index.html",
  "quoridor/manifest.webmanifest",
  "quoridor/quoridor.css",
  "quoridor/quoridor.js",
  "scores.js",
  "shadow-light/banner.svg",
  "shadow-light/index.html",
  "shadow-light/manifest.webmanifest",
  "shadow-light/shadow-light.css",
  "shadow-light/shadow-light.js",
  "smiley-bun-catch/index.html",
  "smiley-bun-catch/manifest.webmanifest",
  "soda-gems.js",
  "sticker-book/banner.svg",
  "sticker-book/index.html",
  "sticker-book/manifest.webmanifest",
  "stickers-art.js",
  "stickers.js",
  "switch-shine/banner.svg",
  "switch-shine/index.html",
  "switch-shine/manifest.webmanifest",
  "switch-shine/switch-shine.css",
  "switch-shine/switch-shine.js",
  "tap.js",
  "tic-tac-toe/index.html",
  "tic-tac-toe/tic-tac-toe.css",
  "tic-tac-toe/tic-tac-toe.js",
  "toy-box/index.html",
  "toy-box/manifest.webmanifest",
  "toy-box/momo-cloud-dog.jpg",
  "toy-box/toys.css",
  "toy-box/toys.js",
  "toy-shelf.css",
  "toy-shelf.js",
  "waffle-deco-show/index.html",
  "whats-next/banner.svg",
  "whats-next/index.html",
  "whats-next/manifest.webmanifest",
  "whats-next/whats-next.css",
  "whats-next/whats-next.js"
];
let preparing;

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function savedPack() {
  const names = await caches.keys();
  for (const name of [pack, ...names.filter(name => name.startsWith(prefix + 'games-') && name !== pack).reverse()]) {
    if (!names.includes(name)) continue;
    const cache = await caches.open(name);
    if (await cache.match(marker)) return cache;
  }
  return null;
}
async function saveGames(report) {
  const cache = await caches.open(pack);
  if (await cache.match(marker)) return true;
  let next = 0, done = 0, failed = false;
  await Promise.all(Array.from({length: 6}, async () => {
    while (!failed && next < files.length) {
      const url = new URL(files[next++], scope);
      try {
        const response = await fetch(url, {cache: 'reload'});
        if (!response.ok || response.redirected) throw new Error(url.pathname);
        await cache.put(url, response);
        if (++done % 8 === 0 || done === files.length) report(done + '/' + files.length);
      } catch { failed = true; }
    }
  }));
  if (failed) return false;
  await cache.put(marker, new Response('ready'));
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith(prefix + 'games-') && name !== pack).map(name => caches.delete(name)));
  return true;
}
self.addEventListener('message', event => {
  const port = event.ports[0];
  if (!port) return;
  if (event.data?.type === 'offline-status') {
    event.waitUntil(savedPack().then(cache => port.postMessage({ready: !!cache})));
  } else if (event.data?.type === 'prepare-offline') {
    preparing ||= saveGames(progress => port.postMessage({progress})).finally(() => { preparing = null; });
    event.waitUntil(preparing.then(ready => port.postMessage({ready}), () => port.postMessage({ready:false})));
  }
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const fallback = new URL(url);
  fallback.search = '';
  if (fallback.pathname.endsWith('/')) fallback.pathname += 'index.html';
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && !response.redirected && response.status === 200) {
        try { await (await caches.open(live)).put(request, response.clone()); } catch {}
      }
      return response;
    } catch {
      const saved = await savedPack();
      const offline = await saved?.match(fallback);
      if (offline) return offline;
      const recent = await caches.open(live);
      const hit = await recent.match(request) || await recent.match(request, {ignoreSearch:true});
      if (hit) return hit;
      if (request.mode === 'navigate') {
        return new Response('Offline · このページはまだ保存されていません。オンラインでゲーム集から保存してください。', {
          status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}
        });
      }
      return Response.error();
    }
  })());
});
