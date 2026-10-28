# AGENTS.md — handover for AI coding agents

Read this first. It holds the context that is not obvious from the code: the user's preferences, design rules, workflows, pitfalls and open questions. `README.md` describes the gameplay for players (in French).

## Project

- **« L'Aventure Légendaire »** : a Minecraft-like 3D survival game in the browser (Three.js r160, loaded from a CDN with an import map). The player is 5 cm tall in a real-size house with 5 rooms, a garden and a small mouse-hole base behind the office desk.
- **Audience: a young child.** Simplicity first, generous timings, clear messages, no frustrating fails. Keep gameplay readable at a glance.
- **Owner:** GitHub account `lesdudus`. Repo: https://github.com/lesdudus/laventure-legendaire (public). Live build (GitHub Pages, `main` branch, root folder): https://lesdudus.github.io/laventure-legendaire/
- **Language:** all in-game text, README and commit messages are in **French**. The user mostly writes in French: answer in the user's language, concisely, and **always end with the list of what was not tested**.

## Working with this user

- The user often asks you to act as a prompt engineer (improve a prompt, ask clarifying questions with a form, recommend a "thinking effort"), then to execute the prompt. Ask questions before acting when a design choice matters; when told to "act autonomously", decide and list your questions at the end.
- After each change: build, run all checks, test with headless Edge, take screenshots, then summarise (French, concise) with untested points.
- **Do not push to GitHub unless asked.** When asked, push and wait for the Pages build (see "Publishing").
- Fix pre-existing bugs only when asked, but mention the ones you find (e.g. navigation holes).

## Layout and build

| Path | Role |
|---|---|
| `src/00-shell.html` | Page, CSS, HUD/panels markup, the `/*__GAME__*/` placeholder |
| `src/01-core.js` … `src/09h-features.js` | Game modules, concatenated **in the order listed in `tools/build.py`** (not alphabetical: `09f`, `09e`, `09g`, `09h` come before `09d-systems.js`, which boots the game) |
| `tools/build.py` | Builds `index.html` (the playable game) and `tools/check.mjs` (JS only, for checks) |
| `tools/check_enc.py` | Detects mojibake (broken accents) in `src/` (or a given path) |
| `index.html` | **Generated. Never edit by hand.** |
| `laventure-legendaire.html` | Tiny redirect to `index.html` (old links) |
| `docs/` | Screenshots, **git-ignored** (kept outside GitHub; a zip copy may exist) |

Module map: `02a` builders (box/deco/wall/addSolid/RAMPS/buckets) · `02b` house shell, windows, garden door · `02c` bedroom, bathroom, office · `02d` living room, kitchen · `02e` garden, shed, clothes line, spots, nav targets · `02f` Minecraft easter eggs · `02g` base · `02h` Lego castle · `02i` barbecue · `03` physics, hiding score · `04` items, recipes, spawns, pickups, halos · `05` models · `06a` nav grids, noise, scent · `06b` humans and schedules · `06c` Rex (dog), Moustache (cat), Bubulle (fish) · `07` missions · `08` UI, HUD, minimap · `09a` state, saves, render loop, camera, garden door timing · `09b` player, car, cat ride, plane, held item · `09c` actions, interactions, cubes, Bubulle dialog · `09d` survival, rest, perception, keys, boot, debug hook · `09e` easter-egg logic · `09f` events (accidents, birthday, Christmas, cream footprints, balloons) · `09g` graphics styles · `09h` pocket car, invisibility, equipment HUD.

## Build and checks (run after every change)

```powershell
python tools/build.py
node --check tools/check.mjs
npx --yes eslint@8 --no-eslintrc --env browser,es2022 --parser-options=ecmaVersion:2022 --parser-options=sourceType:module --rule '{\"no-undef\":\"error\",\"no-redeclare\":\"error\"}' --global THREE tools/check.mjs
python tools/check_enc.py
Remove-Item tools/check.mjs   # git-ignored, delete after checks
```

## Hard rules

- **UTF-8 only.** Edit sources with an editor tool or Python `encoding='utf-8'`. **Never** use PowerShell `Get-Content`/`Set-Content` on sources (accents get corrupted). Inline Python passed through PowerShell also mangles accents and quotes: write a `.py` file instead. Patch scripts must assert match counts.
- **Child-friendly physics:** jump height 22 cm; any walking route must use steps of **20 cm max**. Don't change the jump or step heights.
- **Saves stay compatible.** Add migrations in `startGame()` (`09a`) for any changed save field. Settings live in `SETTINGS` (localStorage key `minuscule_settings_v1`), never in the game save. Game save keys: `minuscule_save_v1` / `minuscule_checkpoint_v1` (IndexedDB + localStorage copy).
- **Both graphics styles** (`pixel`, `lowpoly`) must work with any new object.
- **Performance:** merge static geometry (`box`/`deco` buckets, `meshBoxes`, `InstancedMesh`), no mesh per brick/blade. The target machine has an Intel Iris Xe and a 4K screen at 250 %.
- **Colours in UI CSS:** use the `--cp-*` variables only.
- Update `README.md` (and the in-game « Commandes » panel in `00-shell.html`) when gameplay changes.

## World facts

- 1 unit = 1 cm. Y up, X east, Z south. House x 0..1200, z 0..850, ceiling 250 (not solid). Garden z 862..1650, patio x 850..1212 z 862..1000.
- Rooms: bedroom x 0..414 z 0..414 · bathroom x 426..714 z 0..414 · office x 726..1200 z 0..414 · living room x 0..644 z 426..850 · kitchen x 656..1200 z 426..850.
- Base (mouse hole) burrow x 840..960 z −62..−12, spawn (900, 0, −34). Coffee table top 43, kitchen table and desk 75, worktop 90, fridge 180, kitchen cupboard 220, wardrobe 215, shed roof 206.
- Time: `CONFIG.timeScale` 72 → 1 game hour = 50 real seconds, 1 day = 20 min.
- Nav grids (`06a`): human cell 20 cm (clearance 14), dog 10 cm (9), cat 10 cm (6). After moving furniture, check that every human spot, dog patrol spot and cat spot still has a path (see "Testing").

## Main systems (where to look)

- Survival: `G.s = { vie, nour, energie }`, single « Nourriture » bar (100 → 0 in 48 game hours), blue overlay below 15 %. Fatigue black overlay unchanged.
- « Souffle » (stamina): `CONFIG.breath` (20 s run, 8 s refill after 1 s, run again from 30 %). Also drains while hanging from a balloon. The 🏅 medal gives +40 %.
- Cat ride: `CONFIG.cat` (`rideAff` 20 — a future hard mode could raise it to 60/80; jump 130; 90 s unless setting `catUnlimited`). Riding = invisible to humans and Rex.
- Invisibility suit + « Cristal d'ombre » (4 game hours each, 1 spawns per morning, max 4).
- Garden door: random 30-min "airing" slots, at least 6 h/day between 8:30 and 20:00 (`doorPlan` in `09a`).
- Birthday (every 10 days, `isBirthday`): cream footprints → 1 h search (`G.fx.huntUntil`), balloons (`G.mode === 'balloon'`), medal.
- Puddles: garden 2 sips/day (no cap filling), bath 3 sips/evening (shrinks, 3rd gives hiccups).
- Hiding: `hideScore()` in `03-physics.js`; humans see via `visibilityOfPlayer()`; noise via `emitNoise()`.

## Testing (headless Edge)

- No local HTTP server (local sockets may be blocked): open `file:///.../index.html` directly.
- Use **Node + `playwright-core`** in a temp folder (`npm i playwright-core`), `chromium.launch({ channel: 'msedge', headless: true })`. Accept dialogs (`page.on('dialog', d => d.accept())`) because « Nouvelle partie » asks for confirmation when a save exists.
- Debug hook `window.__minuscule`: `tp, give, setHour, setDay, advance(sec, render), key, useSlot, drop, freeMouse, setAff, toggleVehicle, saveGame, DB, applyStyle, styleFrame, camera, renderer, scene, Input, NAV, buildNav, removeSolid, HUMANS, Dog, Cat, PICKUPS, SOLIDS, RAMPS, INV, CHEST, CUBES, W, CASTLE, BBQ, spawnCrystal, toggleInvis, stowCar, deployCar…` and `G` (game state).
- Simulate input with `M.Input.keys.add('KeyW')` + `M.advance(0.05)` loops. Headless windows are unfocused, so the loop renders at 5 fps: call `advance(…, true)` before screenshots.
- For clean screenshots of a spot: open the pause panel, hide every overlay element except the canvas, and freeze the camera (temporarily override `camera.position.set` / `lookAt`).
- Delete temp folders and `tools/check.mjs` afterwards.

## Publishing (only when asked)

- Commit author: `lesdudus <325640393+lesdudus@users.noreply.github.com>` (set in the repo's local git config). Add the trailer `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
- The original PC also had a work GitHub account as the default `gh` account. The repo's local `.git/config` therefore used a credential helper that asks for the `lesdudus` token specifically: `!f() { test "$1" = get && echo username=lesdudus && echo password=$(gh auth token --user lesdudus); }; f`. On a machine where `lesdudus` is the only `gh` account, `gh auth setup-git` is enough.
- After pushing, wait for `gh api repos/lesdudus/laventure-legendaire/pages/builds/latest` to show `built` with the new commit SHA.

## Setting up a new Windows machine

1. Install Git, GitHub CLI (`winget install GitHub.cli`), Python 3, Node.js LTS, VS Code with GitHub Copilot. Edge is preinstalled.
2. `gh auth login` with the **lesdudus** account.
3. `git clone https://github.com/lesdudus/laventure-legendaire.git C:\code\Laventurelegendaire`, then in that folder: `git config user.name lesdudus` and `git config user.email 325640393+lesdudus@users.noreply.github.com`, and `gh auth setup-git` (or the helper above if several accounts are logged in).
4. Unzip the screenshots archive into `docs/` if you have it.
5. Run the build and checks above, then open `index.html` in Edge.

## Open questions for the user (not yet answered)

1. Birthday: there are no guest characters; Marc and Léa do the searching. Add real guests in the living room from 16:00 to 19:00?
2. Falling on the parquet after letting go of a balloon costs up to 30 HP. Too much or not enough?
3. Balloons are usable all birthday long (easier in the morning when the room is empty). Limit them to the party (16:00–19:00)?

## Known untested points

- Real keyboard and mouse play: cat ride feel, balloon flight, clothes line, jumping from the last shed step to the window.
- Low-poly style for recent additions (crate stairs, clothes line, balloons, medal, bath puddle, moved furniture).
- Night rendering of the garden passage; whether humans spot the player easily on the clothes line.
- Held item while driving the car or riding the cat.
- A full birthday party played live (search behaviour during the party).

## Ideas mentioned but not done

- A slowdown recorder (logs slow frames with context) to diagnose stutters. Stutters seen so far came from other apps using the GPU (VS Code browser tabs, several copies of the game open).
- Sharper rendering on high-DPI screens (higher max pixel ratio, a "3D sharpness" slider, no `logarithmicDepthBuffer`, chunked meshes) — explained, not implemented.
- Halo for other rare items (e.g. the diamond); a bigger crystal halo if it is too discreet.
- A harder mode (e.g. higher cat-ride affection threshold).
