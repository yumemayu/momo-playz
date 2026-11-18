(function (root) {
  'use strict';
  const menu = ['normal', 'twins', 'glitter', 'devil'];
  const sizes = [1, 2, 2, 3, 1, 3];
  function makeOrder(round, random = Math.random, customer) {
    const available = menu.slice(0, Math.min(4, round + 1));
    const order = Array.from({ length: sizes[round] }, () => available[Math.min(available.length - 1, Math.floor(random() * available.length))]);
    if (round > 0 && round < menu.length) order[0] = available[available.length - 1];
    if (customer === 'mama') order.fill('twins');
    if (customer === 'papa' || customer === 'baby') order.fill('normal');
    if (customer === 'girl') order[0] = 'glitter';
    if (round === 5) order[0] = 'devil';
    return order;
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
