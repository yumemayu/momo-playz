# One Stroke and Shape Passage

Both pages reuse the existing Hanoi page structure and shared game.css,
game-picker.css, game-title-banner.css, language.js, nickname.js and scores.js.
The new CSS only supplies the puzzle field, its contents and each game's banner
art/color variables. No existing shared controls are reimplemented.

## Play

- One Stroke: select a starting junction, then use each line exactly once.
  Slide continuously, tap connected lines, or focus a line and press Enter/Space.
  A lifted finger does not erase the already drawn route. Undo removes one line;
  Restart clears the current drawing. There are three original drawings in each
  of five difficulty levels, including a capybara, fish, butterfly and cat.
- Shape Passage: choose among three/four connected cube solids, without turning
  them. Only one has the exact frontal projection of the opening. Rear cubes are
  included in collision checks; harder levels include more depth and protrusions.
  The wall, floor, hole and all candidates share one oblique camera. Solids travel from near-left to far-right; front/behind face clipping lets the wall occlude them during passage. All candidate thumbnails share the same scale.
- Complete three puzzles, then choose See results to finish the set. The score
  starts at 3000, subtracts 2 per elapsed second and 100 per retry/Undo/Restart,
  with a minimum of 100. Stop does not submit a completed score.

## Checks

```sh
node --check puzzle-play.js
node puzzle-model.test.cjs
node puzzle-ui.test.cjs
```

The model checks every drawing, all starting junctions, edge reuse, 2500 seeded
passage rounds, unique answers and connected solids. UI tests execute the real
handlers in a small DOM double, covering all five levels and three-puzzle sets,
continuous drag, keyboard/taps, Undo/Restart/Stop and stale animation completion.
They are not visual browser or physical touch-device tests.

## Release checks still needed

- Browser layout and touch checks on phone, tablet and desktop.
- Verify the external Apps Script accepts game IDs `one-stroke` and
  `shape-passage`; its server source is not in this repository. The pages call
  the existing scores.js API, but this does not prove backend registration.
- Add links to the new pages throughout older games' navigation when releasing
  the complete puzzle collection. This change adds home-page entry points and
  includes the existing games in both new pages' common navigation.
