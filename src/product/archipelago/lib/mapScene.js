/**
 * 海洋地图。岛屿颜色跟防御状态走，航线是岛与岛之间的水路。
 */

const STATUS_COLOR = {
  held: 0x2f9e6b,
  open: 0xe0b56a,
  lost: 0x8d3b3b,
  locked: 0x60788a,
};

function lerpColor(THREE, from, to, t) {
  const a = new THREE.Color(from);
  const b = new THREE.Color(to);
  return a.lerp(b, Math.max(0, Math.min(1, t)));
}

function makeIsland(THREE, def) {
  const group = new THREE.Group();
  group.position.set(def.x, 0, def.z);
  group.userData.id = def.id;
  const scale = def.id === 'home' ? 1.15 : 0.82 + def.houses * 0.08;
  group.scale.setScalar(scale);

  const shore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.78, 1.02, 0.32, 7),
    new THREE.MeshStandardMaterial({ color: STATUS_COLOR.open, flatShading: true, roughness: 0.92 })
  );
  shore.position.y = 0.16;
  shore.userData.id = def.id;

  const hill = new THREE.Mesh(
    new THREE.ConeGeometry(0.46, def.id === 'home' ? 0.85 : 0.62, 6),
    new THREE.MeshStandardMaterial({ color: 0xc4d7c8, flatShading: true, roughness: 1 })
  );
  hill.position.y = 0.55;
  hill.userData.id = def.id;

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.03, 6, 28),
    new THREE.MeshStandardMaterial({
      color: 0xf2d48a,
      emissive: 0xf2d48a,
      emissiveIntensity: 0.25,
      roughness: 0.45,
      transparent: true,
      opacity: 0.45,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  ring.visible = false;

  group.add(shore, hill, ring);
  group.userData.shore = shore;
  group.userData.hill = hill;
  group.userData.ring = ring;
  return group;
}

function addRoute(THREE, scene, a, b, disposables) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  const mid = new THREE.Vector3((a.x + b.x) / 2 + (-dz / len) * 0.42, 0.05, (a.z + b.z) / 2 + (dx / len) * 0.42);
  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(a.x, 0.04, a.z),
    mid,
    new THREE.Vector3(b.x, 0.04, b.z)
  );
  const geo = new THREE.TubeGeometry(curve, 20, 0.03, 5, false);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xd5f3f6,
    emissive: 0x9fd7e4,
    emissiveIntensity: 0.28,
    roughness: 0.35,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.decor = true;
  scene.add(mesh);
  disposables.push(geo, mat);
}

/**
 * 往 ThreeView 已经建好的 scene / camera 里装海图。
 * @param {any} THREE
 * @param {any} scene
 * @param {any} camera
 * @param {HTMLElement} dom
 * @param {{ onPick:(id:string)=>void }} hooks
 */
export function mountMapScene(THREE, scene, camera, dom, hooks) {
  const disposables = [];
  scene.background = new THREE.Color(0x08344a);
  scene.fog = new THREE.Fog(0x08344a, 14, 30);
  camera.fov = 42;
  camera.near = 0.1;
  camera.far = 80;
  camera.updateProjectionMatrix();

  let yaw = 0.35;
  let pitch = 0.72;

  const hemi = new THREE.HemisphereLight(0xc5e8ff, 0x1a4a44, 0.85);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.25);
  sun.position.set(-4, 8, 3);
  scene.add(hemi, sun);

  const waterGeo = new THREE.PlaneGeometry(42, 42, 48, 48);
  waterGeo.rotateX(-Math.PI / 2);
  const base = Float32Array.from(waterGeo.attributes.position.array);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0e7494,
    roughness: 0.28,
    metalness: 0.18,
    flatShading: true,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.userData.decor = true;
  scene.add(water);
  disposables.push(waterGeo, waterMat);

  const islands = new Map();
  const defs = [];

  function remember(def, mesh) {
    islands.set(def.id, mesh);
    defs.push(def);
    scene.add(mesh);
  }

  const seen = new Set();

  function place(def) {
    const mesh = makeIsland(THREE, def);
    remember(def, mesh);
    disposables.push(mesh.userData.shore.geometry, mesh.userData.shore.material);
    disposables.push(mesh.userData.hill.geometry, mesh.userData.hill.material);
    disposables.push(mesh.userData.ring.geometry, mesh.userData.ring.material);
  }

  const ship = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.1, 0.62),
    new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.6 })
  );
  hull.position.y = 0.22;
  const sail = new THREE.Mesh(
    new THREE.ConeGeometry(0.16, 0.38, 4),
    new THREE.MeshStandardMaterial({ color: 0xe86a17, flatShading: true })
  );
  sail.position.y = 0.46;
  ship.add(hull, sail);
  scene.add(ship);
  disposables.push(hull.geometry, hull.material, sail.geometry, sail.material);

  for (let i = 0; i < 7; i += 1) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.12 + (i % 3) * 0.04, 0),
      new THREE.MeshStandardMaterial({ color: 0x6e8794, flatShading: true, roughness: 1 })
    );
    const angle = i * 1.3;
    rock.position.set(Math.cos(angle) * (6 + (i % 4)), 0.08, Math.sin(angle) * (5.5 + (i % 3)));
    rock.userData.decor = true;
    scene.add(rock);
    disposables.push(rock.geometry, rock.material);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let dragging = false;
  let moved = false;
  let lastX = 0;
  let lastY = 0;

  function onPointerDown(event) {
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
  }
  function onPointerMove(event) {
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    lastX = event.clientX;
    lastY = event.clientY;
    yaw -= dx * 0.005;
    pitch = Math.max(0.45, Math.min(1.15, pitch + dy * 0.003));
  }
  function onPointerUp(event) {
    dragging = false;
    if (moved) return;
    const rect = dom.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    const hit = hits.find((item) => item.object.userData?.id && !item.object.userData.decor);
    if (hit) hooks.onPick(hit.object.userData.id);
  }

  dom.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  let built = false;

  function ensureIslands(state) {
    if (built) return;
    built = true;
    for (const island of Object.values(state.islands)) {
      place(island);
      for (const otherId of island.links) {
        const key = [island.id, otherId].sort().join(':');
        if (seen.has(key)) continue;
        seen.add(key);
        addRoute(THREE, scene, island, state.islands[otherId], disposables);
      }
    }
  }

  function update(state, dt, t) {
    ensureIslands(state);
    const pos = waterGeo.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = base[i * 3];
      const z = base[i * 3 + 2];
      pos.array[i * 3 + 1] = Math.sin(x * 0.42 + t * 1.25) * 0.07 + Math.cos(z * 0.36 + t * 0.9) * 0.05;
    }
    pos.needsUpdate = true;

    const radius = 13.5;
    camera.position.set(Math.sin(yaw) * radius, 7.2 + pitch * 4.2, Math.cos(yaw) * radius);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld(true);

    for (const [id, mesh] of islands) {
      const island = state.islands[id];
      if (!island) continue;
      const color =
        island.id === 'home'
          ? new THREE.Color(0x1f8f8a)
          : island.status === 'open'
            ? lerpColor(THREE, STATUS_COLOR.open, 0xc45132, island.pressure / 100)
            : new THREE.Color(STATUS_COLOR[island.status] || STATUS_COLOR.locked);
      mesh.userData.shore.material.color.copy(color);
      const held = island.status === 'held' || island.id === 'home';
      mesh.userData.hill.material.color.set(held ? 0x8fd0a4 : 0xd5ddd8);
      const open = island.status === 'open';
      const selected = island.id === state.selectedId;
      mesh.userData.ring.visible = open || selected;
      const pulse = open ? 0.55 + Math.sin(t * 3.2 + island.row) * 0.4 : 0.35;
      mesh.userData.ring.material.opacity = selected || open ? pulse : 0.35;
      mesh.userData.ring.material.emissiveIntensity = open ? 0.85 : 0.25;
      mesh.userData.ring.material.color.set(open ? 0xf0b429 : 0xf7f3ea);
    }

    const at = state.islands[state.playerAt] || state.islands.home;
    const bob = Math.sin(t * 2.2) * 0.03;
    ship.position.x += (at.x - ship.position.x) * Math.min(1, dt * 1.6);
    ship.position.z += (at.z - ship.position.z) * Math.min(1, dt * 1.6);
    ship.position.y = 0.12 + bob;
    return { camera, islands: state.islands };
  }

  function project(id, host) {
    const mesh = islands.get(id);
    if (!mesh || !host) return null;
    const vector = mesh.position.clone();
    vector.y += 1.15;
    vector.project(camera);
    if (vector.z > 1) return null;
    return {
      x: (vector.x * 0.5 + 0.5) * host.clientWidth,
      y: (-vector.y * 0.5 + 0.5) * host.clientHeight,
    };
  }

  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    dom.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    for (const item of disposables) item.dispose?.();
  }

  return { update, project, dispose };
}
