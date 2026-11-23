/* Home decor (2026-11-23): move the gem dock into the header and show the
   goal progress as a bar inside the chip (the goal caption is hidden). */
(() => {
  const setup = () => {
    const header = document.querySelector('header');
    const dock = document.querySelector('.coin-dock');
    if (!header || !dock) return false;
    if (dock.parentElement !== header) header.append(dock);
    const chip = dock.querySelector('.coin-chip');
    const goal = dock.querySelector('.coin-goal');
    if (!chip || !goal) return true;
    let bar = chip.querySelector('.chip-bar');
    if (!bar) {
      bar = document.createElement('span');
      bar.className = 'chip-bar';
      bar.innerHTML = '<i></i>';
      chip.append(bar);
    }
    const fill = bar.querySelector('i');
    const update = () => {
      const nums = (goal.textContent.match(/\d+/g) || []).map(Number);
      if (nums.length >= 2 && nums[1] > 0) {
        const pct = Math.max(0, Math.min(100, Math.round((nums[1] - nums[0]) / nums[1] * 100)));
        fill.style.width = pct + '%';
        bar.style.display = '';
      } else {
        bar.style.display = 'none';
      }
    };
    update();
    new MutationObserver(update).observe(goal, { childList: true, characterData: true, subtree: true });
    return true;
  };
  if (!setup()) {
    const timer = setInterval(() => { if (setup()) clearInterval(timer); }, 300);
    setTimeout(() => clearInterval(timer), 5000);
  }
})();
