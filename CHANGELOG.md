# Changelog

## 0.1.0 — First Playable Homestead Vertical Slice

### World
- Added 256×256 logical world.
- Added 16×16 chunk activity tracking.
- Added locked wilderness and starter claimed territory.
- Added first frontier expansion preview and claim logic.
- Added smooth pan/zoom camera with mobile pinch support.

### Construction
- Added data-driven building registry.
- Added placement ghost and valid/invalid feedback.
- Added resource validation.
- Added construction sites with progress.
- Added completion XP and notifications.
- Added Cottage, Farm Plot, Lumber Camp, Warehouse, Archery Tower, Palisade Wall, Gate, Training Yard, Dirt Path.

### Economy & Farming
- Added Gold, Wood, Stone, Food, Wheat, Clay.
- Added Wheat planting, growth, readiness and harvesting.
- Added production-per-day hook.
- Added worker-dependent Lumber Camp production.
- Added Warehouse storage capacity model.

### Citizens
- Added lightweight named citizen entities.
- Added visible walking.
- Added occupations and workplace assignment.
- Added population capacity from housing.
- Added automatic early citizen arrivals as housing grows.

### Defense
- Added contextual Bandit Scout spawning.
- Added no-wave persistent-world combat.
- Added tower range, targeting and firing.
- Added 25% unstaffed / 100% staffed Archery Tower effectiveness.
- Added wall blocking behavior for hostile movement.

### Progression
- Added Town XP and levels.
- Added seven-step first-session quest/tutorial.
- Added Secure → Enclose → Develop frontier milestone.

### Persistence
- Added saveVersion: 1.
- Added autosave.
- Added reload restoration.
- Added offline mathematical production capped at eight hours.
- Added reset-save tool.

### UI / UX
- Added animated welcome screen.
- Added START TO ENTER.
- Added medieval resource HUD.
- Added quest tracker.
- Added bottom navigation.
- Added build categories and cards.
- Added building inspector.
- Added farm actions and worker assignment.
- Added mobile safe-area-aware layout.
- Added notification toasts and floating world feedback.

### Debug
- Added toggleable debug HUD.
- Added contextual enemy spawn debug control.
