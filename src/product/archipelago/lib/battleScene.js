/**
 * 单岛画面。兵按人数站在岛上，敌船只朝码头这一个入口开。
 */

import { DOCK, LANDING } from './battle.js';

function mesh(THREE, geometry, color, extras = {}) {
  return new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.78, ...extras })
  );
}

function unitIdOf(object) {
  let node = object;
  while (node) {
    if (node.userData?.unitId) return node.userData.unitId;
    node = node.parent;
  }
  return null;
}

/**
 * @param {any} THREE
 * @param {any} scene
 * @param {any} camera
 * @param {HTMLElement} dom
 * @param {{ onUnit:(id:string)=>void, onGround:(x:number, z:number)=>void }} hooks
 */
export function mountBattleScene(THREE, scene, camera, dom, hooks) {
  const disposables = [];
  scene.background = new THREE.Color(0x0c4a62);
  scene.fog = new THREE.Fog(0x0c4a62, 12, 26);
  camera.fov = 40;
  camera.near = 0.1;
  camera.far = 48;
  camera.position.set(0.15, 6.6, 9.1);
  camera.lookAt(0, 0.35, 0.15);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  scene.add(new THREE.HemisphereLight(0xd7f1ff, 0x3d6a4e, 0.95));
  const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
  sun.position.set(-4, 8, 5);
  scene.add(sun);

  const sea = mesh(THREE, new THREE.CircleGeometry(8, 36), 0x0e7494, { roughness: 0.32, metalness: 0.14 });
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -0.04;
  scene.add(sea);

  const sand = mesh(THREE, new THREE.CylinderGeometry(2.05, 2.28, 0.28, 8), 0xe4c48a);
  sand.position.y = 0.1;
  scene.add(sand);

  const hill = mesh(THREE, new THREE.ConeGeometry(0.62, 0.7, 6), 0xb7d7b0);
  hill.position.set(-0.15, 0.5, -0.85);
  scene.add(hill);

  const pier = mesh(THREE, new THREE.BoxGeometry(0.72, 0.1, 1.7), 0x8d6244);
  pier.position.set(0, 0.14, 2.2);
  scene.add(pier);

  const gateColor = 0xf0b429;
  const leftPost = mesh(THREE, new THREE.BoxGeometry(0.08, 0.72, 0.08), gateColor);
  leftPost.position.set(-0.42, 0.52, LANDING.z + 0.08);
  const rightPost = mesh(THREE, new THREE.BoxGeometry(0.08, 0.72, 0.08), gateColor);
  rightPost.position.set(0.42, 0.52, LANDING.z + 0.08);
  const bar = mesh(THREE, new THREE.BoxGeometry(0.96, 0.08, 0.08), 0xc23b3b);
  bar.position.set(0, 0.86, LANDING.z + 0.08);
  scene.add(leftPost, rightPost, bar);

  const landingPad = mesh(THREE, new THREE.CircleGeometry(0.34, 16), 0xf0b429, {
    emissive: 0xf0b429,
    emissiveIntensity: 0.35,
  });
  landingPad.rotation.x = -Math.PI / 2;
  landingPad.position.set(LANDING.x, 0.26, LANDING.z);
  scene.add(landingPad);

  disposables.push(
    sea.geometry,
    sea.material,
    sand.geometry,
    sand.material,
    hill.geometry,
    hill.material,
    pier.geometry,
    pier.material,
    leftPost.geometry,
    leftPost.material,
    rightPost.geometry,
    rightPost.material,
    bar.geometry,
    bar.material,
    landingPad.geometry,
    landingPad.material
  );

  const houseMeshes = new Map();
  const unitMeshes = new Map();
  const npcMeshes = new Map();
  const boatMeshes = new Map();
  const shotMeshes = [];

  function track(object) {
    disposables.push(object.geometry, object.material);
    return object;
  }

  const ring = track(
    mesh(THREE, new THREE.RingGeometry(0.26, 0.36, 20), 0xf7f3ea, {
      emissive: 0xf0b429,
      emissiveIntensity: 0.7,
      side: THREE.DoubleSide,
    })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.27;
  ring.visible = false;
  scene.add(ring);

  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.24);
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hitPoint = new THREE.Vector3();

  function onPointerUp(event) {
    const rect = dom.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const bodies = [...unitMeshes.values()];
    const hit = raycaster.intersectObjects(bodies, true)[0];
    const unitId = hit ? unitIdOf(hit.object) : null;
    if (unitId) {
      hooks.onUnit(unitId);
      return;
    }
    if (raycaster.ray.intersectPlane(ground, hitPoint)) hooks.onGround(hitPoint.x, hitPoint.z);
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
    }
  }

  function tag(object, unitId) {
    object.userData.unitId = unitId;
    return object;
  }

  function makeFighter(unit) {
    const group = new THREE.Group();
    group.userData.unitId = unit.id;
    const color = unit.color || 0xff8a3d;
    const legL = tag(track(mesh(THREE, new THREE.BoxGeometry(0.07, 0.24, 0.07), color)), unit.id);
    legL.position.set(-0.06, 0.36, 0);
    const legR = tag(track(mesh(THREE, new THREE.BoxGeometry(0.07, 0.24, 0.07), color)), unit.id);
    legR.position.set(0.06, 0.36, 0);
    const torso = tag(track(mesh(THREE, new THREE.BoxGeometry(0.24, 0.3, 0.14), color, { emissive: color, emissiveIntensity: 0.18 })), unit.id);
    torso.position.y = 0.62;
    const head = tag(track(mesh(THREE, new THREE.SphereGeometry(0.11, 12, 10), 0xf6d2b3)), unit.id);
    head.position.y = 0.9;
    group.add(legL, legR, torso, head);
    if (unit.kind === 'bulwark') {
      const shield = tag(track(mesh(THREE, new THREE.BoxGeometry(0.05, 0.34, 0.24), 0xd5e8f4)), unit.id);
      shield.position.set(0.2, 0.62, 0.04);
      group.add(shield);
    } else if (unit.kind === 'cannon') {
      const barrel = tag(track(mesh(THREE, new THREE.BoxGeometry(0.1, 0.1, 0.36), 0x1c2836)), unit.id);
      barrel.position.set(0, 0.5, 0.22);
      group.add(barrel);
    } else {
      const bow = tag(track(mesh(THREE, new THREE.TorusGeometry(0.12, 0.018, 6, 12, Math.PI), 0xf7f1e4)), unit.id);
      bow.position.set(0.18, 0.66, 0);
      bow.rotation.y = Math.PI / 2;
      group.add(bow);
    }
    scene.add(group);
    return group;
  }

  function syncUnits(battle, selectedId, time) {
    const live = new Set();
    battle.units.forEach((unit, index) => {
      live.add(unit.id);
      let body = unitMeshes.get(unit.id);
      if (!body) {
        body = makeFighter(unit);
        unitMeshes.set(unit.id, body);
      }
      body.visible = true;
      body.position.set(unit.x, Math.sin(time * 2.2 + index) * 0.015, unit.z);
      const selected = unit.id === selectedId;
      body.scale.setScalar(selected ? 1.08 : 1);
    });
    for (const [id, body] of unitMeshes) body.visible = live.has(id);
    const selected = battle.units.find((unit) => unit.id === selectedId);
    ring.visible = !!selected;
    if (selected) ring.position.set(selected.x, 0.27, selected.z);
  }

  function syncNpcs(battle) {
    const live = new Set();
    for (const npc of battle.npcs) {
      live.add(npc.id);
      let person = npcMeshes.get(npc.id);
      if (!person) {
        person = new THREE.Group();
        const body = track(
          mesh(THREE, new THREE.CapsuleGeometry(0.1, 0.22, 4, 8), 0xd64545, {
            emissive: 0x8a1f1f,
            emissiveIntensity: 0.25,
          })
        );
        body.position.y = 0.34;
        const head = track(mesh(THREE, new THREE.SphereGeometry(0.09, 10, 8), 0xf0c2b0));
        head.position.y = 0.58;
        person.add(body, head);
        person.userData.body = body;
        scene.add(person);
        npcMeshes.set(npc.id, person);
      }
      const ratio = npc.maxHp ? npc.hp / npc.maxHp : 1;
      person.userData.body.material.color.set(ratio > 0.4 ? 0xd64545 : 0x7a2424);
      person.position.set(npc.x, 0.24, npc.z);
      person.visible = true;
    }
    for (const [id, person] of npcMeshes) person.visible = live.has(id);
  }

  function makeBoat() {
    const group = new THREE.Group();
    const hull = track(mesh(THREE, new THREE.CylinderGeometry(0.1, 0.2, 0.95, 6), 0x6b3a2a));
    hull.rotation.x = Math.PI / 2;
    hull.position.y = 0.1;
    const stripe = track(mesh(THREE, new THREE.BoxGeometry(0.16, 0.04, 0.7), 0xc23b3b));
    stripe.position.y = 0.18;
    const mast = track(mesh(THREE, new THREE.BoxGeometry(0.04, 0.55, 0.04), 0xf4efe4));
    mast.position.set(0, 0.42, -0.02);
    const sail = track(mesh(THREE, new THREE.BoxGeometry(0.02, 0.36, 0.32), 0xf7f4ee, { emissive: 0xf7f4ee, emissiveIntensity: 0.15 }));
    sail.position.set(0.02, 0.48, 0.02);
    const rider = track(mesh(THREE, new THREE.CapsuleGeometry(0.07, 0.12, 3, 6), 0xd64545));
    rider.position.set(0, 0.32, 0.12);
    group.add(hull, stripe, mast, sail, rider);
    scene.add(group);
    return group;
  }

  function syncBoats(battle) {
    const live = new Set();
    for (const boat of battle.boats) {
      live.add(boat.id);
      let body = boatMeshes.get(boat.id);
      if (!body) {
        body = makeBoat();
        boatMeshes.set(boat.id, body);
      }
      body.visible = true;
      body.position.set(boat.x, 0, boat.z);
      body.rotation.y = Math.atan2(DOCK.x - boat.x, DOCK.z - boat.z);
    }
    for (const [id, body] of boatMeshes) body.visible = live.has(id);
  }

  function syncShots(battle) {
    while (shotMeshes.length < battle.shots.length) {
      const shot = track(mesh(THREE, new THREE.SphereGeometry(0.06, 8, 6), 0xfff1c2));
      scene.add(shot);
      shotMeshes.push(shot);
    }
    shotMeshes.forEach((item, index) => {
      const shot = battle.shots[index];
      item.visible = !!shot;
      if (!shot) return;
      const k = 1 - shot.life / 0.16;
      item.position.set(shot.x + (shot.tx - shot.x) * k, 0.5, shot.z + (shot.tz - shot.z) * k);
    });
  }

  let time = 0;
  function update(state, dt = 0) {
    const battle = state.battle;
    if (!battle) return;
    time += dt;
    syncHouses(battle);
    syncUnits(battle, state.selectedUnitId, time);
    syncNpcs(battle);
    syncBoats(battle);
    syncShots(battle);
    landingPad.material.emissiveIntensity = battle.status === 'fight' ? 0.55 + Math.sin(time * 5) * 0.25 : 0.28;
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
