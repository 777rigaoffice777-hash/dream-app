/* build 36 */
// ===== 3D-мастерская и вкладка «Продукты» =====
// Объект собирается из фигур. Каждую фигуру можно двигать пальцем, красить,
// менять размер и поворачивать. Готовый объект сохраняется в «Продукты».
// 3D рисует библиотека Three.js (лежит в папке vendor).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// ---------- Фигуры, из которых можно строить ----------
// Чтобы добавить свою фигуру — допиши строку: group (в какой ряд), name и make (как она строится).
// flat: true — чёткие рёбра у граней (для угловатых фигур)
const P = Math.PI;
const SHAPES3D = {
  // ----- Круглые -----
  sphere:    { group: 'round', name: 'Шар',              make: () => new THREE.SphereGeometry(0.6, 40, 20) },
  hemisphere:{ group: 'round', name: 'Полушар',          make: () => lathe(arcPoints(0.6, 0, P / 2), true) },
  egg:       { group: 'round', name: 'Яйцо',             make: () => lathe(eggPoints()) },
  cylinder:  { group: 'round', name: 'Цилиндр',          make: () => new THREE.CylinderGeometry(0.5, 0.5, 1, 40) },
  halfcyl:   { group: 'round', name: 'Полуцилиндр',      make: () => extrude(halfDisc(), 1, false) },
  cone:      { group: 'round', name: 'Конус',            make: () => new THREE.ConeGeometry(0.6, 1.2, 40) },
  frustum:   { group: 'round', name: 'Усечённый конус',  make: () => new THREE.CylinderGeometry(0.3, 0.6, 1, 40) },
  capsule:   { group: 'round', name: 'Капсула',          make: () => new THREE.CapsuleGeometry(0.35, 0.6, 10, 24) },
  disc:      { group: 'round', name: 'Диск',             make: () => new THREE.CylinderGeometry(0.7, 0.7, 0.15, 48) },
  pipe:      { group: 'round', name: 'Труба',            make: () => extrude(ringShape(0.5, 0.36), 1, false).rotateX(P / 2) },
  torus:     { group: 'round', name: 'Бублик',           make: () => new THREE.TorusGeometry(0.45, 0.2, 20, 48) },
  ring:      { group: 'round', name: 'Кольцо',           make: () => new THREE.TorusGeometry(0.5, 0.07, 12, 64) },
  knot:      { group: 'round', name: 'Узел',             make: () => new THREE.TorusKnotGeometry(0.4, 0.13, 128, 16) },
  spring:    { group: 'round', name: 'Пружина',          make: () => new THREE.TubeGeometry(new Helix(), 240, 0.06, 10) },
  // ----- Угловатые -----
  cube:      { group: 'angular', name: 'Куб',            flat: true, make: () => new THREE.BoxGeometry(1, 1, 1) },
  brick:     { group: 'angular', name: 'Брусок',         flat: true, make: () => new THREE.BoxGeometry(1.6, 0.6, 0.8) },
  tile:      { group: 'angular', name: 'Плитка',         flat: true, make: () => new THREE.BoxGeometry(1.2, 0.12, 1.2) },
  wedge:     { group: 'angular', name: 'Клин',           flat: true, make: () => extrude(polygon([[0, 0], [1.2, 0], [0, 0.8]]), 0.8, false) },
  prism3:    { group: 'angular', name: 'Треуг. призма',  flat: true, make: () => new THREE.CylinderGeometry(0.6, 0.6, 1, 3) },
  prism5:    { group: 'angular', name: 'Пятиуг. призма', flat: true, make: () => new THREE.CylinderGeometry(0.55, 0.55, 1, 5) },
  prism6:    { group: 'angular', name: 'Шестиуг. призма',flat: true, make: () => new THREE.CylinderGeometry(0.55, 0.55, 1, 6) },
  prism8:    { group: 'angular', name: 'Восьмиуг. призма',flat: true, make: () => new THREE.CylinderGeometry(0.55, 0.55, 1, 8) },
  pyramid3:  { group: 'angular', name: 'Треуг. пирамида',flat: true, make: () => new THREE.ConeGeometry(0.7, 1, 3) },
  pyramid:   { group: 'angular', name: 'Пирамида',       flat: true, make: () => new THREE.ConeGeometry(0.75, 1, 4).rotateY(P / 4) },
  pyramid6:  { group: 'angular', name: 'Шестиуг. пирамида', flat: true, make: () => new THREE.ConeGeometry(0.65, 1, 6) },
  tetra:     { group: 'angular', name: 'Тетраэдр',       flat: true, make: () => new THREE.TetrahedronGeometry(0.75) },
  octa:      { group: 'angular', name: 'Октаэдр',        flat: true, make: () => new THREE.OctahedronGeometry(0.65) },
  dodeca:    { group: 'angular', name: 'Додекаэдр',      flat: true, make: () => new THREE.DodecahedronGeometry(0.6) },
  icosa:     { group: 'angular', name: 'Икосаэдр',       flat: true, make: () => new THREE.IcosahedronGeometry(0.62) },
  parallelogram: { group: 'angular', name: 'Параллелограмм', flat: true, make: () => extrude(polygon([[0, 0], [1, 0], [1.4, 0.7], [0.4, 0.7]]), 0.4, false) },
  // ----- Фигурные -----
  star:      { group: 'fancy', name: 'Звезда',           make: () => extrude(starShape()) },
  heart:     { group: 'fancy', name: 'Сердце',           make: () => extrude(heartShape()).rotateZ(P) },
  moon:      { group: 'fancy', name: 'Полумесяц',        make: () => extrude(moonShape()) },
  cross:     { group: 'fancy', name: 'Крест',            make: () => extrude(polygon([[-.15,-.55],[.15,-.55],[.15,-.15],[.55,-.15],[.55,.15],[.15,.15],[.15,.55],[-.15,.55],[-.15,.15],[-.55,.15],[-.55,-.15],[-.15,-.15]])) },
  arrow:     { group: 'fancy', name: 'Стрелка',          make: () => extrude(polygon([[-.6,-.15],[.1,-.15],[.1,-.38],[.6,0],[.1,.38],[.1,.15],[-.6,.15]])) },
  drop:      { group: 'fancy', name: 'Капля',            make: () => lathe(dropPoints()) },
  trapezoid: { group: 'fancy', name: 'Трапеция',         make: () => extrude(polygon([[-.6, -.35], [.6, -.35], [.3, .35], [-.3, .35]])) },
};
const SHAPE_GROUPS = { round: 'Круглые', angular: 'Угловатые', fancy: 'Фигурные' };
const PALETTE = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#2ec4b6', '#1982c4', '#6a4c93',
                 '#ff6fb5', '#8d5524', '#ffffff', '#8a8a8a', '#222222'];
const FINISH = { matte: { roughness: 0.9, metalness: 0 }, gloss: { roughness: 0.25, metalness: 0 }, metal: { roughness: 0.25, metalness: 0.9 } };
const MAX_OBJECTS = 40;

function extrude(shape, depth = 0.3, bevel = true) {
  const g = new THREE.ExtrudeGeometry(shape, bevel
    ? { depth, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 3, curveSegments: 24 }
    : { depth, bevelEnabled: false, curveSegments: 40 });
  g.center();
  return g;
}
// Тело вращения: points — контур половинки (x — расстояние от оси, y — высота)
function lathe(points) {
  const g = new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(Math.max(x, 0.0001), y)), 48);
  g.center();
  return g;
}
const polygon = pts => new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
function arcPoints(r, from, to, n = 24) {
  // дуга + точки на оси, чтобы фигура была закрыта снизу
  const pts = [[0, 0], [r, 0]];
  for (let i = 0; i <= n; i++) { const a = from + (to - from) * i / n; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
  return pts;
}
function eggPoints(n = 32) {
  return [...Array(n + 1)].map((_, i) => {
    const t = P * i / n;
    return [0.45 * Math.sin(t) * (1 - 0.12 * Math.cos(t)), -0.62 * Math.cos(t)];
  });
}
function dropPoints(n = 40) {
  return [...Array(n + 1)].map((_, i) => {
    const t = P * i / n; // снизу круглая, сверху острая
    return [0.5 * Math.sin(t) * Math.pow((1 + Math.cos(t)) / 2, 0.9), -0.55 * Math.cos(t)];
  });
}
function halfDisc() {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.55, 0, P, false);
  s.lineTo(0.55, 0);
  return s;
}
function ringShape(outer, inner) {
  const s = new THREE.Shape(); s.absarc(0, 0, outer, 0, P * 2, false);
  const h = new THREE.Path(); h.absarc(0, 0, inner, 0, P * 2, true);
  s.holes.push(h);
  return s;
}
function moonShape() {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.6, 0.958, P * 2 - 0.958, false);   // большая дуга
  s.absarc(0.25, 0, 0.5, -1.38, 1.38, true);           // вырез
  return s;
}
class Helix extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const a = t * P * 2 * 4; // 4 витка
    return target.set(Math.cos(a) * 0.4, t * 1.2 - 0.6, Math.sin(a) * 0.4);
  }
}
function starShape() {
  const s = new THREE.Shape();
  for (let k = 0; k < 10; k++) {
    const a = Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.26 : 0.62;
    k ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}
function heartShape() {
  const s = new THREE.Shape(), k = 0.055;
  const p = (x, y) => [x * k, y * k];
  s.moveTo(...p(5, 5));
  s.bezierCurveTo(...p(5, 5), ...p(4, 0), ...p(0, 0));
  s.bezierCurveTo(...p(-6, 0), ...p(-6, 7), ...p(-6, 7));
  s.bezierCurveTo(...p(-6, 11), ...p(-3, 15.4), ...p(5, 19));
  s.bezierCurveTo(...p(12, 15.4), ...p(16, 11), ...p(16, 7));
  s.bezierCurveTo(...p(16, 7), ...p(16, 0), ...p(10, 0));
  s.bezierCurveTo(...p(7, 0), ...p(5, 5), ...p(5, 5));
  return s;
}

// ---------- Сцена: небо, пол, свет ----------
function makeStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dfe9ff');
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.MeshStandardMaterial({ color: '#c8d6f0', roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new THREE.GridHelper(12, 24, 0x9fb3dd, 0xb7c7e8);
  grid.position.y = 0.002;
  scene.add(grid);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899bb, 0.8));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(4, 8, 5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  scene.add(sun);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(5.5, 5, 8.5);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.6, 0);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 25;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // не заглядывать под пол
  controls.autoRotateSpeed = 3;

  new ResizeObserver(() => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }).observe(container);

  return { renderer, scene, camera, controls };
}

// Создаёт 3D-фигуру по описанию (тип, цвет, размер, поворот, место)
function buildMesh(data) {
  const def = SHAPES3D[data.type] || SHAPES3D.cube;
  const mesh = new THREE.Mesh(def.make(), new THREE.MeshStandardMaterial({ flatShading: !!def.flat, side: THREE.DoubleSide }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.data = data;
  applyData(mesh);
  return mesh;
}
function applyData(mesh) {
  const d = mesh.userData.data, rad = THREE.MathUtils.degToRad;
  mesh.material.color.set(d.color);
  Object.assign(mesh.material, FINISH[d.finish] || FINISH.gloss);
  mesh.scale.set(d.s, d.s * d.sy, d.s);
  mesh.rotation.set(rad(d.rx), rad(d.ry), rad(d.rz));
  mesh.position.set(d.x, 0, d.z);
  mesh.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(mesh);
  mesh.position.y = d.lift - box.min.y; // ставим на пол (или на высоту «Поднять»)
}
function disposeMesh(mesh) { mesh.geometry.dispose(); mesh.material.dispose(); }

// Наводит камеру так, чтобы все фигуры были видны целиком
function fitCamera(st, list) {
  if (!list.length) return;
  const box = new THREE.Box3();
  list.forEach(o => box.expandByObject(o));
  const center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() / 2, 1);
  const fov = THREE.MathUtils.degToRad(st.camera.fov);
  const dist = radius / Math.sin(Math.min(fov, fov * st.camera.aspect) / 2) * 1.1;
  const dir = st.camera.position.clone().sub(st.controls.target).normalize();
  st.controls.target.copy(center);
  st.camera.position.copy(center).add(dir.multiplyScalar(Math.min(Math.max(dist, st.controls.minDistance), st.controls.maxDistance)));
  st.controls.update();
}

// ===================== 3D-мастерская =====================
const studio = document.getElementById('studio');
const view = document.getElementById('stView');
const stage = makeStage(view);
const panel = document.getElementById('stPanel');
const hint = document.getElementById('stHint');
let objects = [], selected = null, editingId = null;

// Кольцо под выбранной фигурой
const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 48), new THREE.MeshBasicMaterial({ color: '#ffb703', side: THREE.DoubleSide }));
ring.rotation.x = -Math.PI / 2;
ring.visible = false;
stage.scene.add(ring);
// Пунктирная линия от поднятой фигуры до пола — видно, на какой она высоте
const heightLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 1, 0)]),
  new THREE.LineDashedMaterial({ color: '#ffb703', dashSize: 0.12, gapSize: 0.08 }));
heightLine.computeLineDistances();
heightLine.visible = false;
stage.scene.add(heightLine);

function updateRing() {
  ring.visible = !!selected;
  heightLine.visible = false;
  liftBox.hidden = !selected;
  if (!selected) return;
  const box = new THREE.Box3().setFromObject(selected), size = box.getSize(new THREE.Vector3());
  const r = Math.max(size.x, size.z) * 0.6 + 0.1;
  ring.scale.set(r, r, r);
  ring.position.set(selected.position.x, 0.01, selected.position.z);
  const lift = selected.userData.data.lift;
  if (lift > 0.05) {
    heightLine.visible = true;
    heightLine.position.set(selected.position.x, 0, selected.position.z);
    heightLine.scale.set(1, lift, 1);
  }
  liftLabel.textContent = lift.toFixed(1);
}

// ---------- Поднять и опустить: кнопки ⬆ ⬇ справа (можно держать) ----------
const MAX_LIFT = 6, LIFT_STEP = 0.05;
const liftBox = document.getElementById('stLift');
const liftLabel = document.getElementById('stLiftVal');
function moveUpDown(delta) {
  if (!selected) return;
  const d = selected.userData.data;
  const lift = Math.min(MAX_LIFT, Math.max(0, +(d.lift + delta).toFixed(2)));
  if (lift !== d.lift) change({ lift });
}
function holdButton(btn, action) {
  let timer = null;
  const stop = () => { clearInterval(timer); timer = null; };
  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    action();
    stop();
    timer = setInterval(action, 50); // держишь — едет дальше
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
}
holdButton(document.getElementById('stUp'), () => moveUpDown(LIFT_STEP));
holdButton(document.getElementById('stDown'), () => moveUpDown(-LIFT_STEP));
document.getElementById('stFloor').onclick = () => { if (selected) { change({ lift: 0 }); sfx('pop'); } };

// Кнопки фигур сверху, по группам. Картинки на кнопках рисуются в 3D при запуске
const shapesBar = document.getElementById('stShapes');
const iconRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
iconRenderer.setSize(96, 96, false);
const iconScene = new THREE.Scene();
iconScene.add(new THREE.HemisphereLight(0xffffff, 0x667799, 1.4));
const iconSun = new THREE.DirectionalLight(0xffffff, 2);
iconSun.position.set(2, 3, 4);
iconScene.add(iconSun);
const iconCam = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
let iconColor = 0;
function shapeIcon(type) {
  const def = SHAPES3D[type];
  const mesh = new THREE.Mesh(def.make(), new THREE.MeshStandardMaterial({
    color: PALETTE[iconColor++ % 7], roughness: 0.4, flatShading: !!def.flat, side: THREE.DoubleSide }));
  mesh.geometry.computeBoundingSphere();
  const r = mesh.geometry.boundingSphere.radius, c = mesh.geometry.boundingSphere.center;
  iconCam.position.set(c.x + r * 1.6, c.y + r * 1.3, c.z + r * 2.2);
  iconCam.lookAt(c);
  iconScene.add(mesh);
  iconRenderer.render(iconScene, iconCam);
  iconScene.remove(mesh); disposeMesh(mesh);
  return iconRenderer.domElement.toDataURL('image/png');
}
Object.entries(SHAPE_GROUPS).forEach(([group, title]) => {
  const label = document.createElement('div');
  label.className = 'stGroup';
  label.textContent = title;
  shapesBar.appendChild(label);
  Object.entries(SHAPES3D).filter(([, s]) => s.group === group).forEach(([type, s]) => {
    const b = document.createElement('button');
    b.innerHTML = `<img alt=""><b></b>`;
    b.querySelector('img').src = shapeIcon(type);
    b.querySelector('b').textContent = s.name;
    b.onclick = () => addObject(type);
    shapesBar.appendChild(b);
  });
});
iconRenderer.dispose();
iconRenderer.forceContextLoss(); // освобождаем видеокарту — картинки уже нарисованы

function addObject(type) {
  if (objects.length >= MAX_OBJECTS) return showToast('Больше ' + MAX_OBJECTS + ' фигур нельзя');
  const data = {
    type, color: PALETTE[Math.floor(Math.random() * 9)], finish: 'gloss',
    x: +(Math.random() * 2 - 1).toFixed(2), z: +(Math.random() * 2 - 1).toFixed(2),
    lift: 0, s: 1, sy: 1, rx: 0, ry: 0, rz: 0,
  };
  const mesh = buildMesh(data);
  stage.scene.add(mesh);
  objects.push(mesh);
  select(mesh);
  sfx('pop');
  saveDraft();
}

function select(mesh) {
  if (selected) selected.material.emissive.set(0x000000);
  selected = mesh;
  if (mesh) mesh.material.emissive.set(0x1a1a2e);
  panel.hidden = !mesh;
  updateRing();
  syncPanel();
  hint.textContent = objects.length
    ? (mesh ? 'Тащи фигуру пальцем, чтобы подвинуть' : 'Нажми на фигуру, чтобы её выбрать. Крути сцену пальцем')
    : 'Добавь фигуру сверху 👆';
}

// ---------- Панель настроек выбранной фигуры ----------
const colorsBox = document.getElementById('stColors');
PALETTE.forEach(c => {
  const b = document.createElement('button');
  b.style.background = c;
  b.dataset.color = c;
  b.onclick = () => change({ color: c });
  colorsBox.appendChild(b);
});
panel.querySelectorAll('[data-finish]').forEach(b => b.onclick = () => change({ finish: b.dataset.finish }));
panel.querySelectorAll('input[type=range]').forEach(inp => inp.oninput = () => change({ [inp.dataset.k]: +inp.value }));
panel.querySelectorAll('.stTabs [data-tab]').forEach(b => b.onclick = () => {
  panel.querySelectorAll('.stTabs [data-tab]').forEach(x => x.classList.toggle('active', x === b));
  panel.querySelectorAll('.stTab').forEach(t => t.hidden = t.dataset.tab !== b.dataset.tab);
});

function change(patch) {
  if (!selected) return;
  Object.assign(selected.userData.data, patch);
  applyData(selected);
  updateRing();
  syncPanel();
  saveDraft();
}
function syncPanel() {
  if (!selected) return;
  const d = selected.userData.data;
  colorsBox.querySelectorAll('button').forEach(b => b.classList.toggle('sel', b.dataset.color === d.color));
  panel.querySelectorAll('[data-finish]').forEach(b => b.classList.toggle('sel', b.dataset.finish === d.finish));
  panel.querySelectorAll('input[type=range]').forEach(inp => inp.value = d[inp.dataset.k]);
}

document.getElementById('stCopy').onclick = () => {
  if (!selected || objects.length >= MAX_OBJECTS) return;
  const data = { ...selected.userData.data, x: Math.min(5, selected.userData.data.x + 0.9) };
  const mesh = buildMesh(data);
  stage.scene.add(mesh); objects.push(mesh);
  select(mesh); sfx('pop'); saveDraft();
};
document.getElementById('stDel').onclick = () => {
  if (!selected) return;
  stage.scene.remove(selected); disposeMesh(selected);
  objects = objects.filter(o => o !== selected);
  selected = null; select(null); saveDraft();
};
document.getElementById('stAuto').onclick = e => {
  stage.controls.autoRotate = !stage.controls.autoRotate;
  e.currentTarget.classList.toggle('on', stage.controls.autoRotate);
};
document.getElementById('stFit').onclick = () => fitCamera(stage, objects);
// Убрать всё: очищает сцену, но если ты правил продукт — сохранишь поверх него же
document.getElementById('stClear').onclick = () => {
  if (!objects.length) return showToast('На сцене и так пусто 🙂');
  if (!confirm('Убрать все фигуры?')) return;
  loadObjects([]);
  saveDraft();
  sfx('wrong');
  showToast('🧹 Все фигуры убраны');
};
document.getElementById('stNew').onclick = () => {
  if (objects.length && !confirm('Начать новый объект? Несохранённое пропадёт.')) return;
  loadObjects([]); editingId = null; saveDraft();
};

// ---------- Пальцем: выбрать и двигать фигуру ----------
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let drag = null, tapStart = null;
function setPointer(e) {
  const r = stage.renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, stage.camera);
}
function floorPoint() { const p = new THREE.Vector3(); return raycaster.ray.intersectPlane(floor, p) ? p : null; }

// capture — чтобы успеть раньше, чем камера начнёт крутиться
view.addEventListener('pointerdown', e => {
  if (e.target !== stage.renderer.domElement || drag) return;
  setPointer(e);
  const hit = raycaster.intersectObjects(objects)[0];
  if (hit) {
    stage.controls.enabled = false;
    select(hit.object);
    const p = floorPoint() || hit.point;
    drag = { id: e.pointerId, dx: hit.object.userData.data.x - p.x, dz: hit.object.userData.data.z - p.z, moved: false };
  } else {
    tapStart = { x: e.clientX, y: e.clientY };
  }
}, { capture: true });
window.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  setPointer(e);
  const p = floorPoint();
  if (!p) return;
  const d = selected.userData.data;
  let x = p.x + drag.dx, z = p.z + drag.dz;
  const len = Math.hypot(x, z);
  if (len > 5.5) { x *= 5.5 / len; z *= 5.5 / len; } // не уезжать с пола
  d.x = +x.toFixed(2); d.z = +z.toFixed(2);
  applyData(selected); updateRing();
  drag.moved = true;
});
window.addEventListener('pointerup', e => {
  if (drag && e.pointerId === drag.id) {
    drag = null;
    stage.controls.enabled = true;
    saveDraft();
  } else if (tapStart && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) < 6) {
    select(null); // просто нажали на пустое место — снять выбор
  }
  tapStart = null;
});

// ---------- Черновик: работа не пропадёт, даже если закрыть приложение ----------
function saveDraft() {
  localStorage.setItem('studioDraft', JSON.stringify({ editingId, objects: objects.map(o => o.userData.data) }));
}
function loadObjects(list) {
  objects.forEach(o => { stage.scene.remove(o); disposeMesh(o); });
  objects = list.map(d => { const m = buildMesh({ ...d }); stage.scene.add(m); return m; });
  selected = null;
  select(null);
}
try {
  const draft = JSON.parse(localStorage.getItem('studioDraft') || 'null');
  if (draft) { loadObjects(draft.objects || []); editingId = draft.editingId || null; }
} catch (e) { /* испорченный черновик — начинаем с чистого листа */ }
select(null);

// ---------- Сохранение в «Продукты» ----------
const getProducts = () => JSON.parse(localStorage.getItem('products3d') || '[]');
const setProducts = list => localStorage.setItem('products3d', JSON.stringify(list));

function makeThumb() {
  const keep = selected;
  select(null); // без жёлтого кольца на картинке
  // Для картинки наводим камеру на весь объект, потом возвращаем как было
  const camPos = stage.camera.position.clone(), target = stage.controls.target.clone();
  fitCamera(stage, objects);
  stage.renderer.render(stage.scene, stage.camera);
  const src = stage.renderer.domElement, c = document.createElement('canvas');
  const w = 240, h = 180, srcH = src.width * h / w; // вырезаем середину кадра 4:3
  c.width = w; c.height = h;
  c.getContext('2d').drawImage(src, 0, Math.max(0, (src.height - srcH) / 2), src.width, Math.min(src.height, srcH), 0, 0, w, h);
  stage.camera.position.copy(camPos); stage.controls.target.copy(target); stage.controls.update();
  if (keep) select(keep);
  return c.toDataURL('image/jpeg', 0.8);
}

const modal = document.getElementById('stModal');
const nameInput = document.getElementById('stName');
document.getElementById('stSave').onclick = () => {
  if (!objects.length) return showToast('Сначала добавь фигуры 🙂');
  const old = getProducts().find(p => p.id === editingId);
  nameInput.value = old ? old.name : 'Мой объект ' + (getProducts().length + 1);
  modal.hidden = false;
  nameInput.focus(); nameInput.select();
};
document.getElementById('stModalCancel').onclick = () => { modal.hidden = true; };
document.getElementById('stModalOk').onclick = () => {
  const name = nameInput.value.trim() || 'Без названия';
  const item = { id: editingId || Date.now().toString(36), name, updated: Date.now(),
                 thumb: makeThumb(), objects: objects.map(o => ({ ...o.userData.data })) };
  const list = getProducts().filter(p => p.id !== item.id);
  list.unshift(item);
  try { setProducts(list); } catch (e) { modal.hidden = true; return showToast('Память переполнена — удали старые продукты'); }
  editingId = item.id;
  saveDraft();
  modal.hidden = true;
  showToast('📦 «' + name + '» сохранён в Продукты');
  sfx('win');
  renderProducts();
};

// ===================== Вкладка «Продукты» =====================
const products = document.getElementById('products');
const grid = document.getElementById('prGrid');
const viewer = document.getElementById('prViewer');
let viewStage = null, viewObjects = [], viewingId = null;

function renderProducts() {
  const list = getProducts();
  document.getElementById('prCount').textContent = list.length ? `(${list.length})` : '';
  grid.innerHTML = list.length ? '' : '<p class="prEmpty">Пока пусто.<br>Создай что-нибудь во вкладке 🧊 3D и нажми 💾</p>';
  list.forEach(p => {
    const card = document.createElement('button');
    card.className = 'prCard';
    card.innerHTML = `<img alt=""><span></span>`;
    card.querySelector('img').src = p.thumb;
    card.querySelector('span').textContent = p.name;
    card.onclick = () => openViewer(p.id);
    grid.appendChild(card);
  });
}

function openViewer(id) {
  const p = getProducts().find(x => x.id === id);
  if (!p) return;
  viewingId = id;
  viewer.hidden = false;
  document.getElementById('prName').textContent = p.name;
  if (!viewStage) {
    viewStage = makeStage(document.getElementById('prView'));
    viewStage.controls.autoRotate = true;
  }
  viewObjects.forEach(o => { viewStage.scene.remove(o); disposeMesh(o); });
  viewObjects = p.objects.map(d => { const m = buildMesh({ ...d }); viewStage.scene.add(m); return m; });
  // Размер окна просмотра становится известен чуть позже — тогда и наводим камеру
  requestAnimationFrame(() => requestAnimationFrame(() => fitCamera(viewStage, viewObjects)));
}
document.getElementById('prClose').onclick = () => { viewer.hidden = true; viewingId = null; };
document.getElementById('prDelete').onclick = () => {
  const p = getProducts().find(x => x.id === viewingId);
  if (!p || !confirm('Удалить «' + p.name + '»?')) return;
  setProducts(getProducts().filter(x => x.id !== viewingId));
  if (editingId === viewingId) { editingId = null; saveDraft(); }
  viewer.hidden = true; viewingId = null;
  renderProducts();
};
document.getElementById('prEdit').onclick = () => {
  const p = getProducts().find(x => x.id === viewingId);
  if (!p) return;
  if (objects.length && editingId !== p.id && !confirm('В 3D-мастерской есть несохранённая работа. Заменить её?')) return;
  loadObjects(p.objects);
  editingId = p.id;
  saveDraft();
  viewer.hidden = true; viewingId = null;
  document.querySelector('nav [data-screen=studio]').click();
  requestAnimationFrame(() => requestAnimationFrame(() => fitCamera(stage, objects)));
};
document.querySelector('nav [data-screen=products]').addEventListener('click', renderProducts);
renderProducts();

// ---------- Рисуем только то, что сейчас видно ----------
(function loop() {
  requestAnimationFrame(loop);
  if (document.hidden) return;
  if (studio.classList.contains('active')) {
    stage.controls.update();
    stage.renderer.render(stage.scene, stage.camera);
  }
  if (viewStage && !viewer.hidden && products.classList.contains('active')) {
    viewStage.controls.update();
    viewStage.renderer.render(viewStage.scene, viewStage.camera);
  }
})();

// Для проверки из консоли
window.studio3d = { addObject, objects: () => objects, select, change, stage, getProducts, openViewer };
