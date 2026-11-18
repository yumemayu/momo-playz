# One Stroke

Fifteen original Euler-path drawings in five levels, three puzzles per set.
Choose a junction and use every edge once. Continuous pointer drawing, connected
line taps and Enter/Space input are supported. Undo removes one edge, Restart
resets the current puzzle, and Stop never posts a completed score.

The page uses existing shared CSS, language, nickname, score and navigation UI.
Only the field, line artwork and game logic are new. Shape Passage is held back
and is not linked or included in this release.

Checks:

```sh
node --check one-stroke/game.js
node one-stroke/model.test.cjs
node one-stroke/ui.test.cjs
node one-stroke/gesture.test.cjs
```

The tests cover all drawings and starts, edge reuse, complete three-puzzle sets,
continuous drag across junctions, keyboard, Undo/Restart/Stop and replay. UI tests
use a DOM double; browser checks are performed separately after publication.

The gesture tracker samples pointer travel between events, chooses branches by
motion direction, supports both directions around closed curves and retains a
partly drawn edge after lifting the finger. Gesture tests cover all 15 drawings
with dense/sparse movement and lifts, fast corners, pointerup endpoints, reverse
curves and small junction wobbles.
