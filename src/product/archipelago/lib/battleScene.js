/**
 * 单岛防御。房子、部署点和来袭的 NPC。
 */

function mesh(THREE, geometry, color, extras = {}) {
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.78, ...extras })
  );
}

/**
 * @param {any} THREE
 * @param {any} scene
 * @param {any} camera
 * @param {HTMLElement} dom
 * @param {{ onPad:(id:number)=>void }} hooks
 */
export function mountBattleScene(THREE, scene, camera, dom, hooks) {
  const disposables = [];
  scene.background = new THREE.Color(0x0c4a62);
  scene.fog = new THREE.Fog(0x0c4a62, 10, 22);
  camera.fov = 40;
  camera.near = 0.1;
  camera.far = 40;
  camera.position.set(0.4, 9.4, 6.4);
  camera.lookAt(0, 0, 0.1);
  camera.updateProjectionMatrix();

  scene.add(new THREE.HemisphereLight(0xd7f1ff, 0x3d6a4e, 0.9));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.15);
  sun.position.set(-3, 7, 4);
  scene.add(sun);

  const sea = mesh(THREE, new THREE.CircleGeometry(7.2, 32), 0x0e7494, { roughness: 0.35, metalness: 0.12 });
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.04;
  scene.add(sea);

  const sand = mesh(THREE, new THREE.CylinderGeometry(2.15, 2.35, 0.28, 8), 0xe4c48a);
  sand.position.y = 0.1;
  scene.add(sand);

  const hill = mesh(THREE, new THREE.ConeGeometry(0.7, 0.8, 6), 0xb7d7b0);
  hill.position.y = 0.55;
  scene.add(hill);

  const dock = mesh(THREE, new THREE.BoxGeometry(0.9, 0.08, 1.1), 0x8d6244);
  dock.position.set(0, 0.16, 1.85);
  scene.add(dock);

  disposables.push(sea.geometry, sea.material, sand.geometry, sand.material, hill.geometry, hill.material, dock.geometry, dock.material);

  const houseMeshes = new Map();
  const padMeshes = new Map();
  const unitMeshes = new Map();
  const npcMeshes = new Map();
  const shotMeshes = [];

  function track(object) {
    scene.add(object);
    disposables.push(object.geometry, object.material);
    return object;
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerUp(event) {
    const rect = dom.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...padMeshes.values()], false);
    const hit = hits[0];
    if (hit && hit.object.userData.padId != null) hooks.onPad(hit.object.userData.padId);
  }
  dom.addEventListener('pointerup', onPointerUp);

  function syncHouses(battle) {
    for (const house of battle.houses) {
      let group = houseMeshes.get(house.id);
      if (!group) {
        group = new THREE.Group();
        const body = track(mesh(THREE, new THREE.BoxGeometry(0.42, 0.36, 0.42), 0xf7f1e6));
        body.position.y = 0.34;
        const roof = track(mesh(THREE, new THREE.ConeGeometry(0.34, 0.28, 4), 0xc4553a));
        roof.position.y = 0.62;
        roof.rotation.y = Math.PI / 4;
        group.add(body, roof);
        group.userData.body = body;
        scene.add(group);
        houseMeshes.set(house.id, group);
      }
      group.position.set(house.x, 0, house.z);
      const ratio = house.maxHp ? house.hp / house.maxHp : 0;
      group.userData.body.material.color.set(ratio > 0.35 ? 0xf7f1e6 : 0xe7b1a4);
      group.visible = house.hp > 0;
      group.position.y = house.hp > 0 ? 0 : -0.2;
    }
  }

  function syncPads(battle, selectedReady) {
    for (const pad of battle.pads) {
      let padMesh = padMeshes.get(pad.id);
      if (!padMesh) {
        padMesh = track(mesh(THREE, new THREE.CylinderGeometry(0.34, 0.34, 0.06, 18), 0xf4efe4));
        padMesh.userData.padId = pad.id;
        padMeshes.set(pad.id, padMesh);
      }
      padMesh.position.set(pad.x, 0.28, pad.z);
      const open = !pad.unitId && selectedReady;
      padMesh.material.color.set(pad.unitId ? 0x8aa0a6 : open ? 0xf0b429 : 0xd9d3c7);
      padMesh.material.emissive = padMesh.material.emissive || new THREE.Color();
      padMesh.material.emissive.set(open ? 0xf0b429 : 0x000000);
      padMesh.material.emissiveIntensity = open ? 0.35 : 0;
    }
  }

  function syncUnits(battle) {
    const live = new Set();
    for (const unit of battle.units) {
      live.add(unit.id);
      let body = unitMeshes.get(unit.id);
      if (!body) {
        const geo =
          unit.kind === 'cannon'
            ? new THREE.CylinderGeometry(0.16, 0.2, 0.28, 8)
            : unit.kind === 'bulwark'
              ? new THREE.BoxGeometry(0.32, 0.38, 0.24)
              : new THREE.ConeGeometry(0.16, 0.42, 5);
        body = track(mesh(THREE, geo, unit.color || 0xe07a2f));
        unitMeshes.set(unit.id, body);
      }
      body.position.set(unit.x, 0.4, unit.z);
    }
    for (const [id, body] of unitMeshes) {
      body.visible = live.has(id);
    }
  }

  function syncNpcs(battle) {
    const live = new Set();
    for (const npc of battle.npcs) {
      live.add(npc.id);
      let body = npcMeshes.get(npc.id);
      if (!body) {
        body = track(mesh(THREE, new THREE.CapsuleGeometry(0.12, 0.18, 3, 6), 0xc23b3b));
        npcMeshes.set(npc.id, body);
      }
      const ratio = npc.maxHp ? npc.hp / npc.maxHp : 1;
      body.material.color.set(ratio > 0.4 ? 0xc23b3b : 0x7a2424);
      body.position.set(npc.x, 0.28, npc.z);
    }
    for (const [id, body] of npcMeshes) body.visible = live.has(id);
  }

  function syncShots(battle) {
    while (shotMeshes.length < battle.shots.length) {
      shotMeshes.push(track(mesh(THREE, new THREE.SphereGeometry(0.06, 8, 6), 0xfff1c2)));
    }
    shotMeshes.forEach((item, index) => {
      const shot = battle.shots[index];
      item.visible = !!shot;
      if (!shot) return;
      const k = 1 - shot.life / 0.16;
      item.position.set(shot.x + (shot.tx - shot.x) * k, 0.45, shot.z + (shot.tz - shot.z) * k);
    });
  }

  function update(state) {
    const battle = state.battle;
    if (!battle) return;
    syncHouses(battle);
    const specReady = (state.cooldowns[state.selectedTroop] || 0) <= 0;
    syncPads(battle, specReady);
    syncUnits(battle);
    syncNpcs(battle);
    syncShots(battle);
    const t = battle.elapsed;
    camera.position.x = Math.sin(t * 0.08) * 0.35;
    camera.lookAt(0, 0, 0);
  }

  let disposed = false;
  function dispose() {
    if (disposed) return;
    disposed = true;
    dom.removeEventListener('pointerup', onPointerUp);
    for (const item of disposables) item.dispose?.();
  }

  return { update, dispose };
}
