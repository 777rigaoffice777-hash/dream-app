/* build 47 */
// ===== Тема приложения: свои цвета и эмодзи (настраивается во вкладке «Лаба») =====
// Тема — это набор цветов + эмодзи в заголовке + узор из эмодзи на фоне.
// Чтобы добавить готовую тему — допиши её в THEME_PRESETS.
const THEME_PRESETS = [
  { name: 'Космос',  emoji: '✨', bg: '#1b1440', bg2: '#3a2d8a', card: '#2a2160', accent: '#ffb703', text: '#f4f1ff', deco: '' },
  { name: 'Океан',   emoji: '🐬', bg: '#03256c', bg2: '#1768ac', card: '#06417a', accent: '#2ec4b6', text: '#f1faff', deco: '🫧🐟' },
  { name: 'Лес',     emoji: '🌲', bg: '#0f2e1d', bg2: '#2d6a4f', card: '#1b4332', accent: '#95d5b2', text: '#f0fff4', deco: '🍃🍄' },
  { name: 'Конфета', emoji: '🍭', bg: '#ffd6e8', bg2: '#ffafcc', card: '#ffc8dd', accent: '#ff4d8d', text: '#5a1846', deco: '🍬🧁' },
  { name: 'Закат',   emoji: '🌅', bg: '#3d0c45', bg2: '#ff7b00', card: '#6a1b4d', accent: '#ffd166', text: '#fff3e6', deco: '' },
  { name: 'Ночь',    emoji: '🌙', bg: '#000000', bg2: '#1c1c2e', card: '#16161f', accent: '#c0c0ff', text: '#e6e6ff', deco: '⭐' },
];
const START_COLORS = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#2ec4b6', '#1982c4', '#6a4c93', '#ff6fb5', '#ffffff', '#111111'];
const START_EMOJIS = ['✨', '🚀', '🐱', '🌈', '⚽', '🍕', '🦄', '🔥', '🎮', '💎'];
const MAX_DECO = 4; // сколько разных эмодзи можно рассыпать по фону

let theme = JSON.parse(localStorage.getItem('theme') || 'null') || { ...THEME_PRESETS[0] };
let myThemes = JSON.parse(localStorage.getItem('myThemes') || '[]');
let myColors = JSON.parse(localStorage.getItem('myColors') || 'null') || [...START_COLORS];
let myEmojis = JSON.parse(localStorage.getItem('myEmojis') || 'null') || [...START_EMOJIS];
const splitEmoji = s => [...new Intl.Segmenter().segment(s || '')].map(x => x.segment).filter(x => x.trim());

// Светлый цвет или тёмный? Нужно, чтобы надписи на кнопках всегда читались
function isLight(hex) {
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}
// Узор: эмодзи, рассыпанные по фону (картинка, нарисованная прямо в коде)
function decoImage(emojis) {
  const list = splitEmoji(emojis).slice(0, MAX_DECO);
  if (!list.length) return 'none';
  const spots = [[10, 34], [72, 22], [38, 82], [98, 104]];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="130" height="130">${
    spots.map(([x, y], i) => `<text x="${x}" y="${y}" font-size="24" opacity=".22">${list[i % list.length]}</text>`).join('')}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
function applyTheme(t) {
  const root = document.documentElement.style;
  ['bg', 'bg2', 'card', 'accent', 'text'].forEach(k => root.setProperty('--' + k, t[k]));
  root.setProperty('--on-accent', isLight(t.accent) ? '#1b1440' : '#ffffff');
  root.setProperty('--deco', decoImage(t.deco));
  document.getElementById('appEmoji').textContent = t.emoji || '✨';
  document.querySelector('meta[name="theme-color"]').content = t.bg;
}
function saveTheme() {
  localStorage.setItem('theme', JSON.stringify(theme));
  applyTheme(theme);
  thDraw();
}
applyTheme(theme);

// ---------- Конструктор темы во вкладке «Лаба» ----------
let thSlot = 'bg', thMode = 'title', thTrash = false;
const sameTheme = (a, b) => ['bg', 'bg2', 'card', 'accent', 'text', 'emoji', 'deco'].every(k => (a[k] || '') === (b[k] || ''));

function thDraw() {
  // Готовые и мои темы
  const list = document.getElementById('thList');
  list.innerHTML = '';
  [...THEME_PRESETS.map(t => ({ ...t, preset: true })), ...myThemes].forEach(t => {
    const b = document.createElement('button');
    b.className = 'thCard' + (sameTheme(t, theme) ? ' sel' : '');
    b.style.background = `radial-gradient(circle at 20% 0%, ${t.bg2}, ${t.bg} 75%)`;
    b.style.color = t.text;
    b.innerHTML = `<span class="thCardEmoji"></span><span class="thCardName"></span><i style="background:${t.accent}"></i>`;
    b.querySelector('.thCardEmoji').textContent = t.emoji;
    b.querySelector('.thCardName').textContent = t.name;
    if (thTrash && !t.preset) b.insertAdjacentHTML('beforeend', '<span class="thDel">✕</span>');
    b.onclick = () => {
      if (thTrash) {
        if (!t.preset && confirm(`Удалить тему «${t.name}»?`)) {
          myThemes = myThemes.filter(x => x !== t);
          localStorage.setItem('myThemes', JSON.stringify(myThemes));
          thDraw();
        }
        return;
      }
      theme = { ...t }; delete theme.preset;
      saveTheme();
    };
    list.appendChild(b);
  });
  // Что красим — с текущими цветами
  document.querySelectorAll('#thSlots button').forEach(b => {
    b.classList.toggle('sel', b.dataset.slot === thSlot);
    b.querySelector('i').style.background = theme[b.dataset.slot];
  });
  document.querySelectorAll('#thModes [data-mode]').forEach(b => b.classList.toggle('sel', b.dataset.mode === thMode));
  // Мои цвета
  const colors = document.getElementById('thColors');
  colors.innerHTML = '';
  myColors.forEach(c => {
    const b = document.createElement('button');
    b.className = 'thColor' + (theme[thSlot] === c ? ' sel' : '');
    b.style.background = c;
    if (thTrash) b.innerHTML = '<span class="thDel">✕</span>';
    b.onclick = () => {
      if (thTrash) { myColors = myColors.filter(x => x !== c); localStorage.setItem('myColors', JSON.stringify(myColors)); return thDraw(); }
      theme[thSlot] = c;
      saveTheme();
    };
    colors.appendChild(b);
  });
  // ➕ свой цвет: открывается палитра телефона
  const add = document.createElement('label');
  add.className = 'thColor thAdd';
  add.innerHTML = '➕<input type="color" value="#44aaff">';
  add.querySelector('input').onchange = e => {
    const c = e.target.value;
    if (!myColors.includes(c)) myColors.push(c);
    localStorage.setItem('myColors', JSON.stringify(myColors));
    theme[thSlot] = c;           // сразу и покрасим
    saveTheme();
  };
  colors.appendChild(add);
  // Мои эмодзи
  const emojis = document.getElementById('thEmojis');
  emojis.innerHTML = '';
  const deco = splitEmoji(theme.deco);
  myEmojis.forEach(em => {
    const b = document.createElement('button');
    b.className = 'thEmoji' + ((thMode === 'title' ? theme.emoji === em : deco.includes(em)) ? ' sel' : '');
    b.textContent = em;
    if (thTrash) b.insertAdjacentHTML('beforeend', '<span class="thDel">✕</span>');
    b.onclick = () => {
      if (thTrash) { myEmojis = myEmojis.filter(x => x !== em); localStorage.setItem('myEmojis', JSON.stringify(myEmojis)); return thDraw(); }
      if (thMode === 'title') theme.emoji = em;
      else {
        const d = splitEmoji(theme.deco);
        theme.deco = (d.includes(em) ? d.filter(x => x !== em) : [...d, em].slice(-MAX_DECO)).join('');
      }
      saveTheme();
    };
    emojis.appendChild(b);
  });
}
document.querySelectorAll('#thSlots button').forEach(b => b.onclick = () => { thSlot = b.dataset.slot; thDraw(); });
document.querySelectorAll('#thModes [data-mode]').forEach(b => b.onclick = () => { thMode = b.dataset.mode; thDraw(); });
document.getElementById('thNoDeco').onclick = () => { theme.deco = ''; saveTheme(); };
document.getElementById('thEmojiAdd').onclick = () => {
  const inp = document.getElementById('thEmojiInput');
  const list = splitEmoji(inp.value);
  if (!list.length) return showToast('Вставь эмодзи с клавиатуры 🙂');
  list.forEach(em => { if (!myEmojis.includes(em)) myEmojis.push(em); });
  localStorage.setItem('myEmojis', JSON.stringify(myEmojis));
  inp.value = '';
  thDraw();
};
document.getElementById('thTrash').onclick = e => {
  thTrash = !thTrash;
  e.currentTarget.textContent = thTrash ? '✅ Готово' : '🗑 Убирать';
  if (thTrash) showToast('Нажми на свою тему, цвет или эмодзи, чтобы убрать');
  thDraw();
};
document.getElementById('thSave').onclick = () => {
  const name = (prompt('Как назовём тему?', 'Моя тема ' + (myThemes.length + 1)) || '').trim();
  if (!name) return;
  myThemes.push({ ...theme, name });
  localStorage.setItem('myThemes', JSON.stringify(myThemes));
  theme.name = name;
  saveTheme();
  showToast('🎨 Тема «' + name + '» сохранена');
};
// ♻️ Сбросить всё — только то, что касается темы. Остальное приложение не трогаем
document.getElementById('thResetAll').onclick = () => {
  if (!confirm('Сбросить всё про тему?

• тема станет стандартной «Космос»
• мои цвета и эмодзи вернутся к началу
• сохранённые мои темы удалятся')) return;
  ['theme', 'myThemes', 'myColors', 'myEmojis'].forEach(k => localStorage.removeItem(k));
  theme = { ...THEME_PRESETS[0] };
  myThemes = [];
  myColors = [...START_COLORS];
  myEmojis = [...START_EMOJIS];
  thSlot = 'bg'; thMode = 'title';
  if (thTrash) document.getElementById('thTrash').click();
  applyTheme(theme);
  thDraw();
  showToast('♻️ Тема сброшена');
};
thDraw();

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
        sfx('pop');
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
    sfx('wrong');
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

// ===== Режим 3: Дед Мороз =====
// Нажимаешь на Деда Мороза — он подпрыгивает и говорит пожелание.
const GREETINGS = [
  'Хо-хо-хо! С Новым годом!',
  'Хо-хо-хо! С Новым годом, Ваня!',
  'Хо-хо-хо! С праздником!',
  'Хо-хо-хо! Счастливого Нового года!',
];
const WISHES = [
  'Желаю, чтобы вся твоя семья была здоровой!',
  'Желаю, чтобы оценки были только хорошие!',
  'Желаю, чтобы подарки были самые крутые!',
  'Желаю, чтобы все твои желания исполнялись!',
  'Желаю, чтобы ты в конце концов встретил свою любовь!',
  'Желаю, чтобы мама и папа тобой гордились!',
  'Желаю, чтобы рядом всегда были верные друзья!',
  'Желаю, чтобы каждый день был весёлым!',
  'Желаю, чтобы ты рос сильным и смелым!',
  'Желаю, чтобы все твои идеи получались!',
  'Желаю, чтобы в новом году было много приключений!',
  'Желаю, чтобы ты никогда не болел!',
  'Желаю, чтобы учёба давалась легко!',
  'Желаю, чтобы твоё приложение стало самым лучшим!',
  'Желаю, чтобы дома всегда было тепло и уютно!',
  'Желаю, чтобы у тебя всё получалось с первого раза!',
  'Желаю, чтобы каникулы были длинными и снежными!',
  'Желаю, чтобы ты всегда улыбался!',
  'Желаю, чтобы рядом были люди, которые тебя любят!',
  'Желаю, чтобы ты стал тем, кем мечтаешь!',
  'Желаю, чтобы бабушки и дедушки были здоровы!',
  'Желаю, чтобы в этом году сбылась твоя главная мечта!',
];

const morozBtn = document.getElementById('morozBtn');
const morozSvg = document.getElementById('morozSvg');
const morozBubble = document.getElementById('morozBubble');
const morozArea = document.getElementById('moroz');

// «Мешок» пожеланий: перемешиваем и достаём по одному, пока не кончатся — без повторов
let wishBag = [];
function nextWish() {
  if (!wishBag.length) wishBag = [...WISHES].sort(() => Math.random() - 0.5);
  return wishBag.pop();
}

let talkTimer;
function morozSay(text) {
  clearTimeout(talkTimer);
  morozSvg.classList.add('talking');
  const stop = () => morozSvg.classList.remove('talking');
  talkTimer = setTimeout(stop, text.length * 75); // запасной вариант, если голоса нет
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ru-RU';
  u.pitch = 0.6;   // низкий голос, как у Деда Мороза
  u.rate = 0.9;
  u.onend = () => { clearTimeout(talkTimer); stop(); };
  speechSynthesis.speak(u);
}

function sparkles(x, y) {
  const icons = ['✨', '⭐', '❄️', '🎁', '🎄'];
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.textContent = icons[i % icons.length];
    const angle = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 90;
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
    s.style.setProperty('--dy', Math.sin(angle) * dist + 'px');
    morozArea.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

morozBtn.addEventListener('click', e => {
  const greeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  const wish = nextWish();
  morozBubble.innerHTML = `<span class="hoho">${greeting}</span>${wish}`;
  morozBubble.classList.remove('pop'); void morozBubble.offsetWidth; morozBubble.classList.add('pop');
  morozBtn.classList.remove('jump'); void morozBtn.offsetWidth; morozBtn.classList.add('jump');
  const r = morozArea.getBoundingClientRect();
  sparkles((e.clientX || r.width / 2) - r.left, (e.clientY || r.height / 2) - r.top);
  if (navigator.vibrate) navigator.vibrate(30);
  morozSay(greeting + ' ' + wish);
});

// Снег
(function makeSnow() {
  const snow = document.getElementById('snow');
  for (let i = 0; i < 40; i++) {
    const f = document.createElement('span');
    f.className = 'flake';
    f.textContent = Math.random() < 0.5 ? '❄' : '•';
    f.style.left = Math.random() * 100 + '%';
    f.style.fontSize = (8 + Math.random() * 14) + 'px';
    f.style.animationDuration = (6 + Math.random() * 8) + 's';
    f.style.animationDelay = (-Math.random() * 14) + 's';
    f.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
    snow.appendChild(f);
  }
})();

// ===== Режим 4: Головоломки (лёгкие и средние) =====
// Каждая головоломка — это { level, title, task, render(board, win) }.
// render рисует головоломку в board и вызывает win(), когда она решена.
// Хочешь добавить свою — допиши ещё один объект в PUZZLES.
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

// Выбор одного правильного ответа из нескольких
function choicePuzzle(board, options, correct, win) {
  shuffle(options).forEach(opt => {
    const b = document.createElement('button');
    b.className = 'pzItem' + (String(opt).length > 2 ? ' text' : '');
    b.textContent = opt;
    b.onclick = () => {
      if (opt === correct) { b.classList.add('good'); win(); }
      else { b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad'); if (navigator.vibrate) navigator.vibrate(80); }
    };
    board.appendChild(b);
  });
}

// Пятнашки size×size (3 или 4). moves — сколько ходов перемешивать (больше = сложнее)
function slidingPuzzle(board, win, moves, size = 3) {
  const N = size * size;
  const grid = document.createElement('div');
  grid.className = 'pz15' + (size > 3 ? ' big' : '');
  grid.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
  board.appendChild(grid);
  let tiles = [...Array(N).keys()].map(i => (i + 1) % N); // 1..N-1, 0 — пустое место
  const GOAL = tiles.join();
  const neighbors = i => [i - size, i + size, i % size ? i - 1 : -1, i % size < size - 1 ? i + 1 : -1]
    .filter(n => n >= 0 && n < N);
  let prev = -1;
  for (let k = 0; k < moves || tiles.join() === GOAL; k++) {
    const e = tiles.indexOf(0);
    const opts = neighbors(e).filter(n => n !== prev);
    const n = opts[Math.floor(Math.random() * opts.length)];
    [tiles[e], tiles[n]] = [tiles[n], tiles[e]];
    prev = e;
  }
  const draw = () => {
    grid.innerHTML = '';
    tiles.forEach((t, i) => {
      const b = document.createElement('button');
      b.textContent = t || '';
      if (!t) b.className = 'empty';
      b.onclick = () => {
        const e = tiles.indexOf(0);
        if (!neighbors(e).includes(i) || grid.dataset.done) return;
        [tiles[e], tiles[i]] = [tiles[i], tiles[e]];
        draw();
        if (tiles.join() === GOAL) { grid.dataset.done = 1; win(); }
      };
      grid.appendChild(b);
    });
  };
  draw();
}

// Найди пары. emojis — по одной картинке на пару, cols — сколько столбиков
function memoryPuzzle(board, win, emojis, cols) {
  const grid = document.createElement('div');
  grid.className = 'pzMemory';
  grid.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  if (emojis.length > 6) grid.classList.add('many');
  board.appendChild(grid);
  let open = [], found = 0, busy = false;
  shuffle([...emojis, ...emojis]).forEach(emoji => {
    const b = document.createElement('button');
    b.textContent = emoji;
    b.onclick = () => {
      if (busy || b.classList.contains('open') || b.classList.contains('matched')) return;
      b.classList.add('open');
      open.push(b);
      if (open.length < 2) return;
      const [a, c] = open; open = [];
      if (a.textContent === c.textContent) {
        a.classList.replace('open', 'matched'); c.classList.replace('open', 'matched');
        if (++found === emojis.length) win();
      } else {
        busy = true;
        setTimeout(() => { a.classList.remove('open'); c.classList.remove('open'); busy = false; }, 800);
      }
    };
    grid.appendChild(b);
  });
}

const PUZZLES = [
  // ---------- Лёгкие ----------
  {
    level: 'easy', title: 'Найди лишнее',
    task: 'Что здесь не фрукт? Нажми на лишнее.',
    render: (board, win) => choicePuzzle(board, ['🍎', '🍌', '🍇', '🚗', '🍐'], '🚗', win),
  },
  {
    level: 'easy', title: 'Продолжи ряд',
    task: 'Какой кружок будет следующим?',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend', '<div class="pzSeq">🔴🔵🔴🔵🔴❓</div>');
      choicePuzzle(board, ['🔴', '🔵', '🟢'], '🔵', win);
    },
  },
  {
    level: 'easy', title: 'Загадка',
    task: 'Отгадай, о чём это.',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend', '<div class="pzRiddle">«Зимой и летом —<br>одним цветом»</div>');
      choicePuzzle(board, ['🎄 Ёлка', '⛄ Снеговик', '☀️ Солнце'], '🎄 Ёлка', win);
    },
  },
  {
    level: 'easy', title: 'Пятнашки',
    task: 'Расставь числа по порядку от 1 до 8. Нажимай на плитку рядом с пустым местом.',
    render: (board, win) => slidingPuzzle(board, win, 6),
  },
  {
    level: 'easy', title: 'Найди пары',
    task: 'Открывай по две карточки и найди одинаковые картинки.',
    render: (board, win) => pictureMemory(board, win, 3, 3),
  },

  // ---------- Средние ----------
  {
    level: 'medium', title: 'Числовой ряд',
    task: 'Каждое число больше предыдущего по одному правилу. Какое число следующее?',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend', '<div class="pzSeq">1, 2, 4, 8, ❓</div>');
      choicePuzzle(board, ['10', '12', '16', '9'], '16', win);
    },
  },
  {
    level: 'medium', title: 'Фруктовая математика',
    task: 'Каждый фрукт — это число. Сколько стоит банан?',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend',
        '<div class="pzRiddle" style="font-style:normal">🍎 + 🍎 = 10<br>🍎 + 🍌 = 8<br>🍌 = ❓</div>');
      choicePuzzle(board, ['2', '3', '4', '5'], '3', win);
    },
  },
  {
    level: 'medium', title: 'Задача на смекалку',
    task: 'Подумай внимательно — тут есть подвох!',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend',
        '<div class="pzRiddle">У Маши 3 брата.<br>У каждого брата одна сестра.<br>Сколько всего детей в семье?</div>');
      choicePuzzle(board, ['4', '6', '7', '5'], '4', win);
    },
  },
  {
    level: 'medium', title: 'Пятнашки',
    task: 'Теперь перемешано сильнее! Расставь числа от 1 до 8.',
    render: (board, win) => slidingPuzzle(board, win, 30),
  },
  {
    level: 'medium', title: 'Найди пары',
    task: 'Уже 6 пар! Запоминай, где что лежит.',
    render: (board, win) => pictureMemory(board, win, 6, 4),
  },

  // ---------- Сложные ----------
  {
    level: 'hard', title: 'Хитрый ряд',
    task: 'Найди правило: как из двух чисел получается следующее?',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend', '<div class="pzSeq">1, 1, 2, 3, 5, 8, ❓</div>');
      choicePuzzle(board, ['11', '12', '13', '16'], '13', win);
    },
  },
  {
    level: 'hard', title: 'Фрукты и порядок действий',
    task: 'Сначала найди каждый фрукт. Помни: умножение делается раньше сложения!',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend',
        '<div class="pzRiddle" style="font-style:normal">🍎 + 🍎 + 🍎 = 15<br>🍌 + 🍌 + 🍎 = 13<br>🍇 + 🍌 = 7<br><b>🍎 + 🍌 × 🍇 = ❓</b></div>');
      choicePuzzle(board, ['27', '17', '12', '20'], '17', win);
    },
  },
  {
    level: 'hard', title: 'Задача с подвохом',
    task: 'Читай очень внимательно!',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend',
        '<div class="pzRiddle">У пастуха было 17 овец.<br>Все, кроме 9, убежали.<br>Сколько овец осталось?</div>');
      choicePuzzle(board, ['8', '9', '17', '26'], '9', win);
    },
  },
  {
    level: 'hard', title: 'Пятнашки',
    task: 'Всё перемешано по-настоящему! Расставь числа от 1 до 8.',
    render: (board, win) => slidingPuzzle(board, win, 200),
  },
  {
    level: 'hard', title: 'Найди пары',
    task: '8 пар! Нужна хорошая память.',
    render: (board, win) => pictureMemory(board, win, 8, 4),
  },

  // ---------- Очень сложные ----------
  {
    level: 'expert', title: 'Ряд для гения',
    task: 'Посмотри, на сколько вырастает каждое следующее число.',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend', '<div class="pzSeq">2, 6, 12, 20, 30, ❓</div>');
      choicePuzzle(board, ['36', '40', '42', '44'], '42', win);
    },
  },
  {
    level: 'expert', title: 'Улитка',
    task: 'Подумай, что случится в последний день.',
    render: (board, win) => {
      board.insertAdjacentHTML('beforeend',
        '<div class="pzRiddle">🐌 Улитка ползёт вверх по столбу высотой 10 метров.<br>Днём поднимается на 3 метра,<br>ночью сползает на 2 метра.<br>За сколько дней она доберётся до верха?</div>');
      choicePuzzle(board, ['10', '9', '8', '7'], '8', win);
    },
  },
  {
    level: 'expert', title: 'Ханойская башня',
    task: 'Перенеси всю башню на правый столбик. Нажми на столбик, чтобы взять верхний диск, и на другой — чтобы положить. Большой диск нельзя класть на маленький!',
    render: (board, win) => hanoiPuzzle(board, win, 4),
  },
  {
    level: 'expert', title: 'Выключи свет',
    task: 'Нажатие переключает лампочку и её соседей сверху, снизу, слева и справа. Выключи все лампочки!',
    render: (board, win) => lightsPuzzle(board, win, 4, 5),
  },
  {
    level: 'expert', title: 'Найди пары',
    task: '10 пар — все картинки сразу! Настоящая тренировка памяти.',
    render: (board, win) => pictureMemory(board, win, 10, 5),
  },
  {
    level: 'expert', title: 'Пятнашки 4×4',
    task: 'Большие пятнашки! Расставь числа от 1 до 15.',
    render: (board, win) => slidingPuzzle(board, win, 60, 4),
  },
];

// Ханойская башня: disks — сколько дисков
function hanoiPuzzle(board, win, disks) {
  const wrap = document.createElement('div');
  wrap.className = 'hanoi';
  board.appendChild(wrap);
  const info = document.createElement('div');
  info.className = 'hanoiInfo';
  board.appendChild(info);
  const pegs = [[...Array(disks).keys()].map(i => disks - i), [], []]; // внизу самый большой
  let selected = null, moves = 0, done = false;
  const best = 2 ** disks - 1;
  const COLORS = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
  const draw = () => {
    wrap.innerHTML = '';
    pegs.forEach((peg, p) => {
      const col = document.createElement('button');
      col.className = 'peg' + (selected === p ? ' sel' : '');
      col.innerHTML = '<div class="rod"></div>' + peg.map(d =>
        `<div class="disk" style="width:${25 + d * 15}%;background:${COLORS[(d - 1) % COLORS.length]}"></div>`).join('');
      col.onclick = () => {
        if (done) return;
        if (selected === null) { if (peg.length) selected = p; }
        else if (selected === p) selected = null;
        else {
          const from = pegs[selected], disk = from[from.length - 1];
          if (!peg.length || peg[peg.length - 1] > disk) { peg.push(from.pop()); moves++; selected = null; }
          else { col.classList.remove('bad'); void col.offsetWidth; col.classList.add('bad'); if (navigator.vibrate) navigator.vibrate(80); return; }
        }
        draw();
        if (pegs[2].length === disks) { done = true; win(); }
      };
      wrap.appendChild(col);
    });
    info.textContent = `Ходов: ${moves}  ·  Лучший результат: ${best}`;
  };
  draw();
}

// Выключи свет: size×size, presses — сколько случайных нажатий для начальной картинки
function lightsPuzzle(board, win, size, presses) {
  const grid = document.createElement('div');
  grid.className = 'lights';
  grid.style.gridTemplateColumns = `repeat(${size}, minmax(0, 1fr))`;
  board.appendChild(grid);
  const N = size * size;
  let on = Array(N).fill(false), done = false;
  const toggle = i => {
    const r = Math.floor(i / size), c = i % size;
    [[r, c], [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(([y, x]) => {
      if (y >= 0 && y < size && x >= 0 && x < size) on[y * size + x] = !on[y * size + x];
    });
  };
  // Начинаем с «всё выключено» и делаем случайные нажатия — так задача всегда решаема
  do { // если нажатия случайно погасили друг друга — перемешиваем заново
    on.fill(false);
    shuffle([...Array(N).keys()]).slice(0, presses).forEach(toggle);
  } while (on.every(x => !x));
  const draw = () => {
    grid.innerHTML = '';
    on.forEach((isOn, i) => {
      const b = document.createElement('button');
      b.className = isOn ? 'on' : '';
      b.textContent = isOn ? '💡' : '';
      b.onclick = () => {
        if (done) return;
        toggle(i); draw();
        if (on.every(x => !x)) { done = true; win(); }
      };
      grid.appendChild(b);
    });
  };
  draw();
}

// ---------- Картинки для «Найди пары» (5-е задание на каждом уровне) ----------
// Чтобы добавить картинку — допиши строку: { pic: 'эмодзи', name: 'Название' }
const PICTURES = [
  { pic: '🐘', name: 'Слон' },
  { pic: '🚀', name: 'Ракета' },
  { pic: '🦒', name: 'Жираф' },
  { pic: '🍉', name: 'Арбуз' },
  { pic: '🐧', name: 'Пингвин' },
  { pic: '🎸', name: 'Гитара' },
  { pic: '🦀', name: 'Краб' },
  { pic: '🚁', name: 'Вертолёт' },
  { pic: '🐢', name: 'Черепаха' },
  { pic: '🏰', name: 'Замок' },
];

// «Найди пары» с картинками: pairs — сколько пар, cols — сколько столбиков.
// Каждый раз берутся случайные картинки из PICTURES.
function pictureMemory(board, win, pairs, cols) {
  const pics = shuffle(PICTURES).slice(0, pairs).map(p => p.pic);
  memoryPuzzle(board, win, pics, cols);
}

const LEVEL_NAMES = { easy: 'Лёгкие', medium: 'Средние', hard: 'Сложные', expert: 'Очень сложные' };
let pzIndex = 0;
let pzSolved = JSON.parse(localStorage.getItem('pzSolved') || '[]');
// Порядок заданий в «Очень сложных» поменялся — сбрасываем отметки начиная с 5-го задания этого уровня
if (localStorage.getItem('pzVersion') !== '2') {
  pzSolved = pzSolved.filter(i => i < 19);
  localStorage.setItem('pzSolved', JSON.stringify(pzSolved));
  localStorage.setItem('pzVersion', '2');
}
const pzBoard = document.getElementById('pzBoard');
const pzMsg = document.getElementById('pzMsg');
const PRAISE = ['Молодец!', 'Отлично!', 'Супер!', 'Ты гений!', 'Здорово!'];
const inLevel = lvl => PUZZLES.map((p, i) => i).filter(i => PUZZLES[i].level === lvl);

function showPuzzle(i) {
  pzIndex = (i + PUZZLES.length) % PUZZLES.length;
  const p = PUZZLES[pzIndex];
  const group = inLevel(p.level);
  document.getElementById('pzTitle').textContent = `${group.indexOf(pzIndex) + 1}. ${p.title}`;
  document.getElementById('pzTask').textContent = p.task;
  pzMsg.textContent = ''; pzMsg.className = '';
  pzBoard.innerHTML = '';
  p.render(pzBoard, () => {
    const praise = PRAISE[Math.floor(Math.random() * PRAISE.length)];
    pzMsg.textContent = '🎉 ' + praise + ' Головоломка решена!';
    pzMsg.className = 'win';
    sfx('win');
    say(praise);
    if (navigator.vibrate) navigator.vibrate([40, 40, 40]);
    if (!pzSolved.includes(pzIndex)) { pzSolved.push(pzIndex); localStorage.setItem('pzSolved', JSON.stringify(pzSolved)); }
    if (group.every(j => pzSolved.includes(j))) pzMsg.textContent = `🏆 Ты решил все ${LEVEL_NAMES[p.level].toLowerCase()} головоломки!`;
    drawLevels();
  });
  drawLevels();
}

function drawLevels() {
  const current = PUZZLES[pzIndex].level;
  // Переключатель «Лёгкие / Средние»
  const groups = document.getElementById('pzGroups');
  groups.innerHTML = '';
  Object.entries(LEVEL_NAMES).forEach(([lvl, name]) => {
    const b = document.createElement('button');
    b.textContent = name;
    if (lvl === current) b.classList.add('current');
    b.onclick = () => showPuzzle(inLevel(lvl)[0]);
    groups.appendChild(b);
  });
  // Кружки с номерами головоломок этого уровня
  const box = document.getElementById('pzLevels');
  box.innerHTML = '';
  inLevel(current).forEach((i, n) => {
    const b = document.createElement('button');
    b.textContent = n + 1;
    if (i === pzIndex) b.classList.add('current');
    if (pzSolved.includes(i)) b.classList.add('done');
    b.onclick = () => showPuzzle(i);
    box.appendChild(b);
  });
}

document.getElementById('pzPrev').onclick = () => showPuzzle(pzIndex - 1);
document.getElementById('pzNext').onclick = () => showPuzzle(pzIndex + 1);
document.getElementById('pzRetry').onclick = () => showPuzzle(pzIndex);
showPuzzle(0);

// ===== Режим 5: Нарисуй фигуру за 15 секунд =====
// Игра называет фигуру, ты рисуешь её пальцем. Потом рисунок сравнивается
// с идеальной фигурой того же размера, и получается точность в процентах.
const SHAPES = {
  circle:   { name: 'Круг',        equalSides: true },
  square:   { name: 'Квадрат',     equalSides: true },
  triangle: { name: 'Треугольник', equalSides: false },
  rhombus:  { name: 'Ромб',        equalSides: false },
  star:     { name: 'Звезда',      equalSides: false },
};
const SHAPE_TIME = 15; // секунд на рисунок

// Точки идеальной фигуры, вписанной в прямоугольник (x, y, w, h)
function shapeOutline(type, x, y, w, h, n = 160) {
  const cx = x + w / 2, cy = y + h / 2;
  if (type === 'circle') {
    return [...Array(n)].map((_, i) => {
      const a = (i / n) * Math.PI * 2;
      return [cx + Math.cos(a) * w / 2, cy + Math.sin(a) * h / 2];
    });
  }
  let v;
  if (type === 'square') v = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  if (type === 'rhombus') v = [[cx, y], [x + w, cy], [cx, y + h], [x, cy]];
  if (type === 'triangle') v = [[cx, y], [x + w, y + h], [x, y + h]];
  if (type === 'star') {
    // 5 лучей: внешние и внутренние вершины по очереди, потом вписываем в прямоугольник
    const raw = [...Array(10)].map((_, k) => {
      const a = (-90 + k * 36) * Math.PI / 180, r = k % 2 ? 0.382 : 1;
      return [Math.cos(a) * r, Math.sin(a) * r];
    });
    const minX = Math.min(...raw.map(p => p[0])), maxX = Math.max(...raw.map(p => p[0]));
    const minY = Math.min(...raw.map(p => p[1])), maxY = Math.max(...raw.map(p => p[1]));
    v = raw.map(([px, py]) => [x + (px - minX) / (maxX - minX) * w, y + (py - minY) / (maxY - minY) * h]);
  }
  // Равномерно расставляем точки по периметру многоугольника
  const edges = v.map((p, i) => [p, v[(i + 1) % v.length]]);
  const lens = edges.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1]));
  const total = lens.reduce((s, l) => s + l, 0);
  const pts = [];
  edges.forEach(([a, b], i) => {
    const k = Math.max(1, Math.round(n * lens[i] / total));
    for (let j = 0; j < k; j++) pts.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  });
  return pts;
}

// Насколько рисунок похож на фигуру: 0…100
function shapeScore(type, drawn) {
  const xs = drawn.map(p => p[0]), ys = drawn.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
  const diag = Math.hypot(w, h);
  if (diag < 30) return 0; // слишком маленький рисунок
  const ideal = shapeOutline(type, x, y, w, h);
  const nearest = (p, set) => Math.min(...set.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])));
  const d1 = drawn.reduce((s, p) => s + nearest(p, ideal), 0) / drawn.length;   // рисунок рядом с фигурой?
  const d2 = ideal.reduce((s, p) => s + nearest(p, drawn), 0) / ideal.length;   // вся фигура нарисована?
  let score = Math.max(0, 1 - ((d1 + d2) / 2 / diag) / 0.09) * 100;

  // Вся ли фигура нарисована? (незамкнутый круг — не круг)
  const covered = ideal.filter(p => nearest(p, drawn) < 0.06 * diag).length / ideal.length;
  score *= Math.min(1, covered / 0.95) ** 2;

  // У круга и квадрата ширина ≈ высоте
  if (SHAPES[type].equalSides) {
    const aspect = Math.min(w, h) / Math.max(w, h);
    if (aspect < 0.85) score *= (aspect / 0.85) ** 2;
  }

  // Углы: у квадрата линия доходит до углов рамки, у круга — нет
  const corners = [[x, y], [x + w, y], [x, y + h], [x + w, y + h]];
  const cornerGap = corners.reduce((s, c) => s + nearest(c, drawn), 0) / 4 / diag; // круг ≈ 0.15, квадрат ≈ 0
  if (type === 'circle' && cornerGap < 0.1) score *= Math.max(0, cornerGap / 0.1) ** 0.7;
  if (type === 'square' && cornerGap > 0.06) score *= Math.max(0, 1 - (cornerGap - 0.06) / 0.12);

  return Math.round(score);
}

const shCanvas = document.getElementById('shCanvas');
const shCtx = shCanvas.getContext('2d');
const shSample = document.getElementById('shSample');
const shResult = document.getElementById('shResult');
const shStartBtn = document.getElementById('shStart');
const shDoneBtn = document.getElementById('shDone');
let shTarget = null, shPoints = [], shDrawing = false, shPlaying = false, shTimer = null, shLeft = 0, shTotal = 0, shLast = null;

function sizeShapeCanvas() {
  const r = shCanvas.getBoundingClientRect();
  shCanvas.width = r.width; shCanvas.height = r.height;
}

function drawOutline(ctx, type, x, y, w, h, style) {
  const pts = shapeOutline(type, x, y, w, h);
  ctx.save();
  Object.assign(ctx, style);
  ctx.beginPath();
  pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py));
  ctx.closePath(); ctx.stroke();
  ctx.restore();
}

function newShapeRound() {
  const keys = Object.keys(SHAPES).filter(k => k !== shLast);
  shTarget = keys[Math.floor(Math.random() * keys.length)];
  shLast = shTarget;
  document.getElementById('shName').textContent = SHAPES[shTarget].name.toUpperCase();
  const sctx = shSample.getContext('2d');
  sctx.clearRect(0, 0, 120, 120);
  drawOutline(sctx, shTarget, 15, 15, 90, 90, { strokeStyle: '#ffb703', lineWidth: 7, lineJoin: 'round' });
  sizeShapeCanvas();
  shCtx.clearRect(0, 0, shCanvas.width, shCanvas.height);
  shPoints = [];
  shPlaying = true;
  shLeft = SHAPE_TIME;
  shResult.textContent = 'Рисуй! ✏️';
  shStartBtn.hidden = true; shDoneBtn.hidden = false;
  say('Нарисуй ' + SHAPES[shTarget].name.toLowerCase());
  updateShapeTimer();
  clearInterval(shTimer);
  // Считаем по настоящим часам: даже если телефон притормаживает таймеры, 15 секунд будут честными
  let lastTick = Date.now();
  shTimer = setInterval(() => {
    const now = Date.now(), dt = (now - lastTick) / 1000;
    lastTick = now;
    if (!document.getElementById('shapes').classList.contains('active') || document.hidden) return; // пауза, если ушли
    shLeft -= dt;
    updateShapeTimer();
    if (shLeft <= 0) finishShape(true);
  }, 100);
}

function updateShapeTimer() {
  document.getElementById('shTime').textContent = Math.max(0, Math.ceil(shLeft));
  const bar = document.getElementById('shBar');
  bar.style.width = Math.max(0, shLeft / SHAPE_TIME * 100) + '%';
  bar.style.background = shLeft > 5 ? '#7CFC9A' : '#ff595e';
}

function finishShape(timeUp) {
  if (!shPlaying) return;
  shPlaying = false; shDrawing = false;
  clearInterval(shTimer);
  shStartBtn.hidden = false; shStartBtn.textContent = '▶ Следующая фигура';
  shDoneBtn.hidden = true;
  if (shPoints.length < 10) {
    shResult.textContent = timeUp ? '⏰ Время вышло! Ты ничего не нарисовал.' : 'Сначала нарисуй фигуру 🙂';
    return;
  }
  // Сравниваем со всеми фигурами: вдруг получилась другая
  const scores = Object.fromEntries(Object.keys(SHAPES).map(k => [k, shapeScore(k, shPoints)]));
  const score = scores[shTarget];
  const best = Object.keys(scores).reduce((a, b) => scores[a] >= scores[b] ? a : b);
  // Показываем идеальную фигуру зелёным пунктиром поверх рисунка
  const xs = shPoints.map(p => p[0]), ys = shPoints.map(p => p[1]);
  const x = Math.min(...xs), y = Math.min(...ys);
  shCtx.setLineDash([10, 8]);
  drawOutline(shCtx, shTarget, x, y, Math.max(...xs) - x, Math.max(...ys) - y, { strokeStyle: '#2ecc40', lineWidth: 4, lineJoin: 'round' });
  shCtx.setLineDash([]);

  const stars = score >= 85 ? '⭐⭐⭐' : score >= 70 ? '⭐⭐' : score >= 55 ? '⭐' : '';
  const praise = score >= 85 ? 'Великолепно!' : score >= 70 ? 'Отлично!' : score >= 55 ? 'Хорошо!' : 'Попробуй ещё раз!';
  let text = `${praise} Точность ${score}% ${stars}`;
  if (best !== shTarget && scores[best] - score > 10) text += ` · Похоже больше на: ${SHAPES[best].name.toLowerCase()}`;
  if (timeUp) text = '⏰ ' + text;
  shResult.textContent = text;
  shTotal += score;
  document.getElementById('shScore').textContent = 'Очки: ' + shTotal;
  say(praise);
  if (score >= 55) sfx('win');
  if (navigator.vibrate) navigator.vibrate(score >= 70 ? [40, 40, 40] : 80);
}

function shPos(e) { const r = shCanvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
shCanvas.addEventListener('pointerdown', e => {
  if (!shPlaying) return;
  e.preventDefault();
  shDrawing = true;
  const p = shPos(e); shPoints.push(p);
  shCtx.beginPath(); shCtx.moveTo(...p);
});
shCanvas.addEventListener('pointermove', e => {
  if (!shDrawing) return;
  const p = shPos(e); shPoints.push(p);
  shCtx.lineTo(...p);
  shCtx.strokeStyle = '#1b1440'; shCtx.lineWidth = 6; shCtx.lineCap = 'round'; shCtx.lineJoin = 'round';
  shCtx.stroke();
});
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => shCanvas.addEventListener(ev, () => shDrawing = false));
shStartBtn.onclick = newShapeRound;
shDoneBtn.onclick = () => finishShape(false);

// ===== Генератор случайных чисел: от 0 до бесконечности =====
// Числа хранятся как BigInt — так можно работать с числами хоть из тысячи цифр без ошибок.
const NB_MAX_DIGITS = 1000;       // сколько цифр можно ввести в «От» и «До»
const NB_INF_CONTINUE = 0.85;     // ∞: с такой вероятностью к числу добавляется ещё одна цифра
const nbOut = document.getElementById('nbOut');
const nbInfo = document.getElementById('nbInfo');
const nbMin = document.getElementById('nbMin'), nbMax = document.getElementById('nbMax'), nbInf = document.getElementById('nbInf');
let nbHistory = JSON.parse(localStorage.getItem('nbHistory') || '[]');

// Только цифры, без лишних нулей впереди
const digitsOnly = s => (s.replace(/\D/g, '').slice(0, NB_MAX_DIGITS).replace(/^0+(?=\d)/, '')) || '0';
[nbMin, nbMax].forEach(inp => inp.addEventListener('input', () => {
  const clean = digitsOnly(inp.value);
  if (inp.value !== clean && inp.value !== '') inp.value = clean;
}));
nbInf.onchange = () => document.getElementById('nbRange').classList.toggle('off', nbInf.checked);
document.querySelectorAll('.nbPresets button').forEach(b => b.onclick = () => {
  nbMin.value = '0'; nbMax.value = b.dataset.max; nbInf.checked = false; nbInf.onchange();
});

// Честное случайное число от min до max включительно (криптографический генератор телефона)
function randomBigInt(min, max) {
  const range = max - min + 1n;
  const bits = range.toString(2).length;
  const bytes = Math.ceil(bits / 8);
  const mask = (1n << BigInt(bits)) - 1n;
  for (;;) {
    let x = 0n;
    crypto.getRandomValues(new Uint8Array(bytes)).forEach(b => { x = (x << 8n) | BigInt(b); });
    x &= mask;
    if (x < range) return min + x; // лишнее отбрасываем — так все числа одинаково вероятны
  }
}
// ∞: у числа нет предела — длина растёт, пока «монетка» говорит «ещё цифру»
function randomInfinite() {
  let len = 1;
  while (Math.random() < NB_INF_CONTINUE && len < 100000) len++;
  if (len === 1) return BigInt(Math.floor(Math.random() * 10));
  let s = String(1 + Math.floor(Math.random() * 9));
  const rest = crypto.getRandomValues(new Uint8Array(len - 1));
  rest.forEach(b => { s += b % 10; });
  return BigInt(s);
}
// 1234567 → «1 234 567»
const groupDigits = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

function nbRender(n) {
  const s = n.toString();
  nbOut.textContent = groupDigits(n);
  nbOut.className = 'nbOut' + (s.length > 30 ? ' huge' : s.length > 12 ? ' long' : '');
  nbInfo.textContent = s.length > 3 ? `цифр в числе: ${s.length}` : '';
}

document.getElementById('nbGo').onclick = () => {
  let result;
  if (nbInf.checked) result = randomInfinite();
  else {
    let lo = BigInt(digitsOnly(nbMin.value)), hi = BigInt(digitsOnly(nbMax.value));
    if (lo > hi) [lo, hi] = [hi, lo];       // перепутали «От» и «До» — не беда
    nbMin.value = lo; nbMax.value = hi;
    result = randomBigInt(lo, hi);
  }
  // Красиво «крутим» цифры, потом показываем ответ
  const btn = document.getElementById('nbGo');
  btn.disabled = true;
  const len = Math.min(result.toString().length, 40);
  let spins = 0;
  const t = setInterval(() => {
    nbOut.textContent = groupDigits(randomBigInt(0n, 10n ** BigInt(len) - 1n));
    nbOut.className = 'nbOut spinning' + (len > 30 ? ' huge' : len > 12 ? ' long' : '');
    sfx('pop');
    if (++spins >= 10) {
      clearInterval(t);
      nbRender(result);
      btn.disabled = false;
      sfx('win');
      if (result.toString().length <= 12) say(result.toString());
      nbHistory.unshift(result.toString());
      nbHistory = nbHistory.slice(0, 10);
      localStorage.setItem('nbHistory', JSON.stringify(nbHistory));
      nbDrawHistory();
    }
  }, 60);
};
function nbDrawHistory() {
  const ol = document.getElementById('nbHist');
  ol.innerHTML = '';
  nbHistory.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s.length > 40 ? groupDigits(BigInt(s.slice(0, 24))) + '… (' + s.length + ' цифр)' : groupDigits(BigInt(s));
    ol.appendChild(li);
  });
}
nbDrawHistory();

// ===== Звуковые кнопки =====
// Готовые кнопки. kind: 'fx' — звук-эффект (синтезатор), 'say' — телефон говорит слово.
// Чтобы добавить или поменять слово — допиши строку сюда, например:
//   { emoji: '🐶', label: 'Собака', kind: 'say', text: 'Гав-гав!' },
const SOUND_BUTTONS = [
  { emoji: '🥁', label: 'Бум',    kind: 'fx',  fx: 'boom' },
  { emoji: '🔔', label: 'Дзынь',  kind: 'fx',  fx: 'bell' },
  { emoji: '🚀', label: 'Пиу',    kind: 'fx',  fx: 'laser' },
  { emoji: '💨', label: 'Вжух',   kind: 'fx',  fx: 'whoosh' },
  { emoji: '👏', label: 'Хлоп',   kind: 'fx',  fx: 'clap' },
  { emoji: '🤸', label: 'Бойнг',  kind: 'fx',  fx: 'boing' },
  { emoji: '👋', label: 'Привет', kind: 'say', text: 'Привет!' },
  { emoji: '🎉', label: 'Ура',    kind: 'say', text: 'Ура-а-а!' },
  { emoji: '😮', label: 'Ой',     kind: 'say', text: 'Ой!' },
];
const SB_COLORS = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#2ec4b6', '#1982c4', '#6a4c93', '#ff6fb5'];
const SB_MAX_REC_MS = 5000;

// Звуки-эффекты: собираются из простых волн и шума
const SOUND_FX = {
  boom(ctx, t, out) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.5);
    g.gain.setValueAtTime(1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.65);
    noiseBurst(ctx, t, 0.08, 0.6, 'lowpass', 900, out);
  },
  bell(ctx, t, out) {
    [880, 1320, 2200].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.4 / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
      o.connect(g).connect(out); o.start(t); o.stop(t + 1.5);
    });
  },
  laser(ctx, t, out) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(180, t + 0.3);
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.35);
  },
  whoosh(ctx, t, out) {
    const src = noiseSource(ctx, 0.7), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.Q.value = 2;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(4000, t + 0.6);
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 0.25); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    src.connect(f).connect(g).connect(out); src.start(t);
  },
  clap(ctx, t, out) {
    [0, 0.012, 0.025].forEach(d => noiseBurst(ctx, t + d, 0.06, 0.8, 'highpass', 1200, out));
    noiseBurst(ctx, t + 0.03, 0.2, 0.3, 'bandpass', 1500, out);
  },
  boing(ctx, t, out) {
    const o = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(420, t + 0.5);
    lfo.frequency.value = 18; lg.gain.value = 40; lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    o.connect(g).connect(out); o.start(t); lfo.start(t); o.stop(t + 0.75); lfo.stop(t + 0.75);
  },
};
function noiseSource(ctx, dur) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf; return src;
}
function noiseBurst(ctx, t, dur, vol, type, freq, out) {
  const src = noiseSource(ctx, dur), f = ctx.createBiquadFilter(), g = ctx.createGain();
  f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(out); src.start(t);
}

let sbCustom = JSON.parse(localStorage.getItem('soundButtons') || '[]');
let sbEditing = false, sbCurrentAudio = null;
const sbGrid = document.getElementById('sbGrid');

// Звуковые кнопки звучат всегда — даже если музыка выключена кнопкой 🎵
function playSoundButton(b) {
  if (b.kind === 'fx') {
    const ctx = ensureAudio();
    if (ctx.state === 'suspended') ctx.resume();
    SOUND_FX[b.fx](ctx, ctx.currentTime + 0.01, ctx.destination);
  } else if (b.kind === 'say') {
    say(b.text);
  } else if (b.kind === 'rec' && b.audio) {
    if (sbCurrentAudio) sbCurrentAudio.pause();
    sbCurrentAudio = new Audio(b.audio);
    sbCurrentAudio.play();
  }
}

// ---------- Поле с кнопками: кнопки можно расставлять как удобно ----------
const SB_BOARD = 1600;            // размер поля (в пикселях) — по нему можно ездить во все стороны
const SB_SIZE = 110, SB_GAP = 14, SB_COLS = 5;
let sbPos = JSON.parse(localStorage.getItem('sbPositions') || '{}'); // где стоит каждая кнопка
let sbMoving = false;             // режим «✋ Двигать»
const sbKey = b => b.id ? 'my:' + b.id : 'base:' + b.label;
const sbSavePos = () => localStorage.setItem('sbPositions', JSON.stringify(sbPos));
// Место «по порядку»: ровные ряды по 5 кнопок посередине поля
function sbDefaultPos(i) {
  const cell = SB_SIZE + SB_GAP, x0 = (SB_BOARD - (SB_COLS * cell - SB_GAP)) / 2, y0 = SB_BOARD / 2 - 200;
  return [x0 + (i % SB_COLS) * cell, y0 + Math.floor(i / SB_COLS) * cell];
}
const sbClamp = v => Math.min(SB_BOARD - SB_SIZE, Math.max(0, v));

function sbDraw() {
  sbGrid.innerHTML = '';
  sbGrid.classList.toggle('moving', sbMoving);
  [...SOUND_BUTTONS, ...sbCustom].forEach((b, i) => {
    const el = document.createElement('button');
    el.className = 'sbBtn';
    el.style.background = b.color || SB_COLORS[i % SB_COLORS.length];
    el.innerHTML = '<span class="sbEmoji"></span><span class="sbLabel"></span>';
    el.querySelector('.sbEmoji').textContent = b.emoji || '🔊';
    el.querySelector('.sbLabel').textContent = b.label;
    const key = sbKey(b);
    const [x, y] = sbPos[key] || sbDefaultPos(i);
    el.style.left = x + 'px'; el.style.top = y + 'px';
    const isCustom = i >= SOUND_BUTTONS.length;
    if (sbEditing && isCustom) el.insertAdjacentHTML('beforeend', '<span class="sbDel">✕</span>');

    // ✋ Двигать: тащим кнопку пальцем, звука нет
    el.addEventListener('pointerdown', e => {
      if (!sbMoving) return;
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      const start = { px: e.clientX, py: e.clientY, x: parseFloat(el.style.left), y: parseFloat(el.style.top) };
      el.classList.add('dragging');
      const move = ev => {
        el.style.left = sbClamp(start.x + ev.clientX - start.px) + 'px';
        el.style.top = sbClamp(start.y + ev.clientY - start.py) + 'px';
      };
      const up = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        el.classList.remove('dragging');
        sbPos[key] = [Math.round(parseFloat(el.style.left)), Math.round(parseFloat(el.style.top))];
        sbSavePos();
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });

    // click, а не pointerdown: если палец двигает поле — кнопка не звучит, звучит только настоящее нажатие
    el.addEventListener('click', () => {
      if (sbPanned || sbMoving) return;
      if (sbEditing) {
        if (isCustom && confirm(`Удалить кнопку «${b.label}»?`)) {
          sbCustom = sbCustom.filter(x => x !== b);
          delete sbPos[key]; sbSavePos();
          localStorage.setItem('soundButtons', JSON.stringify(sbCustom));
          sbDraw();
        }
        return;
      }
      el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit');
      if (navigator.vibrate) navigator.vibrate(15);
      playSoundButton(b);
    });
    sbGrid.appendChild(el);
  });
}

// ---------- Большое поле: двигай вправо, влево, вверх и вниз ----------
// Пальцем поле листается само (прокрутка в обе стороны). Для мышки — тянем поле с зажатой кнопкой.
const sbScroll = document.getElementById('sbScroll');
let sbPan = null, sbPanned = false;
// Показать все кнопки: едем к середине того места, где они стоят
function sbCenter(smooth) {
  const btns = [...sbGrid.children];
  if (!btns.length) return;
  const xs = btns.map(b => parseFloat(b.style.left)), ys = btns.map(b => parseFloat(b.style.top));
  const cx = (Math.min(...xs) + Math.max(...xs) + SB_SIZE) / 2, top = Math.min(...ys);
  const h = Math.max(...ys) + SB_SIZE - top;
  sbScroll.scrollTo({
    left: cx - sbScroll.clientWidth / 2,
    top: h < sbScroll.clientHeight ? top + h / 2 - sbScroll.clientHeight / 2 : top - 20,
    behavior: smooth ? 'smooth' : 'auto',
  });
}
// Середина того места поля, которое сейчас видно на экране — туда ставим новую кнопку
function sbViewCenter() {
  return [sbClamp(Math.round(sbScroll.scrollLeft + sbScroll.clientWidth / 2 - SB_SIZE / 2)),
          sbClamp(Math.round(sbScroll.scrollTop + sbScroll.clientHeight / 2 - SB_SIZE / 2))];
}
document.getElementById('sbCenter').onclick = () => sbCenter(true);
document.querySelector('nav [data-screen=sounds]').addEventListener('click', () => requestAnimationFrame(() => sbCenter(false)));
sbScroll.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse') return;                 // на телефоне прокрутка пальцем работает сама
  if (sbMoving && e.target.closest('.sbBtn')) return;    // в режиме «Двигать» тащим кнопку, а не поле
  sbPan = { x: e.clientX, y: e.clientY, l: sbScroll.scrollLeft, t: sbScroll.scrollTop };
  sbPanned = false;
});
window.addEventListener('pointermove', e => {
  if (!sbPan) return;
  const dx = e.clientX - sbPan.x, dy = e.clientY - sbPan.y;
  if (Math.hypot(dx, dy) > 6) sbPanned = true;
  sbScroll.scrollLeft = sbPan.l - dx; sbScroll.scrollTop = sbPan.t - dy;
});
window.addEventListener('pointerup', () => { sbPan = null; setTimeout(() => { sbPanned = false; }, 0); });

document.getElementById('sbMove').onclick = e => {
  sbMoving = !sbMoving;
  if (sbMoving && sbEditing) document.getElementById('sbEdit').click();
  e.currentTarget.textContent = sbMoving ? '✅ Готово' : '✋ Двигать';
  document.getElementById('sbReset').hidden = !sbMoving;
  if (sbMoving) showToast('Тащи кнопки пальцем куда хочешь');
  sbDraw();
};
document.getElementById('sbReset').onclick = () => {
  if (!confirm('Расставить все кнопки ровными рядами?')) return;
  sbPos = {}; sbSavePos(); sbDraw(); sbCenter(true);
};
document.getElementById('sbEdit').onclick = e => {
  sbEditing = !sbEditing;
  if (sbEditing && sbMoving) document.getElementById('sbMove').click();
  e.currentTarget.textContent = sbEditing ? '✅ Готово' : '✏️ Изменить';
  if (sbEditing && !sbCustom.length) showToast('Удалять можно только свои кнопки');
  sbDraw();
};

// ---------- Своя кнопка: слово или запись голоса ----------
const sbDialog = document.getElementById('sbDialog');
let sbKind = 'say', sbRecorded = null, sbRecorder = null, sbRecTimer = null;
function sbSetKind(kind) {
  sbKind = kind;
  sbDialog.querySelectorAll('[data-kind]').forEach(el => {
    if (el.tagName === 'BUTTON') el.classList.toggle('sel', el.dataset.kind === kind);
    else el.hidden = el.dataset.kind !== kind;
  });
}
sbDialog.querySelectorAll('.sbKinds button').forEach(b => b.onclick = () => sbSetKind(b.dataset.kind));
document.getElementById('sbAdd').onclick = () => {
  ['sbEmoji', 'sbLabel', 'sbText'].forEach(id => { document.getElementById(id).value = ''; });
  sbRecorded = null;
  document.getElementById('sbPlay').hidden = true;
  document.getElementById('sbRecInfo').textContent = 'до 5 секунд';
  sbSetKind('say');
  sbDialog.hidden = false;
};
document.getElementById('sbCancel').onclick = () => { sbStopRec(); sbDialog.hidden = true; };
document.getElementById('sbTry').onclick = () => { const t = document.getElementById('sbText').value.trim(); if (t) say(t); };
document.getElementById('sbPlay').onclick = () => { if (sbRecorded) new Audio(sbRecorded).play(); };

document.getElementById('sbRec').onclick = async () => {
  if (sbRecorder) return sbStopRec();
  const info = document.getElementById('sbRecInfo');
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
  catch (e) { info.textContent = 'Нет доступа к микрофону — разреши его в настройках'; return; }
  const chunks = [];
  sbRecorder = new MediaRecorder(stream);
  sbRecorder.ondataavailable = e => chunks.push(e.data);
  sbRecorder.onstop = () => {
    stream.getTracks().forEach(t => t.stop());
    const reader = new FileReader();
    reader.onload = () => { sbRecorded = reader.result; document.getElementById('sbPlay').hidden = false; info.textContent = '✅ Записано!'; };
    reader.readAsDataURL(new Blob(chunks, { type: sbRecorder.mimeType }));
    sbRecorder = null;
    document.getElementById('sbRec').textContent = '🔴 Записать заново';
  };
  sbRecorder.start();
  document.getElementById('sbRec').textContent = '⏹ Стоп';
  const t0 = Date.now();
  sbRecTimer = setInterval(() => {
    const ms = Date.now() - t0;
    info.textContent = `Запись… ${(ms / 1000).toFixed(1)} с`;
    if (ms >= SB_MAX_REC_MS) sbStopRec();
  }, 100);
};
function sbStopRec() {
  clearInterval(sbRecTimer);
  if (sbRecorder && sbRecorder.state === 'recording') sbRecorder.stop();
}

document.getElementById('sbSave').onclick = () => {
  const label = document.getElementById('sbLabel').value.trim();
  const emoji = document.getElementById('sbEmoji').value.trim() || '🔊';
  const text = document.getElementById('sbText').value.trim();
  if (!label) return showToast('Напиши название кнопки');
  if (sbKind === 'say' && !text) return showToast('Напиши, что сказать');
  if (sbKind === 'rec' && !sbRecorded) return showToast('Сначала запиши звук');
  sbCustom.push({ id: Date.now(), emoji, label, kind: sbKind, text: sbKind === 'say' ? text : undefined,
                  audio: sbKind === 'rec' ? sbRecorded : undefined,
                  color: SB_COLORS[Math.floor(Math.random() * SB_COLORS.length)] });
  try { localStorage.setItem('soundButtons', JSON.stringify(sbCustom)); }
  catch (e) { sbCustom.pop(); return showToast('Память переполнена — удали старые кнопки'); }
  sbPos[sbKey(sbCustom.at(-1))] = sbViewCenter(); // новая кнопка — посередине экрана
  sbSavePos();
  sbDialog.hidden = true;
  sbDraw();
  showToast('🔊 Кнопка «' + label + '» добавлена');
};
sbDraw();

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

// ===== Музыка и звуки =====
// Мелодии сочинены для этого приложения и играются синтезатором прямо в браузере —
// никаких файлов скачивать не нужно. Ноты записаны номерами (60 = «до» первой октавы).
// null — пауза. Хочешь свою мелодию — допиши ещё один трек в TRACKS.
const TRACKS = {
  // Весёлая быстрая — для игр на скорость
  play: {
    bpm: 132, wave: 'square',
    melody: [ // 4 такта по 8 нот (восьмые)
      72, 76, 79, 76, 74, 76, 72, null,
      71, 74, 79, 74, 72, 74, 71, null,
      72, 76, 81, 79, 76, 74, 72, null,
      69, 72, 77, 76, 74, 72, 74, null,
    ],
    bass: [48, null, 55, null, 48, null, 55, null, 43, null, 50, null, 43, null, 50, null,
           45, null, 52, null, 45, null, 52, null, 41, null, 48, null, 41, null, 48, null],
    drums: true,
  },
  // Спокойная — чтобы думать и рисовать
  calm: {
    bpm: 84, wave: 'triangle',
    melody: [
      60, 64, 67, 72, 76, 72, 67, 64,
      57, 60, 64, 69, 72, 69, 64, 60,
      53, 57, 60, 65, 69, 65, 60, 57,
      55, 59, 62, 67, 71, 67, 62, 59,
    ],
    bass: [48, null, null, null, null, null, null, null, 45, null, null, null, null, null, null, null,
           41, null, null, null, null, null, null, null, 43, null, null, null, null, null, null, null],
    drums: false,
  },
};
// Какая музыка в каком режиме. null — без музыки (там говорит голос)
// Бесконечная — сочиняется сама на ходу: аккорды идут по кругу, а мелодия каждый раз новая,
// поэтому она никогда не заканчивается и не повторяется
TRACKS.endless = {
  bpm: 120, wave: 'square', drums: true, generate: true,
  chords: [  // ля-минор, фа, до, соль — по одному аккорду на такт (8 шагов)
    { bass: 45, notes: [69, 72, 76, 81] },
    { bass: 41, notes: [65, 69, 72, 77] },
    { bass: 48, notes: [67, 72, 76, 79] },
    { bass: 43, notes: [67, 71, 74, 79] },
  ],
  scale: [64, 67, 69, 72, 74, 76, 79, 81, 84], // пентатоника — любые ноты звучат дружно
};
let genLast = 72;
// Какая нота звучит на шаге step бесконечного трека
function generatedStep(t, step) {
  const pos = step % 8, chord = t.chords[Math.floor(step / 8) % t.chords.length];
  let mel = null;
  if (pos === 0) mel = chord.notes[Math.floor(Math.random() * chord.notes.length)]; // начало такта — нота аккорда
  else if (Math.random() < 0.7) {                                                     // иногда пауза
    const i = t.scale.indexOf(t.scale.reduce((a, b) => Math.abs(b - genLast) < Math.abs(a - genLast) ? b : a));
    const move = [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)];                // ходим плавно, по соседним нотам
    mel = t.scale[Math.min(t.scale.length - 1, Math.max(0, i + move))];
  }
  if (mel != null) genLast = mel;
  const bass = pos % 4 === 0 ? chord.bass : pos % 4 === 2 ? chord.bass + 7 : null;
  return { mel, bass };
}

const MUSIC_FOR = { dots: 'play', shapes: 'play', puzzles: 'calm', ideas: 'calm', draw: 'calm', lab: 'calm', colors: 'endless', moroz: null, studio: 'calm', products: 'calm', numbers: 'calm', sounds: null };
const MUSIC_VOLUME = 0.1;

let musicOn = localStorage.getItem('musicOn') !== '0';
let audioCtx = null, master = null, musicTrack = null, musicStep = 0, nextNoteTime = 0, currentScreen = 'dots';
const noteHz = n => 440 * 2 ** ((n - 69) / 12);

function ensureAudio() {
  if (audioCtx) return audioCtx;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  master = audioCtx.createGain();
  master.gain.value = MUSIC_VOLUME;
  master.connect(audioCtx.destination);
  return audioCtx;
}

function playTone(freq, start, dur, wave, vol, out) {
  const o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = wave; o.frequency.value = freq;
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(vol, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g); g.connect(out);
  o.start(start); o.stop(start + dur + 0.02);
}

function playDrum(start, accent) {
  const len = accent ? 0.12 : 0.04;
  const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * len, audioCtx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
  const src = audioCtx.createBufferSource(), g = audioCtx.createGain();
  src.buffer = buf; g.gain.value = accent ? 0.5 : 0.15;
  src.connect(g); g.connect(master); src.start(start);
  if (accent) playTone(110, start, 0.15, 'sine', 0.8, master); // «бум»
}

// Планировщик: заранее расставляет ноты на ближайшие 0.15 секунды
setInterval(() => {
  if (!audioCtx || !musicTrack || !musicOn) return;
  const t = TRACKS[musicTrack], stepDur = 60 / t.bpm / 2;
  // Пока приложение что-то говорит — музыка тише
  const talking = 'speechSynthesis' in window && speechSynthesis.speaking;
  master.gain.setTargetAtTime(talking ? MUSIC_VOLUME * 0.25 : MUSIC_VOLUME, audioCtx.currentTime, 0.1);
  if (nextNoteTime < audioCtx.currentTime) nextNoteTime = audioCtx.currentTime + 0.05;
  while (nextNoteTime < audioCtx.currentTime + 0.15) {
    const i = t.generate ? musicStep % 8 : musicStep % t.melody.length;
    const { mel, bass } = t.generate ? generatedStep(t, musicStep) : { mel: t.melody[i], bass: t.bass[i] };
    if (mel != null) playTone(noteHz(mel), nextNoteTime, stepDur * 0.9, t.wave, 0.35, master);
    if (bass != null) playTone(noteHz(bass), nextNoteTime, t.drums ? stepDur * 1.8 : stepDur * 7, 'triangle', 0.6, master);
    if (t.drums) playDrum(nextNoteTime, i % 4 === 0);
    nextNoteTime += stepDur;
    musicStep++;
  }
}, 25);

function setMusicForScreen(screen) {
  currentScreen = screen;
  const track = musicOn ? MUSIC_FOR[screen] ?? null : null;
  if (track !== musicTrack) { musicTrack = track; musicStep = 0; }
}

// ===== Звук у КАЖДОЙ кнопки — и у тех, что появятся потом =====
// Один обработчик на всё приложение: ловит нажатие на любую кнопку, даже созданную позже.
// Свой звук для кнопки: <button data-sound="bell">  — любое имя из SOUND_FX (boom, bell, laser,
// whoosh, clap, boing) или click / tab. Без звука: data-sound="none".
// Эти кнопки уже звучат сами — им второй звук не нужен:
const OWN_SOUND = '.dot, .sbBtn, #morozBtn, [data-sound="none"]';
const TAB_NOTES = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98]; // вкладки — ноты по порядку
const UI_SOUNDS = {
  click(ctx, t, out) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(1100, t); o.frequency.exponentialRampToValueAtTime(650, t + 0.06);
    g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.1);
  },
  tab(ctx, t, out, btn) {
    const i = [...btn.parentNode.children].indexOf(btn);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = noteHz(TAB_NOTES[i % TAB_NOTES.length]);
    g.gain.setValueAtTime(0.22, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    o.connect(g).connect(out); o.start(t); o.stop(t + 0.2);
  },
};
function buttonSound(btn) {
  if (!musicOn) return;                       // 🎵 выключена — все звуки выключены
  const ctx = ensureAudio();
  if (ctx.state === 'suspended') ctx.resume();
  const name = btn.dataset.sound || (btn.closest('nav') ? 'tab' : 'click');
  const play = UI_SOUNDS[name] || SOUND_FX[name] || UI_SOUNDS.click;
  play(ctx, ctx.currentTime + 0.005, ctx.destination, btn);
}
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('button, [role="button"], input[type="checkbox"]');
  if (!btn || btn.disabled || btn.matches(OWN_SOUND) || btn.closest(OWN_SOUND)) return;
  buttonSound(btn);
}, { capture: true });

// Короткие звуки: pop — попал, wrong — ошибка, win — победа
function sfx(kind) {
  if (!musicOn) return;
  ensureAudio();
  const t = audioCtx.currentTime, out = audioCtx.destination;
  if (kind === 'pop') playTone(600 + Math.random() * 500, t, 0.12, 'sine', 0.25, out);
  if (kind === 'wrong') { playTone(220, t, 0.15, 'sawtooth', 0.12, out); playTone(160, t + 0.12, 0.2, 'sawtooth', 0.12, out); }
  if (kind === 'win') [72, 76, 79, 84].forEach((n, k) => playTone(noteHz(n), t + k * 0.1, 0.25, 'triangle', 0.2, out));
}

const musicBtn = document.getElementById('musicBtn');
function updateMusicBtn() {
  musicBtn.textContent = musicOn ? '🎵' : '🔇';
  musicBtn.classList.toggle('off', !musicOn);
  musicBtn.setAttribute('aria-label', musicOn ? 'Выключить музыку' : 'Включить музыку');
}
musicBtn.onclick = () => {
  musicOn = !musicOn;
  localStorage.setItem('musicOn', musicOn ? '1' : '0');
  if (musicOn) { ensureAudio(); audioCtx.resume(); }
  setMusicForScreen(currentScreen);
  updateMusicBtn();
};
updateMusicBtn();

// Браузер разрешает звук только после первого касания — включаем музыку на первом нажатии
document.addEventListener('pointerdown', () => {
  if (!musicOn) return;
  ensureAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}, { capture: true });
// Свернули приложение — музыка на паузе
document.addEventListener('visibilitychange', () => {
  if (!audioCtx) return;
  if (document.hidden) audioCtx.suspend(); else if (musicOn) audioCtx.resume();
});
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => setMusicForScreen(b.dataset.screen)));
setMusicForScreen('dots');

// ===== Автообновление =====
// Установленное приложение само проверяет, нет ли новой версии на сайте,
// и если есть — перезагружается. Номер версии лежит в version.json (поднимает bash bump.sh).
const APP_VERSION = document.querySelector('meta[name="app-version"]').content;
document.getElementById('appVersion').textContent = 'версия ' + APP_VERSION;

async function checkForUpdate() {
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    const { v } = await r.json();
    if (String(v) === APP_VERSION) return;
    // GitHub выкладывает файлы не одновременно. Обновляемся, только когда ВСЕ файлы уже новые —
    // в каждом есть строчка /* build N */. Уникальный ?t= — чтобы не закешировать старую копию.
    for (const f of ['app.js', 'studio.js']) {
      const code = await (await fetch(`${f}?v=${v}&t=${Date.now()}`, { cache: 'no-store' })).text();
      if (!code.includes(`/* build ${v} */`)) return; // ещё выкладывается — проверим позже
    }
    // Защита от бесконечной перезагрузки: на каждую новую версию — не больше одной попытки
    if (sessionStorage.getItem('reloadedFor') === String(v)) return;
    sessionStorage.setItem('reloadedFor', v);
    sessionStorage.setItem('justUpdated', v);
    const reg = 'serviceWorker' in navigator && await navigator.serviceWorker.getRegistration();
    if (reg) await reg.update().catch(() => {});
    location.replace(location.pathname + '?v=' + v);
  } catch (e) { /* нет интернета — ничего страшного */ }
}

function showToast(text) {
  const t = document.getElementById('toast');
  t.textContent = text; t.hidden = false;
  setTimeout(() => { t.hidden = true; }, 3000);
}
if (sessionStorage.getItem('justUpdated') === APP_VERSION) {
  sessionStorage.removeItem('justUpdated');
  showToast('✨ Приложение обновлено до версии ' + APP_VERSION);
}

checkForUpdate();
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });
setInterval(checkForUpdate, 60000);

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' });
