# THE SETTLEMENT — v0.1.0

A directly testable, static-first browser prototype for a persistent medieval village builder.

## Launch

### Fastest
Open `index.html` in Safari, Chrome, Edge, or Firefox.

### Recommended local server
From this folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

No npm, Vite, build step, package manager, or external library is required for this prototype.

## Controls

Desktop:
- Drag: pan
- Mouse wheel: zoom
- Click building: inspect
- Build > Place, then click a tile

Mobile/tablet:
- One finger drag: pan
- Pinch: zoom
- Tap building: inspect
- Build > Place, then tap a tile

## First Playable Loop

The tutorial walks through:
1. Cottage
2. Farm Plot
3. Plant / grow / harvest Wheat
4. Lumber Camp + automatic worker assignment
5. Warehouse
6. Second Cottage
7. Archery Tower
8. Palisade Walls + Gate
9. Secure the first frontier expansion

Bandit scouts appear contextually in the persistent settlement view after defensive infrastructure exists. There are no waves or battle maps.

## Architecture

The build intentionally uses modular classic browser scripts so `index.html` remains directly testable before Vite migration. Systems live under `src/` and data definitions under `src/data/`.

The map is logically 256×256 tiles. The camera and chunk manager only reason about nearby chunks; the renderer only draws visible tiles.

`BuildingDefs`, `CropDefs`, `EnemyDefs`, quest data, resource data, and XP thresholds are registry/data driven.

## Saves

The prototype uses localStorage for maximum static-file compatibility.

The save payload includes:
- `saveVersion`
- resources
- XP / town level
- clock / season
- buildings / construction
- citizens / jobs
- farms
- quests
- expansion state
- stats

Schema versioning is present from v1. `IndexedDBStore.js` and `MigrationManager.js` are explicit extension points for the production migration. The next persistence milestone should move large world/chunk data to IndexedDB without changing gameplay-facing save semantics.

Autosave occurs approximately every 12 seconds and on page hide.

Offline progression is calculated mathematically and capped at 8 hours. It does not tick every offline second.

## Adding a Building

Edit `src/data/buildings.js` and add a new definition:

```js
myBuilding:{
  id:"myBuilding",
  name:"My Building",
  category:"Production",
  icon:"🔧",
  footprint:[2,2],
  cost:{wood:100,stone:40,gold:90},
  buildTime:12,
  workers:1,
  production:{wood:5},
  xpReward:50
}
```

The build menu and placement system read from the registry.

## Adding a Crop

Edit `src/data/crops.js`:

```js
carrot:{
  id:"carrot",
  name:"Carrot",
  growDays:.18,
  yield:14,
  foodValue:2,
  icon:"🥕",
  plantCost:{food:1}
}
```

The farm system is structured to consume crop definitions rather than hardcoded building behavior.

## Adding an Enemy

Edit `src/data/enemies.js`:

```js
wolf:{
  id:"wolf",
  name:"Wolf",
  hp:35,
  speed:48,
  damage:3,
  icon:"🐺",
  reward:{gold:8,xp:8}
}
```

Then add its contextual spawn rule to `EnemyDirector`.

## Rebalancing Progression

Primary tuning files:
- `src/data/buildings.js` — costs, build times, requirements, production
- `src/data/crops.js` — growth, yield, value
- `src/data/progression.js` — XP thresholds
- `src/data/quests.js` — tutorial objectives and rewards
- `src/simulation/Clock.js` — day length
- `src/core/Config.js` — world and offline caps

The long-term target is deliberately *not* implemented by absurd timers. Future phases should gate territory through population, supply chains, security, research, logistics, prestige, permits, trade, and specialized labor.

## Renderer

v0.1.0 uses a highly portable Canvas 2D procedural art renderer so the ZIP is self-contained and opens without network access. The rendering system is isolated behind `src/rendering/Renderer.js`, allowing a clean PixiJS 8 renderer swap during the production graphics milestone without rewriting simulation systems.

PixiJS 8 is the intended production renderer after the static-first systems test.

## Debug

Settings > Toggle Debug HUD shows:
- FPS
- building count
- citizen count
- enemy count
- active chunk count
- save status

Army contains a debug enemy spawn button.

## Vite

Do not convert this build yet. Once this vertical slice is approved, the existing `src/` domains can be converted to ES modules and Vite without changing the data model.

<!-- deployment refresh: living-world-stabilization-mason-showcase -->
<!-- deployment refresh: bright-night-mason-batching-citizen-animation -->
