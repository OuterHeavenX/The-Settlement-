/* Gothic 3D presentation layer.
 *
 * ARCHITECTURE: this is a mirror, not an owner. Every frame it reads the
 * existing simulation (buildings, citizens, territory, placement, clock) and
 * reconciles a Three.js scene to match. It never writes gameplay state, holds
 * no authority, and saves nothing. The Canvas2D renderer remains intact and is
 * used automatically whenever 3D cannot start, so the working game is never at
 * risk from the transformation.
 *
 * CAMERA: a fixed-pitch orthographic camera driven by the same game.camera
 * x/y/zoom the 2D renderer used. No rotation, no orbit - the top-down
 * front-facing read of the village is preserved exactly. Screen-to-world
 * picking is re-derived by raycasting the ground plane so placement stays
 * pixel-accurate under the pitch.
 */
import * as THREE from "../../vendor/three/three.module.min.js";

const T = 64;                       // world units per tile, matching the simulation
const PITCH = 52 * Math.PI / 180;   // elevation angle: high enough to read the grid,
                                    // low enough to still see building fronts

/* Gothic palette. Charcoal, blackened timber, aged stone, slate, iron,
   deep burgundy, muted gold, dark moss - no candy colours. */
const PAL = {
  grassSpring: [0x4a5c39, 0x445434, 0x50633e, 0x3f5132],
  grassSummer: [0x51603a, 0x4a5a36, 0x57683f, 0x455530],
  grassAutumn: [0x5b5533, 0x544e2f, 0x625a38, 0x4d472b],
  grassWinter: [0x5b6167, 0x555b61, 0x626870, 0x4f555a],
  wild: 0x1d241b,
  stone: 0x6a6862, darkStone: 0x46464200, slate: 0x2c3035, timber: 0x33271e,
  timberLight: 0x4a3728, plaster: 0x7d7667, thatch: 0x5e5136, iron: 0x26282a,
  burgundy: 0x4a1f24, gold: 0x8f7336, moss: 0x36402c, window: 0xd9a44e,
  dirt: 0x4a3f30, crop: 0x7d7238
};

export class World3D {
  constructor(game, canvas) {
    this.game = game; this.canvas = canvas;
    this.meshes = new Map();          // building id -> THREE.Object3D
    this.sig = new Map();             // building id -> signature, to detect rebuilds
    this.geoCache = new Map();
    this.matCache = new Map();
    this.ok = false;
  }

  /* ---------------------------------------------------------------- start */
  init() {
    const q = this.game.quality;
    const tier = q ? q.tier : "MEDIUM";
    this.rich = tier === "HIGH" || tier === "ULTRA";

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas, antialias: this.rich, alpha: false,
        powerPreference: "high-performance"
      });
    } catch (e) { console.error("World3D: WebGL unavailable", e); return false; }
    if (!this.renderer.getContext()) return false;

    this.renderer.setPixelRatio(Math.min(q ? q.get("maxDpr") : 2, devicePixelRatio || 1));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = this.rich;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x10130f);
    this.scene.fog = new THREE.Fog(0x10130f, 3400, 5400);

    this.camDist = 4000;   // ortho pull-back; fog and clipping are derived from it
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 12000);
    this.scene.add(this.camera);

    this.buildLights();
    this.buildGround();
    this.buildBorder();
    this.buildPlacement();
    this.buildCitizens();

    this.raycaster = new THREE.Raycaster();
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.resize();
    this.ok = true;
    return true;
  }

  /* --------------------------------------------------------------- lights */
  buildLights() {
    this.hemi = new THREE.HemisphereLight(0x9fb0c4, 0x2b2b24, 1.0);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffe9c4, 1.6);
    this.sun.position.set(-600, 1100, 700);
    if (this.rich) {
      this.sun.castShadow = true;
      this.sun.shadow.mapSize.set(2048, 2048);
      const s = 1400, c = this.sun.shadow.camera;
      c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.near = 1; c.far = 4000;
      this.sun.shadow.bias = -0.0012;
    }
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.fill = new THREE.DirectionalLight(0x6f86a8, 0.35);
    this.fill.position.set(500, 400, -600);
    this.scene.add(this.fill);
  }

  /* --------------------------------------------------------------- ground */
  buildGround() {
    const C = Settlement.Config;
    // One texel per tile. Nearest filtering keeps the grid crisp, and the
    // texture is only rewritten when territory or season actually changes.
    this.groundTex = new THREE.DataTexture(
      new Uint8Array(C.WORLD_W * C.WORLD_H * 4), C.WORLD_W, C.WORLD_H, THREE.RGBAFormat);
    this.groundTex.magFilter = THREE.NearestFilter;
    this.groundTex.minFilter = THREE.LinearMipmapLinearFilter;
    this.groundTex.generateMipmaps = true;
    this.groundTex.colorSpace = THREE.SRGBColorSpace;
    this.groundKey = null;

    const g = new THREE.PlaneGeometry(C.WORLD_W * T, C.WORLD_H * T);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.MeshLambertMaterial({ map: this.groundTex });
    this.ground = new THREE.Mesh(g, m);
    this.ground.position.set(C.WORLD_W * T / 2, 0, C.WORLD_H * T / 2);
    this.ground.receiveShadow = this.rich;
    this.scene.add(this.ground);
  }

  refreshGround() {
    const C = Settlement.Config, ex = this.game.expansion,
      season = this.game.clock ? this.game.clock.seasonIndex : 0,
      key = season + ":" + ex.claimedRects.length;
    if (key === this.groundKey) return;
    this.groundKey = key;
    const pal = [PAL.grassSpring, PAL.grassSummer, PAL.grassAutumn, PAL.grassWinter][season] || PAL.grassSpring;
    const d = this.groundTex.image.data;
    const art = this.game.renderer && this.game.renderer.worldArt;
    for (let y = 0; y < C.WORLD_H; y++) {
      for (let x = 0; x < C.WORLD_W; x++) {
        const h = art ? art.hash(x, y) : ((x * 73 ^ y * 19) % 1000) / 1000;
        let c = pal[Math.floor(h * pal.length) % pal.length];
        let r = (c >> 16) & 255, gg = (c >> 8) & 255, b = c & 255;
        if (!ex.isClaimed(x, y)) { r = r * 0.55 | 0; gg = gg * 0.55 | 0; b = b * 0.58 | 0; }
        const i = ((C.WORLD_H - 1 - y) * C.WORLD_W + x) * 4;
        d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
      }
    }
    this.groundTex.needsUpdate = true;
    this.rebuildBorder();
  }

  /* ------------------------------------------------------- territory line */
  buildBorder() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(0), 3));
    this.border = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xe4cf95 }));
    this.border.position.y = 1.2;
    this.borderKey = null;
    this.scene.add(this.border);
  }
  rebuildBorder() {
    const ex = this.game.expansion, pts = [];
    for (const key of ex.claimedTiles()) {
      const [x, y] = key.split(",").map(Number);
      const add = (x1, z1, x2, z2) => pts.push(x1, 0, z1, x2, 0, z2);
      if (!ex.isClaimed(x, y - 1)) add(x * T, y * T, x * T + T, y * T);
      if (!ex.isClaimed(x, y + 1)) add(x * T, y * T + T, x * T + T, y * T + T);
      if (!ex.isClaimed(x - 1, y)) add(x * T, y * T, x * T, y * T + T);
      if (!ex.isClaimed(x + 1, y)) add(x * T + T, y * T, x * T + T, y * T + T);
    }
    this.border.geometry.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    this.border.geometry = g;
  }

  /* ------------------------------------------------------------ placement */
  buildPlacement() {
    this.placeGroup = new THREE.Group();
    this.scene.add(this.placeGroup);
    this.tileGeo = new THREE.PlaneGeometry(T * 0.94, T * 0.94).rotateX(-Math.PI / 2);
    this.matOK = new THREE.MeshBasicMaterial({ color: 0x8fd06b, transparent: true, opacity: 0.34 });
    this.matBad = new THREE.MeshBasicMaterial({ color: 0xc4463a, transparent: true, opacity: 0.34 });
    this.matClaim = new THREE.MeshBasicMaterial({ color: 0xd9c46b, transparent: true, opacity: 0.16 });
  }
  syncPlacement() {
    const p = this.game.placement, grp = this.placeGroup;
    while (grp.children.length) { const c = grp.children.pop(); grp.remove(c); }
    if (!p || !p.type || !p.hover) return;
    const v = p.validate(p.type, p.hover.x, p.hover.y);
    // the exact grid squares an Archery Tower would claim - square, never radial
    if (p.type === "archery") {
      const lvl = p.moving ? (p.moving.level || 1) : 1;
      const r = this.game.expansion.claimRectFor("archery", p.hover.x, p.hover.y, lvl);
      if (r) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) {
        if (this.game.expansion.isClaimed(x, y)) continue;
        const m = new THREE.Mesh(this.tileGeo, this.matClaim);
        m.position.set(x * T + T / 2, 1.6, y * T + T / 2); grp.add(m);
      }
    }
    for (const c of v.cells || []) {
      const m = new THREE.Mesh(this.tileGeo, c.ok ? this.matOK : this.matBad);
      m.position.set(c.x * T + T / 2, 2.2, c.y * T + T / 2);
      grp.add(m);
    }
  }

  /* ------------------------------------------------------------- citizens */
  buildCitizens() {
    const g = new THREE.CapsuleGeometry(6, 12, 3, 6);
    this.citizenMesh = new THREE.InstancedMesh(g, new THREE.MeshLambertMaterial({ vertexColors: true }), 256);
    this.citizenMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.citizenMesh.count = 0;
    this.citizenMesh.frustumCulled = false;
    this.citizenMesh.castShadow = this.rich;
    this.scene.add(this.citizenMesh);
    this._m4 = new THREE.Matrix4(); this._c = new THREE.Color();
  }
  syncCitizens() {
    const list = this.game.citizens.list, mesh = this.citizenMesh;
    const jobColor = { Archer: 0x46543a, Lumberjack: 0x4a3524, Stonecutter: 0x55565a, Stonemason: 0x5e564a, Miller: 0x4f4a58, Baker: 0x6a4c33, Farmer: 0x47512f };
    let n = 0;
    for (const c of list) {
      if (n >= 256) break;
      if (c.state === "SLEEPING") continue;
      this._m4.makeTranslation(c.x, 14, c.y);
      mesh.setMatrixAt(n, this._m4);
      this._c.setHex(jobColor[c.job] || 0x584a3e);
      mesh.setColorAt(n, this._c);
      n++;
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  /* ------------------------------------------------------------ materials */
  mat(name, hex, opts = {}) {
    const key = name + ":" + hex + ":" + (opts.emissive || 0);
    if (this.matCache.has(key)) return this.matCache.get(key);
    const Ctor = this.rich ? THREE.MeshStandardMaterial : THREE.MeshLambertMaterial;
    const def = { color: hex };
    if (this.rich) { def.roughness = opts.roughness ?? 0.86; def.metalness = opts.metalness ?? 0.04; }
    if (opts.emissive) { def.emissive = new THREE.Color(opts.emissive); def.emissiveIntensity = opts.ei ?? 1; }
    const m = new Ctor(def);
    this.matCache.set(key, m);
    return m;
  }
  box(w, h, d) {
    const key = `b${w}|${h}|${d}`;
    if (!this.geoCache.has(key)) this.geoCache.set(key, new THREE.BoxGeometry(w, h, d));
    return this.geoCache.get(key);
  }
  /* Triangular prism: the gable roof that gives every building its silhouette. */
  prism(w, h, d) {
    const key = `p${w}|${h}|${d}`;
    if (this.geoCache.has(key)) return this.geoCache.get(key);
    const hw = w / 2, hd = d / 2;
    const v = new Float32Array([
      -hw, 0, -hd, hw, 0, -hd, 0, h, -hd,
      -hw, 0, hd, 0, h, hd, hw, 0, hd,
      -hw, 0, -hd, 0, h, -hd, 0, h, hd, -hw, 0, -hd, 0, h, hd, -hw, 0, hd,
      hw, 0, -hd, hw, 0, hd, 0, h, hd, hw, 0, -hd, 0, h, hd, 0, h, -hd,
      -hw, 0, -hd, -hw, 0, hd, hw, 0, hd, -hw, 0, -hd, hw, 0, hd, hw, 0, -hd
    ]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(v, 3));
    g.computeVertexNormals();
    this.geoCache.set(key, g);
    return g;
  }
  cone(r, h, seg) {
    const key = `c${r}|${h}|${seg}`;
    if (!this.geoCache.has(key)) this.geoCache.set(key, new THREE.ConeGeometry(r, h, seg));
    return this.geoCache.get(key);
  }
  part(geo, matr, x, y, z, group) {
    const m = new THREE.Mesh(geo, matr);
    m.position.set(x, y, z);
    m.castShadow = this.rich; m.receiveShadow = this.rich;
    group.add(m);
    return m;
  }

  /* ------------------------------------------------------------ buildings */
  /* Level milestones drive the silhouette, so a building visibly grows at
     1 / 5 / 10 / 15 without needing fifteen separate models. */
  tierOf(level) { const l = level || 1; return l >= 15 ? 4 : l >= 10 ? 3 : l >= 5 ? 2 : 1; }

  buildWonder(b) {
    const g=new THREE.Group(),w=b.w*T,dp=b.h*T,stone=this.mat("s",0x858078),bronze=this.mat("s",0x8b6845,{metalness:.58,roughness:.46}),dark=this.mat("s",0x35333a),wood=this.mat("s",PAL.timberLight),water=this.mat("s",0x3d91a5,{metalness:.12,roughness:.28}),gold=this.mat("s",PAL.gold,{metalness:.55,roughness:.4}),p=Math.max(.03,Math.min(1,b.progress||0));
    this.part(this.box(w*.92,10,dp*.92),stone,0,5,0,g);this.part(this.box(w*.76,12,dp*.76),dark,0,16,0,g);
    if(!b.complete){let rise=210*p;this.part(this.box(w*.48,Math.max(8,rise),dp*.48),stone,0,22+rise/2,0,g);for(let sx of[-1,1])for(let sz of[-1,1]){this.part(this.box(6,230,6),wood,sx*w*.4,120,sz*dp*.4,g);for(let y=45;y<220;y+=42)this.part(this.box(w*.8,4,4),wood,0,y,sz*dp*.4,g)}g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);return g}
    if(b.type==="athena_temple"){let cols=8;for(let side of[-1,1])for(let i=0;i<cols;i++){let x=-w*.34+i*w*.68/(cols-1);this.part(this.box(13,150,13),stone,x,96,side*dp*.28,g);this.part(this.box(19,7,19),gold,x,174,side*dp*.28,g)}this.part(this.box(w*.78,22,dp*.7),stone,0,184,0,g);let roof=this.part(this.cone(w*.52,80,4),dark,0,230,0,g);roof.scale.z=dp/w;this.part(this.box(34,112,28),bronze,0,91,0,g);this.part(this.cone(23,32,8),gold,0,163,0,g)}
    else{this.part(this.box(w*.42,24,dp*.42),stone,0,34,0,g);if(b.type==="poseidon_monument"){this.part(this.box(w*.66,8,dp*.66),water,0,29,0,g);this.part(this.box(52,180,42),bronze,0,130,0,g);this.part(this.cone(35,54,8),bronze,0,247,0,g);this.part(this.box(8,300,8),gold,w*.19,170,0,g);for(let z of[-18,0,18])this.part(this.box(6,52,6),gold,w*.19,334,z,g)}else{this.part(this.box(62,210,48),bronze,0,145,0,g);this.part(this.cone(42,62,8),bronze,0,284,0,g);this.part(this.box(9,360,9),gold,w*.2,205,0,g);this.part(this.box(100,16,76),dark,-w*.18,175,0,g);for(let x of[-w*.3,w*.3])this.part(this.cone(14,28,8),gold,x,50,dp*.3,g)}}
    g.position.set((b.x+b.w/2)*T,0,(b.y+b.h/2)*T);return g;
  }

  buildStructure(b) {
    const g = new THREE.Group();
    const d = Settlement.BuildingDefs[b.type];
    if (!d) return g;
    if (d.wonder) return this.buildWonder(b);
    const w = b.w * T, dp = b.h * T, tier = this.tierOf(b.level);
    const stone = this.mat("s", PAL.stone), dark = this.mat("s", PAL.slate),
      timber = this.mat("s", PAL.timber), light = this.mat("s", PAL.timberLight),
      plaster = this.mat("s", PAL.plaster), iron = this.mat("s", PAL.iron, { metalness: .6, roughness: .5 }),
      thatch = this.mat("s", PAL.thatch), moss = this.mat("s", PAL.moss),
      gold = this.mat("s", PAL.gold, { metalness: .5, roughness: .45 }),
      burg = this.mat("s", PAL.burgundy), dirt = this.mat("s", PAL.dirt),
      glow = this.mat("s", PAL.window, { emissive: PAL.window, ei: .9 });

    if (!b.complete) {                         // scaffolded construction site
      this.part(this.box(w * .9, 6, dp * .9), stone, 0, 3, 0, g);
      const p = Math.max(0, Math.min(1, b.progress || 0));
      this.part(this.box(w * .78, Math.max(4, 44 * p), dp * .78), timber, 0, 3 + Math.max(4, 44 * p) / 2, 0, g);
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        this.part(this.box(4, 56, 4), light, sx * w * .42, 28, sz * dp * .42, g);
      g.position.set((b.x + b.w / 2) * T, 0, (b.y + b.h / 2) * T);
      return g;
    }

    const H = { cottage: 46, mill: 74, bakery: 50, warehouse: 48, mason: 38, quarry: 30, lumber: 36, training: 20, archery: 96, mainHall: 92, farm: 4, wall: 40, gate: 52, road: 1 }[b.type] || 44;
    const h = H * (1 + (tier - 1) * .16);

    switch (b.type) {
      case "road":
        this.part(this.box(T * .96, 2, T * .96), dirt, 0, 1, 0, g); break;
      case "farm": {
        this.part(this.box(w * .96, 3, dp * .96), dirt, 0, 1.5, 0, g);
        const plot = this.game.farms.normalize(b);
        if (plot.crop && plot.state !== "empty") {
          const gr = Math.max(.15, plot.progress || 0);
          const cm = this.mat("s", plot.state === "ready" ? PAL.crop : 0x5d6a34);
          for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++)
            this.part(this.box(7, 6 + 16 * gr, 7), cm, -w * .32 + i * w * .21, 3 + (6 + 16 * gr) / 2, -dp * .32 + j * dp * .21, g);
        }
        break;
      }
      case "wall":
        this.part(this.box(T * .92, h, T * .46), stone, 0, h / 2, 0, g);
        this.part(this.box(T * .96, 6, T * .54), dark, 0, h + 3, 0, g);
        break;
      case "gate":
        for (const s of [-1, 1]) this.part(this.box(T * .3, h, T * .5), stone, s * T * .32, h / 2, 0, g);
        this.part(this.box(T * .5, 10, T * .5), dark, 0, h - 5, 0, g);
        this.part(this.box(T * .46, h * .7, T * .18), timber, 0, h * .35, 0, g);
        break;
      case "archery": {
        this.part(this.box(w * .84, h * .7, dp * .84), stone, 0, h * .35, 0, g);
        this.part(this.box(w * .92, 8, dp * .92), dark, 0, h * .7 + 4, 0, g);
        for (let i = 0; i < 4; i++) {                       // battlements
          const a = i * Math.PI / 2;
          this.part(this.box(10, 12, 10), dark, Math.cos(a) * w * .34, h * .7 + 14, Math.sin(a) * dp * .34, g);
        }
        this.part(this.cone(w * .5, 26 + tier * 5, 4), this.mat("s", PAL.slate), 0, h * .7 + 8 + (26 + tier * 5) / 2, 0, g);
        if (b.workers > 0) {                                 // the archer on watch
          this.part(this.box(9, 18, 9), this.mat("s", 0x46543a), 0, h * .7 + 17, 6, g);
          this.part(this.box(6, 6, 6), this.mat("s", 0xc0a074), 0, h * .7 + 29, 6, g);
        }
        if (tier >= 2) this.part(this.box(4, 26, 12), burg, w * .3, h * .7 + 24, 0, g);
        break;
      }
      case "mainHall": {
        this.part(this.box(w * .9, h * .18, dp * .9), stone, 0, h * .09, 0, g);      // plinth
        this.part(this.box(w * .74, h * .5, dp * .66), tier >= 3 ? stone : plaster, 0, h * .18 + h * .25, 0, g);
        this.part(this.prism(w * .82, h * .3, dp * .72), this.mat("s", PAL.slate), 0, h * .68, 0, g);
        for (const s of [-1, 1]) {                                                    // flanking towers
          this.part(this.box(w * .16, h * .78, dp * .16), stone, s * w * .4, h * .39, -dp * .3, g);
          this.part(this.cone(w * .13, h * .26, 4), this.mat("s", PAL.slate), s * w * .4, h * .78 + h * .13, -dp * .3, g);
          this.part(this.box(5, h * .3, 12), s > 0 ? burg : this.mat("s", 0x2f3d4a), s * w * .28, h * .5, dp * .35, g);
        }
        for (let i = -1; i <= 1; i++) this.part(this.box(11, 20, 4), glow, i * w * .2, h * .34, dp * .34, g);  // arched windows
        this.part(this.box(w * .16, h * .3, 5), timber, 0, h * .3, dp * .34, g);      // great door
        if (tier >= 3) for (const s of [-1, 1]) this.part(this.box(6, 16, 6), gold, s * w * .22, h * .84, 0, g);
        break;
      }
      case "mill": {
        this.part(this.box(w * .5, h * .74, dp * .5), stone, 0, h * .37, 0, g);
        this.part(this.prism(w * .58, h * .26, dp * .58), this.mat("s", PAL.slate), 0, h * .74, 0, g);
        this.part(this.box(4, 4, w * .5), timber, w * .3, h * .55, 0, g);
        for (let i = 0; i < 6; i++) {                          // sail wheel
          const a = i * Math.PI / 3;
          const s = this.part(this.box(3, 34, 6), light, w * .34, h * .55 + Math.cos(a) * 17, Math.sin(a) * 17, g);
          s.rotation.x = a;
        }
        this.part(this.box(10, 16, 4), glow, 0, h * .4, dp * .26, g);
        break;
      }
      case "bakery":
      case "cottage":
      case "warehouse":
      case "mason":
      case "lumber":
      default: {
        const bodyH = h * .58, base = b.type === "cottage" && tier >= 2 ? stone : (tier >= 3 ? stone : timber);
        this.part(this.box(w * .82, h * .16, dp * .82), stone, 0, h * .08, 0, g);          // stone footing
        this.part(this.box(w * .74, bodyH, dp * .7), tier >= 2 ? plaster : base, 0, h * .16 + bodyH / 2, 0, g);
        for (const s of [-1, 1])                                                            // corner timbers
          this.part(this.box(6, bodyH, 6), timber, s * w * .35, h * .16 + bodyH / 2, dp * .33, g);
        this.part(this.prism(w * .86, h * .34, dp * .78),
          this.mat("s", tier >= 2 ? PAL.slate : PAL.thatch), 0, h * .16 + bodyH, 0, g);
        this.part(this.box(w * .16, bodyH * .62, 4), timber, 0, h * .16 + bodyH * .31, dp * .35, g);  // door
        this.part(this.box(10, 12, 4), glow, -w * .22, h * .16 + bodyH * .6, dp * .35, g);
        if (tier >= 2) this.part(this.box(10, 12, 4), glow, w * .22, h * .16 + bodyH * .6, dp * .35, g);
        if (b.type !== "lumber") {                                                          // chimney
          this.part(this.box(11, h * .42, 11), stone, w * .28, h * .16 + bodyH + h * .1, -dp * .2, g);
        }
        if (b.type === "lumber") for (let i = 0; i < 3; i++)
          this.part(this.box(w * .5, 9, 9), light, -w * .1, 6 + i * 9, dp * .3 - i * 3, g);
        if (b.type === "quarry") this.part(this.box(w * .6, 16, dp * .6), this.mat("s", 0x5c5c58), 0, 8, 0, g);
        if (b.type === "warehouse") for (let i = 0; i < 3; i++)
          this.part(this.box(14, 14, 14), light, -w * .22 + i * 16, 7, dp * .36, g);
        if (b.type === "training") this.part(this.box(w * .9, 5, dp * .9), dirt, 0, 2, 0, g);
        if (tier >= 3) this.part(this.box(w * .8, 4, dp * .76), moss, 0, h * .16 + bodyH + 2, 0, g);
        break;
      }
    }
    g.position.set((b.x + b.w / 2) * T, 0, (b.y + b.h / 2) * T);
    return g;
  }

  /* Signature captures everything that changes a building's appearance, so a
     mesh is rebuilt on move, upgrade or completion - and only then. */
  signature(b) {
    return `${b.type}|${b.x},${b.y}|${b.level || 1}|${b.complete ? 1 : 0}|${b.workers || 0}|` +
      (b.type === "farm" ? (this.game.farms.normalize(b).state + Math.round((this.game.farms.normalize(b).progress || 0) * 4)) :
        (b.complete ? "" : Math.round((b.progress || 0) * 6)));
  }

  syncBuildings() {
    const live = new Set();
    for (const b of this.game.buildings.list) {
      live.add(b.id);
      const sig = this.signature(b);
      if (this.sig.get(b.id) === sig) continue;
      const old = this.meshes.get(b.id);
      if (old) this.scene.remove(old);               // shared geo/materials are cached, not disposed
      const mesh = this.buildStructure(b);
      this.scene.add(mesh);
      this.meshes.set(b.id, mesh);
      this.sig.set(b.id, sig);
    }
    for (const [id, mesh] of this.meshes) {          // demolished or moved away: no ghosts
      if (live.has(id)) continue;
      this.scene.remove(mesh);
      this.meshes.delete(id); this.sig.delete(id);
    }
  }

  /* ------------------------------------------------------- camera + light */
  syncCamera() {
    const cam = this.game.camera, r = this.canvas.getBoundingClientRect(),
      W = r.width || innerWidth, H = r.height || innerHeight,
      hw = (W / 2) / cam.zoom, hh = (H / 2) / cam.zoom;
    this.camera.left = -hw; this.camera.right = hw;
    this.camera.top = hh; this.camera.bottom = -hh;
    this.camera.updateProjectionMatrix();
    const dist = this.camDist;
    this.camera.position.set(cam.x, Math.sin(PITCH) * dist, cam.y + Math.cos(PITCH) * dist);
    this.camera.lookAt(cam.x, 0, cam.y);
  }

  syncTime() {
    const hour = (this.game.clock.t / Settlement.Config.DAY_SECONDS) * 24;
    const night = this.game.renderer && this.game.renderer.nightFactor ? this.game.renderer.nightFactor(hour) : (hour >= 20 || hour < 5 ? 1 : 0);
    const day = 1 - night;
    // Night keeps a deliberate moonlight floor: the village must stay readable
    // to play. Gothic means moody, not unlit.
    this.sun.intensity = 0.95 + 1.25 * day;
    this.sun.color.setHex(night > .5 ? 0x9db4dc : (hour > 16 || hour < 8 ? 0xffc98a : 0xffe9c4));
    const ang = Math.max(0.18, Math.sin(Math.PI * Math.max(0, Math.min(1, (hour - 5) / 14))));
    this.sun.position.set(this.game.camera.x - 900 * Math.cos(hour / 24 * Math.PI * 2), 500 + 1100 * ang, this.game.camera.y + 800);
    this.sun.target.position.set(this.game.camera.x, 0, this.game.camera.y);
    this.hemi.intensity = 1.25 + 0.45 * day;
    this.hemi.color.setHex(night > .5 ? 0x5a6c92 : 0x9fb0c4);
    this.fill.intensity = 0.3 + 0.25 * day;
    const bg = new THREE.Color(night > .5 ? 0x191f28 : 0x232a20).lerp(new THREE.Color(0x39412f), day * .5);
    this.scene.background = bg;
    this.scene.fog.color = bg;
    // Fog is measured from the camera, which sits camDist back for the ortho
    // rig - so these are offsets around that distance, not absolute depths.
    this.scene.fog.near = this.camDist - 620 + 300 * day;
    this.scene.fog.far = this.camDist + 1250 + 700 * day;
  }

  /* --------------------------------------------------------------- frame */
  resize() {
    if (!this.renderer) return;
    const q = this.game.quality;
    this.renderer.setPixelRatio(Math.min(q ? q.get("maxDpr") : 2, devicePixelRatio || 1));
    this.renderer.setSize(innerWidth, innerHeight, false);
  }

  render() {
    if (!this.ok) return;
    try {
      this.refreshGround();
      this.syncBuildings();
      this.syncCitizens();
      this.syncPlacement();
      this.syncCamera();
      this.syncTime();
      this.renderer.render(this.scene, this.camera);
    } catch (e) {
      if (!this._errAt || performance.now() - this._errAt > 2000) {
        this._errAt = performance.now();
        console.error("World3D render error (frame skipped):", e);
      }
    }
  }

  /* Exact ground-plane picking under the camera pitch, so placement taps land
     on the tile the player actually pointed at. */
  screenToWorld(sx, sy) {
    const r = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2((sx / (r.width || 1)) * 2 - 1, -((sy / (r.height || 1)) * 2 - 1));
    this.raycaster.setFromCamera(ndc, this.camera);
    const pt = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(this.groundPlane, pt) ? { x: pt.x, y: pt.z } : { x: this.game.camera.x, y: this.game.camera.y };
  }
  worldToScreen(wx, wy) {
    const r = this.canvas.getBoundingClientRect();
    const v = new THREE.Vector3(wx, 0, wy).project(this.camera);
    return { x: (v.x * .5 + .5) * r.width, y: (-v.y * .5 + .5) * r.height };
  }
}
