// ===== Переключение экранов =====
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.screen).classList.add('active');
    if (btn.dataset.screen === 'draw') resizeCanvas();
  });
});

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
