/* Beauty.
 *
 * How pleasant, organised and impressive the settlement looks. It is a reward
 * for building a lovely village, not an optimisation puzzle - every source is
 * additive and nothing subtracts.
 *
 * Derived entirely from structures already in the world, so nothing new is
 * persisted and no save migration is needed. Recomputed on the events that can
 * change it rather than every frame.
 */
Settlement.BeautySystem = class {
  constructor(game) {
    this.game = game;
    this.score = 0;
    this.parts = [];
    this.dirty = true;
    for (const e of ["building:complete", "building:removed", "building:moved", "building:upgraded", "territory:claimed", "building:created"])
      game.bus.on(e, () => this.dirty = true);
  }

  /* Each entry: what it is, how much it gives, and why - so the player can
     read exactly where their Beauty comes from. */
  compute() {
    const g = this.game, done = g.buildings.list.filter(b => b.complete);
    const count = t => done.filter(b => b.type === t).length;
    const lvl = t => done.filter(b => b.type === t).reduce((n, b) => n + (b.level || 1), 0);

    const hall = done.find(b => b.type === "mainHall");
    const hallPts = hall ? Math.min(30, (hall.level || 1) * 2.4) : 0;

    const cottagePts = Math.min(20, done.filter(b => b.type === "cottage")
      .reduce((n, b) => n + Math.max(0, (b.level || 1) - 1) * 0.9, 0));

    const roadPts = Math.min(14, count("road") * 0.55);
    const wallPts = Math.min(10, (count("wall") + count("gate") * 2) * 0.3);

    const civicTypes = ["warehouse", "mill", "bakery", "mason", "training", "quarry", "lumber"];
    const civicPts = Math.min(14, civicTypes.reduce((n, t) => n + (count(t) ? 1.6 : 0), 0)
      + civicTypes.reduce((n, t) => n + Math.max(0, lvl(t) - count(t)) * 0.25, 0));

    const farmPts = Math.min(12, count("farm") * 1.4);

    const parts = [
      { key: "hall", label: "Main Hall", value: hallPts, note: hall ? `Level ${hall.level || 1}` : "Not yet built" },
      { key: "homes", label: "Fine homes", value: cottagePts, note: `${count("cottage")} cottages` },
      { key: "roads", label: "Paved paths", value: roadPts, note: `${count("road")} path tiles` },
      { key: "walls", label: "Fortification", value: wallPts, note: `${count("wall")} walls, ${count("gate")} gates` },
      { key: "civic", label: "Workshops & services", value: civicPts, note: `${civicTypes.filter(t => count(t)).length} kinds` },
      { key: "farms", label: "Tended fields", value: farmPts, note: `${count("farm")} plots` }
    ];
    this.parts = parts.map(p => ({ ...p, value: Math.round(p.value * 10) / 10 }));
    this.score = Math.max(0, Math.min(100, Math.round(parts.reduce((n, p) => n + p.value, 0))));
    this.dirty = false;
    return this.score;
  }

  value() { if (this.dirty) this.compute(); return this.score; }
  breakdown() { if (this.dirty) this.compute(); return this.parts; }
  label() {
    const v = this.value();
    return v >= 85 ? "Resplendent" : v >= 70 ? "Handsome" : v >= 50 ? "Comely" : v >= 25 ? "Plain" : "Bleak";
  }
};
