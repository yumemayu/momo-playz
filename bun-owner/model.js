(function (root) {
  'use strict';
  const menu = ['normal', 'twins', 'glitter', 'devil'];
  const sizes = [1, 2, 2, 3, 3, 3];
  function makeOrder(round, random = Math.random) {
    const available = menu.slice(0, Math.min(4, round + 1));
    return Array.from({ length: sizes[round] }, () => available[Math.min(available.length - 1, Math.floor(random() * available.length))]);
  }
  function difference(order, tray) {
    const missing = [], extra = [];
    const remaining = [...order];
    for (const kind of tray) {
      const i = remaining.indexOf(kind);
      if (i === -1) extra.push(kind);
      else remaining.splice(i, 1);
    }
    missing.push(...remaining);
    return { missing, extra, matches: !missing.length && !extra.length };
  }
  function reward(order, mistakes) { return order.length * 10 + (mistakes === 0 ? 5 : 0); }
  const api = { menu, sizes, makeOrder, difference, reward };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BunOwnerModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
