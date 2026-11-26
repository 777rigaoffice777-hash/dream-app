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
