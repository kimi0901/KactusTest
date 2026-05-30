/* ============================================================
   Formation Lab — 3D renderer + interaction
   ============================================================ */
(function () {
  "use strict";
  const { FORMATIONS, analyze } = window.FL;

  // ---- Pitch dimensions (metres) ----
  const PITCH_L = 105, PITCH_W = 68, HALF_L = PITCH_L / 2, HALF_W = PITCH_W / 2;

  // ---- DOM ----
  const canvas = document.getElementById("scene");
  const homeSel = document.getElementById("homeSel");
  const awaySel = document.getElementById("awaySel");
  const angleBar = document.getElementById("angleBar");
  const playBtn = document.getElementById("playBtn");
  const rotateBtn = document.getElementById("rotateBtn");

  // ---- Renderer / scene / camera ----
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1014);
  scene.fog = new THREE.Fog(0x0a1014, 120, 320);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 50;
  controls.maxDistance = 260;
  controls.maxPolarAngle = Math.PI / 2 - 0.04; // never go under the pitch

  // ---- Lights ----
  scene.add(new THREE.HemisphereLight(0xbfdfff, 0x14323f, 0.85));
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(60, 120, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const d = 90;
  sun.shadow.camera.left = -d; sun.shadow.camera.right = d;
  sun.shadow.camera.top = d; sun.shadow.camera.bottom = -d;
  scene.add(sun);

  // ---- Pitch ----
  buildPitch(scene);

  // ---- Teams ----
  const HOME_COLOR = 0x2f7bff, AWAY_COLOR = 0xff4d4d;
  let homeTeam = [], awayTeam = [];
  let homeKey = "4-2-3-1", awayKey = "4-3-3";

  function clearTeam(arr) { arr.forEach((m) => scene.remove(m.group)); arr.length = 0; }

  function buildTeam(formationKey, color, mirror) {
    const players = FORMATIONS[formationKey].players;
    return players.map((p) => {
      const x = mirror ? -p.x : p.x;
      const z = mirror ? -p.z : p.z;
      const group = makePlayer(color, p.role === "GK");
      group.position.set(x, 0, z);
      scene.add(group);
      return { group, base: { x, z }, role: p.role, phase: Math.random() * Math.PI * 2 };
    });
  }

  function rebuildTeams() {
    clearTeam(homeTeam); clearTeam(awayTeam);
    homeTeam = buildTeam(homeKey, HOME_COLOR, false);
    awayTeam = buildTeam(awayKey, AWAY_COLOR, true);
  }

  // ---- Ball ----
  const ball = (function () {
    const g = new THREE.Group();
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    );
    m.position.y = 0.9; m.castShadow = true;
    g.add(m);
    scene.add(g);
    return g;
  })();

  // ---- Animation state ----
  let playing = true, autoRotate = false;
  let t = 0;

  // A looped "possession" path the ball circulates, so the shape shifts with it.
  function ballTarget(time) {
    const phase = (time * 0.18) % (Math.PI * 2);
    const x = Math.sin(phase) * 22;
    const z = Math.sin(phase * 0.5) * 30; // sweeps both halves
    return { x, z };
  }

  function shiftTeam(team, time, attackDir, bt) {
    // Lateral compactness + slide toward the ball's side; subtle individual bob.
    team.forEach((pl, i) => {
      if (pl.role === "GK") {
        pl.group.position.x = pl.base.x + bt.x * 0.12;
        return;
      }
      const slide = bt.x * 0.22;                       // whole block shifts to ball side
      const press = Math.max(0, bt.z * attackDir) * 0.10; // step up when ball is forward
      const bob = Math.sin(time * 1.6 + pl.phase) * 0.6;
      pl.group.position.x = pl.base.x + slide + Math.cos(time + pl.phase) * 0.4;
      pl.group.position.z = pl.base.z + press * attackDir + bob;
      // face the ball
      const dx = bt.x - pl.group.position.x;
      const dz = bt.z - pl.group.position.z;
      pl.group.rotation.y = Math.atan2(dx, dz);
    });
  }

  function animate() {
    requestAnimationFrame(animate);
    if (playing) t += 0.016;
    const bt = ballTarget(t);
    ball.position.x += (bt.x - ball.position.x) * 0.08;
    ball.position.z += (bt.z - ball.position.z) * 0.08;
    ball.children[0].rotation.x = t * 3;

    shiftTeam(homeTeam, t, +1, bt);  // home attacks +Z
    shiftTeam(awayTeam, t, -1, bt);  // away attacks -Z

    if (autoRotate) { controls.autoRotateSpeed = 1.2; }
    controls.autoRotate = autoRotate;
    controls.update();
    renderer.render(scene, camera);
  }

  // ---- Camera presets ----
  const VIEWS = {
    top:       { pos: [0, 175, 0.1], tgt: [0, 0, 0] },
    broadcast: { pos: [0, 70, 118],  tgt: [0, 0, 0] },
    behind:    { pos: [0, 38, -96],  tgt: [0, 0, 8] },
    corner:    { pos: [78, 60, 86],  tgt: [0, 0, 0] }
  };
  function setView(name) {
    const v = VIEWS[name] || VIEWS.top;
    camera.position.set(v.pos[0], v.pos[1], v.pos[2]);
    controls.target.set(v.tgt[0], v.tgt[1], v.tgt[2]);
    controls.update();
  }

  // ---- Resize ----
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);

  // ---- Analysis panel ----
  function renderAnalysis() {
    const res = analyze(homeKey, awayKey);
    const verdict = document.getElementById("verdict");
    verdict.textContent = res.overall.text;
    verdict.className = res.overall.cls;

    const list = document.getElementById("matchupList");
    list.innerHTML = "";
    res.rows.forEach((r) => {
      const li = document.createElement("li");
      li.innerHTML =
        '<div class="row-head">' +
          '<span class="row-area">' + r.area + '</span>' +
          '<span class="badge ' + r.cls + '">HOME ' + r.verdict + '</span>' +
        '</div>' +
        '<div class="row-head">' +
          '<span class="row-score"><b class="h">青 ' + r.home + '</b> &nbsp;vs&nbsp; <b class="a">赤 ' + r.away + '</b></span>' +
        '</div>' +
        '<div class="row-note">' + r.note + '</div>';
      list.appendChild(li);
    });
  }

  // ---- Wire up UI ----
  Object.keys(FORMATIONS).forEach((k) => {
    [homeSel, awaySel].forEach((sel) => {
      const o = document.createElement("option");
      o.value = k; o.textContent = k;
      sel.appendChild(o.cloneNode(true));
    });
  });
  homeSel.value = homeKey; awaySel.value = awayKey;

  function onChange() {
    homeKey = homeSel.value; awayKey = awaySel.value;
    rebuildTeams();
    renderAnalysis();
  }
  homeSel.addEventListener("change", onChange);
  awaySel.addEventListener("change", onChange);

  angleBar.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    [...angleBar.children].forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    setView(btn.dataset.view);
  });

  playBtn.addEventListener("click", () => {
    playing = !playing;
    playBtn.textContent = playing ? "⏸" : "▶";
    playBtn.classList.toggle("active", playing);
  });
  rotateBtn.addEventListener("click", () => {
    autoRotate = !autoRotate;
    rotateBtn.classList.toggle("active", autoRotate);
  });

  // ---- Boot ----
  rebuildTeams();
  renderAnalysis();
  setView("top");
  resize();
  animate();
  // a couple of late resizes to settle layout/fonts on mobile
  setTimeout(resize, 60);
  setTimeout(resize, 400);

  /* ===================== builders ===================== */

  function makePlayer(color, isGK) {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: isGK ? 0x2ad17a : color, roughness: 0.55, metalness: 0.05
    });
    // body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.0, 2.4, 4, 10), mat);
    body.position.y = 2.6; body.castShadow = true;
    g.add(body);
    // head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xf2c9a0, roughness: 0.7 })
    );
    head.position.y = 4.6; head.castShadow = true;
    g.add(head);
    // small facing nub so orientation reads from above
    const nub = new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.2, 8),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    nub.rotation.x = Math.PI / 2; nub.position.set(0, 2.6, 1.4);
    g.add(nub);
    // shadow-catching base ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.1, 1.5, 20),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05;
    g.add(ring);
    return g;
  }

  function lineMat() { return new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 }); }

  function buildPitch(scene) {
    // grass with mowed stripes
    const stripes = 14, stripeW = PITCH_L / stripes;
    for (let i = 0; i < stripes; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(stripeW, PITCH_W),
        new THREE.MeshStandardMaterial({ color: i % 2 ? 0x1f6b3a : 0x238044, roughness: 1 })
      );
      m.rotation.x = -Math.PI / 2;
      m.position.set(-HALF_L + stripeW / 2 + i * stripeW, 0, 0);
      m.receiveShadow = true;
      scene.add(m);
    }
    // surrounding apron
    const apron = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_L + 24, PITCH_W + 24),
      new THREE.MeshStandardMaterial({ color: 0x14502c, roughness: 1 })
    );
    apron.rotation.x = -Math.PI / 2; apron.position.y = -0.02; apron.receiveShadow = true;
    scene.add(apron);

    // white markings
    const lines = new THREE.Group(); lines.position.y = 0.06;
    const rect = (w, l, cx, cz) => {
      const pts = [
        [cx - w / 2, cz - l / 2], [cx + w / 2, cz - l / 2],
        [cx + w / 2, cz + l / 2], [cx - w / 2, cz + l / 2], [cx - w / 2, cz - l / 2]
      ].map((p) => new THREE.Vector3(p[0], 0, p[1]));
      lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat()));
    };
    rect(PITCH_W, PITCH_L, 0, 0);                 // touchlines
    // halfway line
    lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(
      [new THREE.Vector3(-HALF_W, 0, 0), new THREE.Vector3(HALF_W, 0, 0)]), lineMat()));
    // centre circle
    const circ = [];
    for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; circ.push(new THREE.Vector3(Math.cos(a) * 9.15, 0, Math.sin(a) * 9.15)); }
    lines.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circ), lineMat()));
    // penalty + goal areas + goals, both ends
    [-1, 1].forEach((s) => {
      rect(40.3, 16.5, 0, s * (HALF_L - 8.25));   // penalty area
      rect(18.3, 5.5, 0, s * (HALF_L - 2.75));    // goal area
      // goal
      const goal = new THREE.Mesh(
        new THREE.BoxGeometry(7.3, 2.4, 1.2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
      );
      goal.position.set(0, 1.2, s * (HALF_L + 0.6));
      scene.add(goal);
    });
    scene.add(lines);
  }
})();
