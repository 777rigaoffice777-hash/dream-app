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
    task: 'Открывай по две карточки и найди одинаковые.',
    render: (board, win) => memoryPuzzle(board, win, ['🎅', '🎄', '⭐'], 3),
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
    render: (board, win) => memoryPuzzle(board, win, ['🎅', '🎄', '⭐', '❄️', '🎁', '⛄'], 4),
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
    render: (board, win) => memoryPuzzle(board, win, ['🎅', '🎄', '⭐', '❄️', '🎁', '⛄', '🦌', '🔔'], 4),
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

// ---------- Угадай картинку ----------
// Картинка закрыта плитками, они открываются по одной. Угадай как можно раньше!
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
const REVEAL_EVERY_MS = 1500; // как часто открывается плитка

function pictureGuess(board, win, item) {
  const wrap = document.createElement('div');
  wrap.className = 'picWrap';
  wrap.innerHTML = `<div class="picEmoji">${item.pic}</div><div class="picCover"></div>`;
  board.appendChild(wrap);
  const cover = wrap.querySelector('.picCover');
  const tiles = [...Array(9)].map(() => {
    const t = document.createElement('div');
    t.textContent = '?';
    cover.appendChild(t);
    return t;
  });
  let order = shuffle([...tiles.keys()]), done = false;
  const openOne = () => { const i = order.pop(); if (i !== undefined) tiles[i].classList.add('gone'); };
  const openAll = () => { while (order.length) openOne(); };

  const timer = setInterval(() => {
    if (!wrap.isConnected || done) return clearInterval(timer);   // ушли с этой картинки
    if (!document.getElementById('puzzles').classList.contains('active') || document.hidden) return;
    openOne();
  }, REVEAL_EVERY_MS);

  const others = shuffle(PICTURES.filter(p => p !== item)).slice(0, 3).map(p => p.name);
  const answers = document.createElement('div');
  answers.className = 'picAnswers';
  board.appendChild(answers);
  shuffle([item.name, ...others]).forEach(name => {
    const b = document.createElement('button');
    b.className = 'pzItem text';
    b.textContent = name;
    b.onclick = () => {
      if (done) return;
      if (name === item.name) {
        done = true;
        const closed = order.length;   // сколько плиток ещё было закрыто
        openAll();
        b.classList.add('good');
        win();
        pzMsg.textContent = closed >= 6 ? '🦅 Орлиный глаз! Угадал почти сразу!'
                          : closed >= 3 ? '🎉 Отлично! Быстро угадал!'
                          : '🎉 Угадал! Это ' + item.name.toLowerCase() + '!';
      } else {
        b.classList.remove('bad'); void b.offsetWidth; b.classList.add('bad');
        if (navigator.vibrate) navigator.vibrate(80);
        openOne(); openOne();          // ошибка — открываем подсказку
      }
    };
    answers.appendChild(b);
  });
}

PICTURES.forEach(item => PUZZLES.push({
  level: 'pictures', title: 'Угадай картинку',
  task: 'Что спрятано под плитками? Угадай как можно раньше!',
  render: (board, win) => pictureGuess(board, win, item),
}));

const LEVEL_NAMES = { easy: 'Лёгкие', medium: 'Средние', hard: 'Сложные', expert: 'Очень сложные', pictures: '🖼️ Угадай картинку' };
let pzIndex = 0;
let pzSolved = JSON.parse(localStorage.getItem('pzSolved') || '[]');
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
