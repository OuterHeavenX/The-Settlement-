/* Happiness.
 *
 * A long-term quality indicator, not a survival meter. It is deliberately
 * forgiving: nothing collapses when it falls, and its bonuses are restrained.
 * Five contributions add to a 0-100 score, each shown to the player with the
 * numbers that produced it - no mystery values.
 *
 * Derived from world state, so nothing new is persisted and no save migration
 * is required. Recomputed a few times a second at most, never per frame.
 */
Settlement.HappinessSystem = class {
  static BANDS = [
    { min: 85, label: "Thriving" },
    { min: 70, label: "Prosperous" },
    { min: 50, label: "Content" },
    { min: 25, label: "Struggling" },
    { min: 0, label: "Troubled" }
  ];

  constructor(game) {
    this.game = game;
    this.score = 50;
    this.parts = [];
    this.timer = 0;
    this.compute();
  }

  /* Cheap enough to run twice a second; never in the render path. */
  update(dt) {
    this.timer += dt;
    if (this.timer < 0.5) return;
    this.timer = 0;
    this.compute();
  }

  compute() {
    const g = this.game,
      pop = Math.max(1, g.citizens.list.length),
      done = g.buildings.list.filter(b => b.complete),
      count = t => done.filter(b => b.type === t).length;

    // Housing - are people housed, and housed well?
    const capacity = g.citizens.capacity(),
      housed = g.citizens.list.filter(c => c.home).length,
      housedRatio = Math.min(1, housed / pop),
      spare = Math.min(1, Math.max(0, capacity - pop) / Math.max(3, pop * 0.35)),
      housing = housedRatio * 17 + spare * 5;

    // Food - reserves relative to the population that eats them
    const food = g.resources.v.food || 0,
      need = Math.max(24, pop * 8),
      foodPts = Math.min(1, food / need) * 16 + Math.min(1, (g.resources.v.bread || 0) / Math.max(6, pop)) * 4;

    // Safety - watchtowers and walls against threats actually present
    const towers = count("archery"), walls = count("wall") + count("gate"),
      threat = g.enemies.list.length,
      safety = Math.min(1, towers / Math.max(1, Math.ceil(pop / 6))) * 9
        + Math.min(1, walls / 12) * 5
        + (threat === 0 ? 2 : 0);

    // Beauty - the largest single lever, so making the village lovely pays
    const beauty = g.beauty ? g.beauty.value() : 0,
      beautyPts = beauty / 100 * 24;

    // Civic quality - the Main Hall and the breadth of services
    const hall = done.find(b => b.type === "mainHall"),
      services = ["warehouse", "mill", "bakery", "mason", "training"].filter(t => count(t)).length,
      civic = (hall ? 6 + Math.min(6, (hall.level || 1) * 0.6) : 0) + services * 1.2;

    const parts = [
      { key: "housing", label: "Housing", value: housing, max: 22, note: `${housed}/${pop} housed, ${capacity} beds` },
      { key: "food", label: "Food", value: foodPts, max: 20, note: `${Math.floor(food)} food in store` },
      { key: "safety", label: "Safety", value: safety, max: 16, note: `${towers} towers, ${walls} defences` },
      { key: "beauty", label: "Beauty", value: beautyPts, max: 24, note: `Beauty ${beauty}/100` },
      { key: "civic", label: "Civic quality", value: civic, max: 18, note: hall ? `Main Hall Lv.${hall.level || 1}, ${services} services` : "No Main Hall" }
    ];
    this.parts = parts.map(p => ({ ...p, value: Math.round(p.value * 10) / 10 }));
    this.score = Math.max(0, Math.min(100, Math.round(parts.reduce((n, p) => n + p.value, 0))));
    return this.score;
  }

  value() { return this.score; }
  breakdown() { return this.parts; }
  label() { return Settlement.HappinessSystem.BANDS.find(b => this.score >= b.min).label; }

  /* Restrained bonuses, centred on 50 so an average village is simply normal.
     Nothing here can run away: every multiplier is clamped. */
  factor(strength) { return 1 + Math.max(-0.4, Math.min(1, (this.score - 50) / 50)) * strength; }
  immigrationFactor() { return Math.max(0.85, Math.min(1.15, this.factor(0.15))); }  // arrival speed
  productionFactor() { return Math.max(0.96, Math.min(1.06, this.factor(0.06))); }
  xpFactor() { return Math.max(0.98, Math.min(1.05, this.factor(0.05))); }
  bonusText() {
    const pc = f => (f >= 1 ? "+" : "") + Math.round((f - 1) * 100) + "%";
    return [
      { label: "Settler arrival speed", value: pc(this.immigrationFactor()) },
      { label: "Passive production", value: pc(this.productionFactor()) },
      { label: "Town XP gained", value: pc(this.xpFactor()) }
    ];
  }
};
