# GoSovereign Admin UI — v0.1 (static mock)

Admin interface for the automated self-harvesting duckweed bioreactor system.
This is **stage 1** of the plan: plain HTML/CSS/JS pages running on mock data,
no backend, no network calls. Open `index.html` directly in a browser — nothing
to build or install.

## What's here

```
index.html       Dashboard — system-wide metrics, rack farm strip, fleet at a glance, live alerts
robots.html       Robot fleet — grid + click-through drill-down (telemetry, activity log, camera history, locate/ping)
racks.html        Racks & tiers — rack elevation diagrams, per-tier sensors/coverage, initiate/cancel harvest, cleaning protocol
queue.html        Harvest queue — drag-to-reorder, cancel, ETA
controls.html     Admin action center — LED lighting, cleaning vs. normal protocol, initiate/cancel harvest, queue shortcut
snapshots.html    Image review — RGB + spectral capture history per tier, human confirm/override
reports.html      Reports & alerts — filterable log with drill-down detail
shared/styles.css Design tokens + all component styles
shared/data.js    Mock data generator (racks, tiers, robots, queue, alerts, snapshots, system metrics) — THE SEAM for real data
shared/nav.js     Sidebar/topbar shell, toasts, the "locate robot" modal
```

Every page reads from a single global `window.MOCK` object built in `shared/data.js`.
That's deliberate: when real telemetry is wired in, `data.js` is the only file
that needs to change — swap its generated arrays for `fetch()`/socket results with
the same shape, and every page keeps working unmodified.

## Data model (mirrors the spec)

- **Rack** — id like `A1-R04` (aisle-group / rack number), GPS, base-reservoir
  sensors (pH, dissolved O₂, ORP, reservoir level), and 7 **tiers**.
- **Tier** — coverage % (RGB scan), status (`growing` / `ready` ≥80% /
  `harvesting` / `anaerobic`), damage flag (spectral scan), last-inspected /
  last-harvest timestamps.
- **Robot** — id, status, battery, current rack/tier position, GPS, task
  string, and a timestamped activity log.
- **Queue** — derived from tiers at ≥80% coverage plus any manual entries;
  reorderable.
- **Alert** — severity (`critical`/`warning`/`info`), linked rack/tier/robot.
- **Snapshot** — one RGB + one spectral image per tier visit, with the robot's
  own reading (coverage %, damage detected) and a human confirm/override state.

Camera images are **not** stock photos — they're generated on a `<canvas>`
(`drawRGB` / `drawSpectral` in `data.js`) from the same coverage/damage numbers
shown next to them, seeded so they're stable across reloads. Swap these for
real camera frames once the robot is sending them.

## Next steps (as discussed)

1. ✅ Static HTML/CSS/JS pages with mock data — **this drop**.
2. Port to React (component-per-page, `MOCK` becomes a data-fetching hook).
3. Wire up transport: WiFi backbone as the point-to-point bridge between hub
   points, Meshtastic as the low-power mesh cell under each hub, per the
   rack-group/rack/tier ID scheme already in the spec. Build a small "packet
   simulator" (a second device or browser tab) that can post mock
   sensor/robot packets at the UI and watch it react, before real hardware
   exists.

## Assignments this can be broken into for students

Each of these is a self-contained logic problem with a clear input/output,
independent of the UI above — good for handing to individual students or
small groups.

- **Coverage → harvest decision.** Given a tier's RGB-derived coverage %,
  decide ready/not-ready (the 80% threshold) and produce a queue entry.
- **Vascular-damage response.** Given a spectral scan result, decide whether
  to arm the antibacterial spray, and encode the "spray aligned under the
  multispectral camera at the flagged location" targeting logic.
- **Anaerobic detection & escalation.** Given a stream of pH/DO/ORP readings,
  detect an anaerobic tier/rack and raise the alert used on `reports.html`.
- **Full rack cleaning sequencer.** State machine for the 5× flush → skimmer
  sweep → PAA soak → rinse cycle: what state comes next, what can interrupt
  it, what "done" looks like.
- **Harvest robot path planning.** Given a target rack/tier, compute the
  rack-and-pinion vs. glide-rail travel path and tool sequence (skimmer
  deploy → wedge raise → capture → transfer to wagon coupling).
- **Harvest queue scheduler.** Given multiple ready tiers across racks,
  produce a visit order (this is currently just "manual reorder" in
  `queue.html` — a real scheduler is a great assignment).
- **Meshtastic packet format.** Define the packet schema for a tier/robot
  status update under the rack-group/rack/tier ID scheme, and a parser that
  turns a raw packet into the shape `data.js` already expects.
- **WiFi backbone bridge.** Relay logic between a mesh cell's local hub and
  the central admin system — what gets batched, what's sent immediately
  (e.g. an anaerobic alert should not wait for a batch window).

## Known gaps / open questions for you

- Robot **path-finding method** (rack-and-pinion vs. an alternative) isn't
  down-selected yet in the spec — `racks.html` treats travel as a black box
  for now.
- No auth/login — this is a flat admin view. Say the word if you want a
  login gate before this goes anywhere public.
- Mock data resets on every page reload (nothing persists) since there's no
  backend yet — expected for this stage.
