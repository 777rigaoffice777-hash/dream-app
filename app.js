// ===== Переключение экранов =====
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.screen).classList.add('active');
    if (btn.dataset.screen === 'draw') resizeCanvas();
    if (btn.dataset.screen === 'colors') startColorsRound();
    else if ('speechSynthesis' in window) speechSynthesis.cancel();
  });
});

// ===== Игровой движок для режимов «Точки» и «Цвета» =====
// Точки появляются в случайных местах и через время пропадают.

// Скорость от x1 до x10 (общая для обоих режимов).
// Чем больше — тем чаще появляются точки и тем быстрее исчезают.
let speed = Number(localStorage.getItem('dotSpeed')) || 1;
const dotEveryMs = () => 1100 - (speed - 1) * 100;  // x1 = 1100 мс, x10 = 200 мс
const dotLifeMs  = () => 2200 - (speed - 1) * 190;  // x1 = 2200 мс, x10 = 490 мс

function setSpeed(s) {
  speed = Math.min(10, Math.max(1, s));
  document.querySelectorAll('.speedLabel').forEach(l => l.textContent = 'x' + speed);
  localStorage.setItem('dotSpeed', speed);
}
document.querySelectorAll('.speedDown').forEach(b => b.onclick = () => setSpeed(speed - 1));
document.querySelectorAll('.speedUp').forEach(b => b.onclick = () => setSpeed(speed + 1));
setSpeed(speed);

// Создаёт игру на экране с id. pickColor() — какого цвета новая точка,
// onTap(color) — что делать при нажатии (вернуть true, если засчитать).
function makeGame(id, { pickColor, onTap }) {
  const area = document.getElementById(id);
  const counter = area.querySelector('.counter');
  const game = { area, hits: 0 };

  game.spawn = () => {
    const life = dotLifeMs();
    const color = pickColor();
    const w = area.clientWidth, h = area.clientHeight;
    const dot = document.createElement('button');
    dot.className = 'dot';
    dot.style.left = (30 + Math.random() * (w - 60)) + 'px';
    dot.style.top = (130 + Math.random() * (h - 160)) + 'px'; // не залезать под кнопки сверху
    dot.style.setProperty('--life', life + 'ms');
    dot.style.setProperty('--c', color.css);
    dot.addEventListener('pointerdown', e => {
      e.preventDefault();
      dot.classList.add('hit');
      setTimeout(() => dot.remove(), 200);
      if (onTap(color)) {
        game.hits++;
        counter.textContent = game.hits;
        if (navigator.vibrate) navigator.vibrate(20);
      }
    });
    area.appendChild(dot);
    setTimeout(() => dot.remove(), life);
  };

  game.reset = () => { game.hits = 0; counter.textContent = 0; };
  area.querySelector('.reset').onclick = () => game.reset();
  return game;
}

// ===== Режим 1: Точки — только красные, любое нажатие +1 =====
const RED = { name: 'красный', css: '#ff1a1a' };
const dotsGame = makeGame('dots', { pickColor: () => RED, onTap: () => true });

// ===== Режим 2: Реакция по цветам =====
// Сначала точки просто сыплются. Через 3 секунды игра говорит: «Только чёрный!»
// Нажимать можно только этот цвет. Каждые 10 секунд цвет меняется.
const COLORS = [
  { name: 'жёлтый',  css: '#ffd60a', text: '#1b1440' },
  { name: 'розовый', css: '#ff6fb5', text: '#1b1440' },
  { name: 'зелёный', css: '#2ecc40', text: '#fff' },
  { name: 'красный', css: '#ff1a1a', text: '#fff' },
  { name: 'чёрный',  css: '#111111', text: '#fff' },
  { name: 'синий',   css: '#1e5bff', text: '#fff' },
];
const FIRST_TARGET_MS = 3000;   // через сколько появится первое задание
const TARGET_EVERY_MS = 10000;  // как часто меняется цвет
const TARGET_SHARE = 0.35;      // какая часть точек — нужного цвета

let target = null, roundStart = 0, targetSince = 0, mistakes = 0;
const colorsArea = document.getElementById('colors');
const targetBox = colorsArea.querySelector('.target');
const mistakesBox = colorsArea.querySelector('.mistakes');
const randomColor = list => list[Math.floor(Math.random() * list.length)];

const colorsGame = makeGame('colors', {
  pickColor: () => {
    if (target && Math.random() < TARGET_SHARE) return target;
    return randomColor(COLORS.filter(c => c !== target));
  },
  onTap: color => {
    if (!target) return false;            // задания ещё нет — просто лопаем
    if (color === target) return true;
    mistakes++;                           // не тот цвет!
    mistakesBox.textContent = 'Ошибки: ' + mistakes;
    colorsArea.classList.remove('flash-bad'); void colorsArea.offsetWidth;
    colorsArea.classList.add('flash-bad');
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
    return false;
  },
});

function say(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  speechSynthesis.speak(u);
}

function newTarget() {
  target = randomColor(COLORS.filter(c => c !== target));
  targetSince = Date.now();
  targetBox.innerHTML = `Только <b style="background:${target.css};color:${target.text}">${target.name.toUpperCase()}</b>`;
  targetBox.classList.remove('new'); void targetBox.offsetWidth;
  targetBox.classList.add('new');
  say('Только ' + target.name);
}

function startColorsRound() {
  target = null; roundStart = Date.now(); mistakes = 0;
  targetBox.textContent = 'Приготовься…';
  mistakesBox.textContent = 'Ошибки: 0';
  colorsGame.reset();
}
colorsArea.querySelector('.reset').onclick = startColorsRound;

// ===== Главный цикл: точки появляются только на открытом экране =====
(function loop() {
  if (!document.hidden) {
    if (dotsGame.area.classList.contains('active')) dotsGame.spawn();
    if (colorsArea.classList.contains('active')) colorsGame.spawn();
  }
  setTimeout(loop, dotEveryMs());
})();

setInterval(() => {
  if (!colorsArea.classList.contains('active') || document.hidden) return;
  const now = Date.now();
  if (!target && now - roundStart >= FIRST_TARGET_MS) newTarget();
  else if (target && now - targetSince >= TARGET_EVERY_MS) newTarget();
}, 200);

// ===== Идеи (сохраняются в памяти телефона) =====
const ideaList = document.getElementById('ideaList');
let ideas = JSON.parse(localStorage.getItem('ideas') || '[]');

function renderIdeas() {
  ideaList.innerHTML = '';
  ideas.forEach((text, i) => {
    const li = document.createElement('li');
    li.textContent = text;
    const del = document.createElement('button');
    del.textContent = '✕';
    del.onclick = () => { ideas.splice(i, 1); saveIdeas(); };
    li.appendChild(del);
    ideaList.appendChild(li);
  });
}
function saveIdeas() { localStorage.setItem('ideas', JSON.stringify(ideas)); renderIdeas(); }

document.getElementById('ideaForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('ideaInput');
  if (input.value.trim()) { ideas.unshift(input.value.trim()); input.value = ''; saveIdeas(); }
});
renderIdeas();

// ===== Рисовалка =====
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const colors = ['#1b1440', '#e63946', '#ffb703', '#2a9d8f', '#219ebc', '#8338ec', '#ff006e'];
let color = colors[0];
let drawing = false;

const palette = document.getElementById('palette');
colors.forEach((c, i) => {
  const b = document.createElement('button');
  b.style.background = c;
  if (i === 0) b.classList.add('sel');
  b.onclick = () => {
    color = c;
    palette.querySelectorAll('button').forEach(x => x.classList.remove('sel'));
    b.classList.add('sel');
  };
  palette.appendChild(b);
});

function resizeCanvas() {
  const r = canvas.getBoundingClientRect();
  if (canvas.width === Math.round(r.width) && canvas.height === Math.round(r.height)) return;
  canvas.width = r.width; canvas.height = r.height;
}
function pos(e) { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }

canvas.addEventListener('pointerdown', e => {
  drawing = true; ctx.beginPath(); ctx.moveTo(...pos(e));
});
canvas.addEventListener('pointermove', e => {
  if (!drawing) return;
  ctx.lineTo(...pos(e));
  ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.stroke();
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => canvas.addEventListener(ev, () => drawing = false));

document.getElementById('clearBtn').onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);
document.getElementById('saveBtn').onclick = () => {
  const a = document.createElement('a');
  a.download = 'risunok.png';
  a.href = canvas.toDataURL();
  a.click();
};

// ===== Лаборатория: пример, который можно менять =====
const phrases = ['Ты гений! 🚀', 'Придумай новую кнопку!', 'Поменяй цвет в style.css 🎨', 'А что если сделать игру? 🎮', 'Магия работает ✨'];
document.getElementById('magicBtn').onclick = () => {
  document.getElementById('magicOut').textContent = phrases[Math.floor(Math.random() * phrases.length)];
  if (navigator.vibrate) navigator.vibrate(50);
};

// ===== Установка как приложение =====
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); deferredPrompt = e; installBtn.hidden = false;
});
installBtn.onclick = async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice;
  deferredPrompt = null; installBtn.hidden = true;
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
