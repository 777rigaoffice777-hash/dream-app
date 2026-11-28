// Сборщик данных для викторины «Страны».
//   node tools/build-quiz.mjs          — собрать (уже скачанное не качает заново)
//   node tools/build-quiz.mjs --force  — скачать всё заново
// Берёт: флаги и гербы — из Викиданных/Викисклада (Wikimedia Commons),
//        очертания современных стран — Natural Earth (общественное достояние),
//        очертания исторических стран — historical-basemaps (A. Ourednik, GPL-3.0).
// Результат: quiz/data.json и картинки quiz/img/*.webp (сжатые, чтобы приложение весило мало).
// Нужен sharp для сжатия: cd tools && npm install
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { MODERN, HISTORICAL } from './quiz-list.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const CACHE = path.join(ROOT, 'tools', 'cache');
const RAW = path.join(CACHE, 'img');         // исходные картинки с Викисклада
const OUT = path.join(ROOT, 'quiz');
const IMG = path.join(OUT, 'img');           // сжатые картинки для приложения
const FORCE = process.argv.includes('--force');
const UA = { 'User-Agent': 'MasterskayaQuizBuilder/1.0 (educational kids app)' };
const IMG_WIDTH = 330;                       // такой размер Викисклад отдаёт быстрее всего
const OUT_SIZE = 240;                        // размер картинки в приложении
const sharp = createRequire(import.meta.url)('sharp');
fs.mkdirSync(IMG, { recursive: true });
fs.mkdirSync(RAW, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Вежливый запрос: если сервер просит подождать — ждём и пробуем снова
async function politeFetch(url) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: UA });
    if (res.ok) return res;
    const wait = (Number(res.headers.get('retry-after')) || 10 * (attempt + 1)) * 1000;
    console.log(`\n  сервер просит подождать (${res.status}), жду ${wait / 1000} с…`);
    await sleep(wait);
  }
  throw new Error('сервер не отвечает: ' + url.slice(0, 80));
}

// ---------- Викиданные: флаг, герб, русское название, годы ----------
// Ответы запоминаются в tools/cache/wikidata.json — чтобы не спрашивать одно и то же снова
async function wikidata(titles) {
  const file = path.join(CACHE, 'wikidata.json');
  const out = !FORCE && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  const need = titles.filter(t => !out[t]);
  for (let i = 0; i < need.length; i += 20) {
    const batch = need.slice(i, i + 20);
    const url = 'https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&sites=enwiki&props=claims|labels|sitelinks'
      + '&languages=ru&sitefilter=enwiki&titles=' + encodeURIComponent(batch.join('|'));
    const json = await (await politeFetch(url)).json();
    for (const e of Object.values(json.entities || {})) {
      if (!e.sitelinks) continue;
      out[e.sitelinks.enwiki.title] = { id: e.id, labels: e.labels,
        claims: Object.fromEntries(['P41', 'P94', 'P571', 'P576'].filter(p => e.claims[p]).map(p => [p, e.claims[p]])) };
    }
    fs.writeFileSync(file, JSON.stringify(out));
    await sleep(1000);
  }
  return out;
}
function pickValue(claims) {
  if (!claims) return null;
  const ok = claims.filter(c => c.rank !== 'deprecated' && c.mainsnak.datavalue);
  if (!ok.length) return null;
  const pref = ok.find(c => c.rank === 'preferred');
  if (pref) return pref.mainsnak.datavalue.value;
  const current = ok.filter(c => !(c.qualifiers && c.qualifiers.P582));
  return (current.length ? current[current.length - 1] : ok[ok.length - 1]).mainsnak.datavalue.value;
}
function year(claims) {
  const v = pickValue(claims);
  if (!v || !v.time) return null;
  return parseInt(v.time.slice(0, v.time.indexOf('-', 1)), 10);
}
const fmtYear = y => (y < 0 ? `${-y} до н. э.` : String(y));

// ---------- Картинки с Викисклада → сжатый WebP ----------
// Рядом с исходником лежит .src с именем файла: если файл на Викискладе другой — скачаем заново
async function download(file, name) {
  const srcNote = path.join(RAW, name + '.src');
  const old = ['.png', '.jpg', '.gif'].map(x => path.join(RAW, name + x)).find(f => fs.existsSync(f));
  let raw = old;
  if (old && !fs.existsSync(srcNote)) fs.writeFileSync(srcNote, file); // скачано раньше, до появления заметок
  if (!old || FORCE || fs.readFileSync(srcNote, 'utf8') !== file) {
    const res = await politeFetch(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${IMG_WIDTH}`);
    const type = res.headers.get('content-type') || '';
    const ext = type.includes('png') ? '.png' : type.includes('jpeg') ? '.jpg' : type.includes('gif') ? '.gif' : null;
    if (!ext) throw new Error('не картинка: ' + type);
    if (old) fs.unlinkSync(old);
    raw = path.join(RAW, name + ext);
    fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    fs.writeFileSync(srcNote, file);
    await sleep(700);
  }
  const out = path.join(IMG, name + '.webp');
  await sharp(raw).resize(OUT_SIZE, OUT_SIZE, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(out);
  return out;
}

// ---------- Очертания ----------
const geoCache = {};
function loadGeo(name) {
  if (!geoCache[name]) geoCache[name] = JSON.parse(fs.readFileSync(path.join(CACHE, name), 'utf8'));
  return geoCache[name];
}
function polygonsOf(features) {
  const polys = [];
  for (const f of features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon') polys.push(g.coordinates);
    if (g.type === 'MultiPolygon') polys.push(...g.coordinates);
  }
  return polys;
}
function ringArea(r) {
  let a = 0;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]);
  return Math.abs(a / 2);
}
function centroid(r) {
  let x = 0, y = 0;
  r.forEach(p => { x += p[0]; y += p[1]; });
  return [x / r.length, y / r.length];
}
// Упрощение линии (Дуглас — Пекер)
function simplify(pts, tol) {
  if (pts.length < 4) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let max = 0, idx = -1;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    for (let i = a + 1; i < b; i++) {
      // Контур замкнут (первая точка = последней) — тогда меряем расстояние до точки, а не до отрезка
      const d = len < 1e-9 ? Math.hypot(pts[i][0] - ax, pts[i][1] - ay)
        : Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / len;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol && idx > 0) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
// clip = [запад, юг, восток, север] — оставить только земли внутри этой рамки (например, без Гренландии)
// Основная территория страны: без крошечных островков и далёких владений за океаном.
// Возвращает многоугольники в градусах (geo) и в «плоских» координатах (proj), k — сжатие по долготе.
function mainPolys(features, clip) {
  let polys = polygonsOf(features);
  if (clip) polys = polys.filter(p => { const [x, y] = centroid(p[0]); return x >= clip[0] && y >= clip[1] && x <= clip[2] && y <= clip[3]; });
  if (!polys.length) return null;
  // Через линию смены дат (Чукотка, Аляска): переносим долготы, чтобы страна не разрывалась
  const lons = polys.flatMap(p => p[0].map(q => q[0]));
  if (Math.max(...lons) - Math.min(...lons) > 180) {
    polys = polys.map(p => p.map(r => r.map(([x, y]) => [x < 0 ? x + 360 : x, y])));
  }
  const lats = polys.flatMap(p => p[0].map(q => q[1]));
  const k = Math.cos(((Math.max(...lats) + Math.min(...lats)) / 2) * Math.PI / 180);
  const proj = polys.map(p => p.map(r => r.map(([x, y]) => [x * k, -y])));
  const areas = proj.map(p => ringArea(p[0]));
  const total = areas.reduce((s, a) => s + a, 0);
  const main = proj[areas.indexOf(Math.max(...areas))];
  const mc = centroid(main[0]), reach = 5 * Math.sqrt(total / Math.PI);
  const keep = proj.map((p, i) => areas[i] >= total * 0.003 && Math.hypot(centroid(p[0])[0] - mc[0], centroid(p[0])[1] - mc[1]) <= reach);
  return { geo: polys.filter((_, i) => keep[i]), proj: proj.filter((_, i) => keep[i]), k };
}
const ringPath = (r, f) => 'M' + r.map(([x, y]) => f(x, y)).join('L') + 'Z';

// Очертания: страна крупно, без карты вокруг
function outline(features, clip) {
  const m = mainPolys(features, clip);
  if (!m) return null;
  const polys = m.proj;
  const all = polys.flat(2);
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const minX = Math.min(...xs), minY = Math.min(...ys), w = Math.max(...xs) - minX, h = Math.max(...ys) - minY;
  const tol = Math.max(w, h) * 0.004;
  const s = 190 / Math.max(w, h);
  const W = Math.round(w * s + 10), H = Math.round(h * s + 10);
  const d = polys.map(p => p.map(r => {
    const sr = simplify(r, tol);
    return sr.length < 4 ? '' : ringPath(sr, (x, y) => `${((x - minX) * s + 5).toFixed(1)} ${((y - minY) * s + 5).toFixed(1)}`);
  }).join('')).join('');
  return d ? { d, w: W, h: H } : null;
}

// Расположение: кусок карты мира вокруг страны, страна закрашена.
// Координаты — градусы (x = долгота, y = −широта); vb — окно карты в «плоских» координатах, k — сжатие по долготе.
function locator(features, clip) {
  const m = mainPolys(features, clip);
  if (!m) return null;
  const pts = m.geo.flat(2);
  const lons = pts.map(p => p[0]), lats = pts.map(p => p[1]);
  const minLon = Math.min(...lons), maxLon = Math.max(...lons), minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const k = Math.max(0.35, m.k);
  const cx = (minLon + maxLon) / 2, cy = (minLat + maxLat) / 2;
  const wP = (maxLon - minLon) * k, hP = maxLat - minLat;
  // Окно 4:3 — страна занимает примерно половину, чтобы были видны соседи и моря
  const grow = Math.max(wP, hP) > 60 ? 1.3 : 2.2; // огромным странам (Россия) — окно поуже, чтобы страна была крупной
  const W = Math.min(330, Math.max(wP * grow, hP * grow * 4 / 3, 26)), H = W * 0.75;
  let y0 = -cy - H / 2;
  if (y0 < -84) y0 = -84;
  if (y0 + H > 84) y0 = 84 - H;
  const x0 = cx * k - W / 2;
  const tol = (W / k) * 0.0015;
  const d = m.geo.map(p => p.map(r => {
    const sr = simplify(r, tol);
    return sr.length < 4 ? '' : ringPath(sr, (x, y) => `${x.toFixed(2)} ${(-y).toFixed(2)}`);
  }).join('')).join('');
  if (!d) return null;
  const r2 = v => +v.toFixed(2);
  const loc = { d, vb: [r2(x0), r2(y0), r2(W), r2(H)], k: +k.toFixed(3) };
  // Маленькую страну обводим кружком, чтобы её было видно
  if (Math.max(wP, hP) < W * 0.07) loc.mark = [r2(cx), r2(-cy), r2(W * 0.06)];
  return loc;
}

// Фон для «Расположения»: суша и границы современных стран, один раз на весь мир
function worldPaths() {
  const land = polygonsOf(loadGeo('ne_50m_land.geojson').features)
    .map(p => p.map(r => { const sr = simplify(r, 0.08); return sr.length < 4 ? '' : ringPath(sr, (x, y) => `${x.toFixed(1)} ${(-y).toFixed(1)}`); }).join('')).join('');
  const lines = [];
  for (const f of loadGeo('ne_110m_admin_0_boundary_lines_land.geojson').features) {
    const g = f.geometry;
    for (const l of (g.type === 'LineString' ? [g.coordinates] : g.coordinates)) {
      const sl = simplify(l, 0.05);
      if (sl.length > 1) lines.push('M' + sl.map(([x, y]) => `${x.toFixed(1)} ${(-y).toFixed(1)}`).join('L'));
    }
  }
  return { land, borders: lines.join('') };
}

// ---------- Сборка ----------
const list = [...MODERN.map(x => ({ ...x, kind: 'modern' })), ...HISTORICAL.map(x => ({ ...x, kind: 'historical' }))];
console.log(`Стран в списке: ${list.length}. Спрашиваю Викиданные…`);
const wd = await wikidata(list.map(x => x.wiki));
const items = [], problems = [];
for (const c of list) {
  const e = wd[c.wiki];
  if (!e) { problems.push(`${c.key}: нет статьи «${c.wiki}» в Викиданных`); continue; }
  const cl = e.claims || {};
  const item = { key: c.key, kind: c.kind, name: c.name || (e.labels.ru && e.labels.ru.value) || c.wiki, qid: e.id, credits: {} };
  if (c.kind === 'historical') {
    const a = year(cl.P571), b = year(cl.P576);
    if (a != null || b != null) item.years = `${a != null ? fmtYear(a) : '?'} – ${b != null ? fmtYear(b) : '?'}`;
  }
  for (const [prop, kind] of [['P41', 'flag'], ['P94', 'arms']]) {
    const file = pickValue(cl[prop]) || c[kind + 'File'];
    if (!file) { problems.push(`${c.key}: нет ${kind === 'flag' ? 'флага' : 'герба'}`); continue; }
    try {
      const f = await download(file, `${c.key}-${kind}`);
      item[kind] = 'quiz/img/' + path.basename(f);
      item.credits[kind] = file;
    } catch (err) { problems.push(`${c.key}: ${kind} — ${err.message}`); }
  }
  try {
    const feats = c.ne ? loadGeo('ne_50m.geojson').features.filter(f => f.properties.ADM0_A3 === c.ne)
      : c.hb ? loadGeo(`world_${c.hb[0]}.geojson`).features.filter(f => f.properties.NAME === c.hb[1] || (!c.noColonies && f.properties.SUBJECTO === c.hb[1]))
      : null;
    if (feats) { item.outline = outline(feats, c.clip); item.locator = locator(feats, c.clip); }
    if ((c.ne || c.hb) && !item.outline) problems.push(`${c.key}: очертания не найдены`);
  } catch (err) { problems.push(`${c.key}: очертания — ${err.message}`); }
  items.push(item);
  process.stdout.write('.');
}
const data = {
  generated: new Date().toISOString().slice(0, 10),
  sources: {
    images: 'Флаги и гербы: Wikimedia Commons (файлы указаны у каждой страны в credits).',
    modern: 'Очертания современных стран: Natural Earth (naturalearthdata.com), общественное достояние.',
    world: 'Карта мира для «Расположения»: Natural Earth (naturalearthdata.com), общественное достояние.',
    historical: 'Очертания исторических стран: historical-basemaps, A. Ourednik (github.com/aourednik/historical-basemaps), лицензия GPL-3.0.',
  },
  world: worldPaths(),
  items,
};
fs.writeFileSync(path.join(OUT, 'data.json'), JSON.stringify(data));
console.log(`\nГотово: ${items.length} стран, данные — quiz/data.json (${Math.round(fs.statSync(path.join(OUT, 'data.json')).size / 1024)} КБ)`);
const stat = k => items.filter(i => i[k]).length;
console.log(`Флагов ${stat('flag')}, гербов ${stat('arms')}, очертаний ${stat('outline')}, расположений ${stat('locator')}`);
console.log(`Карта мира: суша ${Math.round(data.world.land.length / 1024)} КБ, границы ${Math.round(data.world.borders.length / 1024)} КБ`);
if (problems.length) console.log('Не хватает:\n  ' + problems.join('\n  '));
