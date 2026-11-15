'use strict';
const KEY = 'aquarius-breathe-v1';
const DEVICE = { puffs: 10000, ml: 20 };
const H = 3600e3, D = 24 * H;
const $ = s => document.querySelector(s);
const app = $('#app'), modal = $('#modal');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = n => Math.round(n).toLocaleString('ru-RU');
const pad = n => String(n).padStart(2, '0');
const plural = (n, a, b, c) => { n = Math.abs(n) % 100; const k = n % 10; return n > 10 && n < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c; };
const toLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function defaultQuit() {
  const n = new Date(); let d = new Date(n.getFullYear(), n.getMonth(), 17, 0, 0);
  if (d < n) d = new Date(n.getFullYear(), n.getMonth() + 1, 17, 0, 0);
  return toLocal(d);
}
const DEF = { setup: false, name: '', quit: defaultQuit(), price: 1500, days: 14, mg: 20, theme: 'base', log: [], wins: 0, best: 0, prep: {} };
let S = load(), page = 'home', timer = null;
function load() { try { return Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return Object.assign({}, DEF); } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { notice('Не получилось сохранить: браузер запретил хранение'); } }
function notice(t) { const n = $('#notice'); n.textContent = t; n.classList.add('show'); clearTimeout(notice.t); notice.t = setTimeout(() => n.classList.remove('show'), 2600); }

const quitAt = () => new Date(S.quit).getTime() || Date.now();
const elapsed = () => Math.max(0, Date.now() - quitAt());
const before = () => Date.now() < quitAt();
const calc = () => { const d = elapsed() / D, k = d / Math.max(1, S.days); return { money: k * S.price, puffs: k * DEVICE.puffs, nic: k * DEVICE.ml * S.mg }; };

const STAGES = [
  [20 / 60 * H, '20 минут', 'Пульс и давление начинают снижаться', 'Никотин перестаёт подстёгивать сердце и сосуды.'],
  [1 * D, '1 день', 'Первые сутки без никотина', 'Синдром отмены уже начался: раздражительность и тяга сейчас — это норма, а не слабость.'],
  [3 * D, '3 дня', 'Пик отмены позади', 'Самые сильные симптомы приходятся на первые 2–3 дня. Никотин практически вышел из крови.'],
  [7 * D, '1 неделя', 'Самая трудная неделя пройдена', 'Дальше интенсивность симптомов постепенно падает.'],
  [14 * D, '2 недели', 'Кровообращение начинает улучшаться', 'Физические симптомы отмены обычно заметно слабее.'],
  [28 * D, '4 недели', 'Симптомы отмены у большинства проходят', 'В среднем они длятся 3–4 недели. Привычка ещё может напоминать о себе.'],
  [56 * D, '8 недель', 'Дышать и двигаться легче', 'Функция лёгких и кровообращение продолжают улучшаться.'],
  [84 * D, '12 недель', 'Три месяца', 'Окно 2–12 недель, за которое улучшаются кровообращение и работа лёгких, пройдено.'],
  [270 * D, '9 месяцев', 'Кашля и одышки меньше', 'В период 1–9 месяцев кашель и одышка уменьшаются.'],
  [365 * D, '1 год', 'Год без никотина', 'Долгосрочных данных именно по вейпам пока мало, но зависимость позади — и это главное.']
];
const stagesDone = () => before() ? 0 : STAGES.filter(s => elapsed() >= s[0]).length;

const PREP = [
  ['tell', 'Сказать близким, что бросаю с 17-го'],
  ['bin', 'Убрать или выбросить все вейпы и зарядки к ним'],
  ['trig', 'Записать 3 ситуации, когда тянет сильнее всего'],
  ['swap', 'Запастись водой, жвачкой, яблоком или орехами'],
  ['plan', 'Придумать, чем занять руки и первые вечера'],
  ['doc', 'Узнать у врача или в аптеке про никотинзаместительную терапию']
];
const TRIGGERS = ['Стресс', 'Скука', 'После еды', 'Кофе', 'Алкоголь', 'Компания', 'Дорога', 'Перед сном', 'Другое'];
const TIPS = [
  'Тяга приходит волной и спадает сама. Задача — переждать пик, а не победить её навсегда.',
  'Выпей стакан воды маленькими глотками и смени место: выйди на балкон или пройдись.',
  'Заранее реши, что будешь делать в «вейп-моменты»: после еды, с кофе, в дороге.',
  'Раздражительность в первые недели — симптом отмены, а не характер. Она пройдёт.',
  'Хочется есть чаще — это ожидаемо. Держи под рукой яблоко или орехи.',
  'Один срыв не отменяет прожитые дни. Важно вернуться в тот же день.',
  'Короткая прогулка или лестница вверх-вниз снижают тягу лучше, чем сила воли.'
];

function fmtParts(ms) { const s = Math.floor(ms / 1000); return [Math.floor(s / 86400), Math.floor(s % 86400 / 3600), Math.floor(s % 3600 / 60), s % 60]; }
function fmtSpan(ms) { const [d, h, m] = fmtParts(ms); return d ? `${d} ${plural(d, 'день', 'дня', 'дней')} ${h} ч` : h ? `${h} ч ${m} мин` : `${m} мин`; }
const head = (eyebrow, title) => `<div class="topbar"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1></div><button class="round" data-nav="settings" aria-label="Настройки">⚙︎</button></div>`;
const box = (title, body, extra = '') => `<div class="card"><div class="cardhead"><h2>${title}</h2>${extra}</div>${body}</div>`;

function nextStage() { return STAGES.find(s => elapsed() < s[0]); }
function heroState() {
  const b = before(), ms = b ? quitAt() - Date.now() : elapsed(), n = nextStage();
  let line = '', pct = 0;
  if (b) { line = 'Подготовься заранее — так легче стартовать'; }
  else if (n) {
    const i = STAGES.indexOf(n), prev = i ? STAGES[i - 1][0] : 0;
    pct = Math.min(100, (elapsed() - prev) / (n[0] - prev) * 100);
    line = `Дальше: ${n[2].toLowerCase()} · через ${fmtSpan(n[0] - elapsed())}`;
  } else { pct = 100; line = 'Все этапы пройдены. Это теперь просто твоя жизнь.'; }
  return { b, parts: fmtParts(ms), line, pct };
}

function home() {
  const now = new Date(), h = heroState(), c = calc(), done = stagesDone(), b = h.b;
  const days = b ? Math.ceil((quitAt() - Date.now()) / D) : Math.floor(elapsed() / D);
  const hero = `<div class="card quote"><div class="eyebrow">${b ? 'до старта осталось' : 'без вейпа уже'}</div>
    <div class="timer">${['дней', 'часов', 'минут', 'секунд'].map((l, i) => `<div><b id="t${i}">${i ? pad(h.parts[i]) : h.parts[i]}</b><span>${l}</span></div>`).join('')}</div>
    <div class="bar"><i id="bar" style="width:${h.pct}%"></i></div>
    <div class="next"><span id="nextline">${esc(h.line)}</span><span>${b ? 'старт' : 'начало'}: ${new Date(quitAt()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</span></div></div>`;
  const date = `<div class="card datecard"><div class="datebig" id="bigdays">${days}</div><div><div class="month">${b ? plural(days, 'день', 'дня', 'дней') + ' до старта' : plural(days, 'день', 'дня', 'дней') + ' свободы'}</div><span>${b ? 'Не нужно быть идеальной.<br>Достаточно начать.' : 'Каждый день считается.<br>Даже трудный.'}</span></div></div>`;
  const stats = `<div class="stats">
    <div class="card stat"><div class="ico">₽</div><small>Сэкономлено</small><div class="bigmoney"><span id="s-money">${num(c.money)}</span> <small>₽</small></div></div>
    <div class="card stat"><div class="ico">∿</div><small>Не сделано затяжек</small><div class="bigmoney" id="s-puffs">${num(c.puffs)}</div></div>
    <div class="card stat"><div class="ico">♡</div><small>Восстановление</small><div class="bigmoney">${Math.round(done / STAGES.length * 100)}% <small>${done} из ${STAGES.length}</small></div></div>
    <div class="card stat"><div class="ico">✓</div><small>Побед над тягой</small><div class="bigmoney">${S.wins}</div></div></div>`;
  const sos = `<div class="card"><div class="sos"><div><h2>Накатила тяга?</h2><p class="muted">Она приходит волной и спадает за несколько минут. Дыхание и пауза помогают переждать пик.</p></div><button data-act="sos">SOS</button></div></div>
    <div class="row"><button class="danger" data-act="slip">Срыв</button><button class="ghost" data-act="craving">Записать тягу</button></div>`;
  const tip = box('На сегодня', `<p class="muted" style="margin:0">${TIPS[Math.floor(Date.now() / D) % TIPS.length]}</p>`);
  const prep = box('Подготовка к 17-му', PREP.map(([k, t]) => `<button class="pill ${S.prep[k] ? 'done' : ''}" data-prep="${k}"><span class="check">${S.prep[k] ? '✓' : ''}</span><span class="label">${t}</span></button>`).join(''));
  const upcoming = STAGES.filter(s => elapsed() < s[0] || b).slice(0, 3);
  const stages = box('Ближайшие этапы', upcoming.length ? upcoming.map((s, i) => `<div class="pill ${i ? 'pink' : ''}"><span class="label">${s[2]}<br><small>${s[1]}</small></span></div>`).join('') : '<div class="empty">Все этапы пройдены.</div>', '<button class="plain" data-nav="health">Все →</button>');
  const garden = `<div class="card garden"><div><span class="eyebrow">маленькая пауза</span><div class="breathe">≈</div><button data-act="sos">Подышать</button></div></div>`;
  const hello = S.name ? `${S.name}, ${b ? 'скоро начало' : 'в своём ритме'}` : (b ? 'Скоро начало' : 'В своём ритме');
  return head(now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }), hello) +
    `<div class="intro">${hero}${date}</div><div class="dashboard">` +
    (b ? `<div class="stack">${prep}</div><div class="stack">${sos}${tip}</div><div class="stack">${stats}${stages}</div>`
       : `<div class="stack">${stats}</div><div class="stack">${sos}${tip}</div><div class="stack">${stages}${garden}</div>`) + `</div>`;
}

function health() {
  const e = elapsed(), b = before(), n = nextStage();
  const steps = STAGES.map(s => { const yes = !b && e >= s[0], now = !b && s === n; return `<div class="step ${yes ? 'yes' : now ? 'now' : ''}"><div class="dot">${yes ? '✓' : ''}</div><div><div class="when">${s[1]}${now ? ' · через ' + fmtSpan(s[0] - e) : ''}</div><h3>${s[2]}</h3><p>${s[3]}</p></div></div>`; }).join('');
  const sym = ['Раздражительность, тревожность', 'Трудно сосредоточиться', 'Сон хуже обычного', 'Аппетит выше обычного', 'Подавленное настроение', 'Сильное желание затянуться'].map(t => `<div class="pill"><span class="label">${t}</span></div>`).join('');
  return head('восстановление', 'Что происходит с телом') + `<div class="grid2"><div class="card"><div class="cardhead"><h2>Этапы</h2><small>${stagesDone()} из ${STAGES.length}</small></div>${steps}</div>
    <div class="stack">${box('Синдром отмены — это нормально', `<p class="muted">Начинается через 4–24 часа после последней затяжки, сильнее всего на 2–3-й день, затем слабеет и у большинства проходит за 3–4 недели.</p>${sym}`)}
    ${box('Когда стоит обратиться к врачу', '<p class="muted" style="margin:0">Если подавленность или тревога сильные и не проходят, если тяга не даёт жить — врач может подобрать никотинзаместительную терапию (пластырь, жвачка, спрей) или другие средства. Это не «слабость», а самый рабочий способ. Бесплатная линия Минздрава по отказу от никотина: <a href="tel:88002000200">8 800 200-0-200</a>.</p>')}
    <p class="footnote">Сроки взяты из данных ВОЗ и NHS об отказе от никотина и табака. У каждого организм идёт в своём темпе — это ориентиры, а не диагноз.</p></div></div>`;
}

function diary() {
  const cr = S.log.filter(x => x.type === 'craving' || x.type === 'win'), count = {};
  cr.forEach(x => { if (x.trig) count[x.trig] = (count[x.trig] || 0) + 1; });
  const top = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const names = { craving: 'тяга', win: 'победа', slip: 'срыв' };
  const list = S.log.length ? S.log.slice().reverse().map(x => `<div class="entry"><div class="dot check">${x.type === 'win' ? '✓' : x.type === 'slip' ? '·' : '∿'}</div><div class="body"><div class="tag">${new Date(x.t).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · ${names[x.type]}${x.lv ? ' · сила ' + x.lv + '/5' : ''}${x.trig ? ' · ' + esc(x.trig) : ''}</div>${x.note ? esc(x.note) : ''}</div><button class="plain" data-del="${x.t}" aria-label="Удалить запись">×</button></div>`).join('') : '<div class="empty">Пока пусто. Записывай каждую волну тяги — через неделю будет видно, что её запускает.</div>';
  return head('дневник', 'Тяга и триггеры') + `<div class="grid2"><div class="stack">
    <div class="card"><div class="sos"><div><h2>Тянет прямо сейчас?</h2><p class="muted">Три минуты дыхания. Чаще всего этого хватает.</p></div><button data-act="sos">SOS</button></div></div>
    <div class="row"><button data-act="craving">＋ Записать тягу</button><button class="danger" data-act="slip">Срыв</button></div>
    ${box('Что запускает тягу', top.length ? top.map(([k, v]) => `<div class="pill pink"><span class="label">${esc(k)}</span><b>${v}</b></div>`).join('') : '<div class="empty">Появится после первых записей.</div>')}
    ${box('Итого', `<div class="two"><div><small>Побед над тягой</small><div class="bigmoney">${S.wins}</div></div><div><small>Лучшая серия</small><div class="bigmoney">${fmtSpan(Math.max(S.best, elapsed()))}</div></div></div>`)}
    </div><div class="card"><div class="cardhead"><h2>Записи</h2><small>${S.log.length}</small></div>${list}</div></div>`;
}

function facts() {
  const total = DEVICE.ml * S.mg, f = (n, t, p) => `<div class="card fact"><span class="n">${n}</span><h3>${t}</h3><p>${p}</p></div>`;
  return head('без запугивания, по источникам', 'Что важно знать') + `<div class="grid">
    ${f('≈ ' + num(total) + ' мг', 'никотина в одной Lost Mary MO10000', `18–20 мл жидкости на солевом никотине, заявлено до 10 000 затяжек. Крепость зависит от партии: 20 мг/мл (2%) или 50 мг/мл (5%). Сейчас в расчётах ${S.mg} мг/мл — поменять можно в настройках.`)}
    ${f('1–2 мг', 'усваивается с одной сигареты', `Грубая оценка: по содержанию никотина одна такая одноразка сравнима с ${num(total / 2)}–${num(total)} сигаретами. В кровь попадает не всё, поэтому это верхняя граница, а не точная цифра.`)}
    ${f('соль', 'мягче горлу — легче перебрать', 'Солевой никотин меньше раздражает горло и даёт более высокий уровень никотина в крови, чем обычный той же крепости. Поэтому затяжек получается больше, чем кажется.')}
    ${f('пульс ↑', 'сердце и сосуды', 'Никотин учащает пульс, повышает давление и раздражает сосуды. Исследования связывают вейпинг с повышенным риском сердечно-сосудистых заболеваний.')}
    ${f('не пар', 'а аэрозоль', 'В нём находят никотин, тяжёлые металлы, летучие органические соединения; при перегреве образуется формальдегид. Пропиленгликоль и глицерин безопасны в еде, но не признаны безопасными для вдыхания.')}
    ${f('лёгкие', 'дыхательные пути', 'Вейпинг связывают с обострением астмы, более частыми бронхитами и инфекциями, раздражением дыхательных путей.')}
    ${f('?', 'долгосрочный эффект неизвестен', 'ВОЗ: вейпы вредны и небезопасны, но о последствиях через 20–30 лет судить рано — их просто ещё не успели изучить.')}
    ${f('3–4 нед.', 'длится синдром отмены', 'Пик — первые 3 дня, первая неделя самая тяжёлая. Потом легче с каждым днём. Желание затянуться «по привычке» может всплывать дольше.')}
    ${f('НЗТ', 'помощь, а не поражение', 'Никотиновый пластырь, жвачка или спрей снижают тягу и симптомы отмены. Подбирать лучше с врачом или фармацевтом. Сигареты вместо вейпа — не замена.')}
    </div><div class="card" style="margin-top:18px"><h2>Источники</h2><div class="src">
    <a href="https://www.who.int/news-room/questions-and-answers/item/tobacco-e-cigarettes" target="_blank" rel="noopener">ВОЗ — электронные сигареты</a><br>
    <a href="https://www.who.int/news-room/questions-and-answers/item/tobacco-health-benefits-of-smoking-cessation" target="_blank" rel="noopener">ВОЗ — что меняется после отказа</a><br>
    <a href="https://www.cancer.gov/about-cancer/causes-prevention/risk/tobacco/withdrawal-fact-sheet" target="_blank" rel="noopener">NCI — синдром отмены никотина</a><br>
    <a href="https://www.nhs.uk/better-health/quit-smoking/staying-smoke-free/managing-nicotine-withdrawal-symptoms" target="_blank" rel="noopener">NHS — как пережить отмену</a><br>
    <a href="https://www.cancer.org/cancer/risk-prevention/tobacco/e-cigarettes-vaping.html" target="_blank" rel="noopener">American Cancer Society — риски вейпинга</a><br>
    <a href="https://pubmed.ncbi.nlm.nih.gov/38597729" target="_blank" rel="noopener">Исследование: солевой и обычный никотин</a><br>
    <a href="https://smokefree.gov/quit-vaping-resources/dealing-with-vape-cravings" target="_blank" rel="noopener">Smokefree.gov — как справляться с тягой</a>
    </div><p class="footnote">Приложение не заменяет врача. Беременность, болезни сердца, приём лекарств — повод обсудить отказ со специалистом.</p></div>`;
}

const profileFields = () => `<label>Как тебя зовут<input name="name" maxlength="30" value="${esc(S.name)}" placeholder="Имя"></label>
  <label>Дата и время старта<input name="quit" type="datetime-local" required value="${esc(S.quit)}"></label>
  <div class="two"><label>Цена одной одноразки, ₽<input name="price" type="number" inputmode="numeric" min="0" max="100000" required value="${S.price}"></label>
  <label>На сколько дней её хватает<input name="days" type="number" inputmode="numeric" min="1" max="365" required value="${S.days}"></label></div>
  <label>Крепость на упаковке<select name="mg"><option value="20" ${S.mg == 20 ? 'selected' : ''}>20 мг/мл (2%)</option><option value="50" ${S.mg == 50 ? 'selected' : ''}>50 мг/мл (5%)</option></select></label>`;

function settings() {
  const themes = [['base', 'Туман'], ['rose', 'Роза'], ['aqua', 'Аква'], ['lime', 'Лайм'], ['night', 'Ночь']];
  return head('настройки', 'Под себя') + `<div class="settings">
    <form class="card" data-form="profile"><h2>Мои данные</h2>${profileFields()}<div class="formactions"><button>Сохранить</button></div></form>
    <div class="card"><h2>Оформление</h2><div class="themes">${themes.map(([k, t]) => `<button class="theme ${S.theme === k ? 'on' : ''}" data-set="${k}">${t}</button>`).join('')}</div></div>
    <div class="card"><h2>Данные</h2><p class="muted">Всё хранится только на этом устройстве, в браузере. Никуда не отправляется.</p><div class="row"><button class="ghost" data-act="export">Сохранить копию</button><button class="danger" data-act="reset">Стереть всё</button></div></div>
    <div class="card"><h2>На экран «Домой»</h2><p class="muted" style="margin:0">iPhone: открой в Safari → «Поделиться» → «На экран Домой». Откроется как обычное приложение, без адресной строки.</p></div></div>`;
}

function welcome() {
  return `<form class="auth" data-form="setup"><div class="brand">aquarius<span>≈</span></div><h1>Свободное дыхание</h1><p>Спокойный помощник, чтобы бросить вейп. Пара вопросов — и начнём. Всё можно поменять позже.</p>${profileFields()}<button>Начать</button><p class="footnote">Данные остаются только на этом устройстве.</p></form>`;
}

const NAV = [['home', '☼', 'Сегодня'], ['health', '♡', 'Тело'], ['diary', '∿', 'Тяга'], ['facts', '✦', 'Знать'], ['settings', '⚙︎', 'Настройки']];
const PAGES = { home, health, diary, facts, settings };
function draw(anim) {
  document.body.dataset.theme = S.theme;
  const tc = getComputedStyle(document.body).getPropertyValue('--bg').trim(); if (tc) $('meta[name=theme-color]').content = tc;
  if (!S.setup) { app.innerHTML = welcome(); return; }
  const typing = app.contains(document.activeElement) && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) ? document.activeElement.name : '';
  app.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand">aquarius<span>≈</span></div><nav class="nav" aria-label="Разделы">${NAV.map(([k, i, t]) => `<button data-nav="${k}" class="${page === k ? 'active' : ''}"><span class="ico">${i}</span>${t}</button>`).join('')}</nav><div class="sidefoot"><span>${esc(S.name || 'личное')} · личное</span><span>пусть всё идёт в своём темпе</span></div></aside><main class="${anim ? 'enter' : ''}">${PAGES[page]()}</main></div>`;
  if (typing) { const el = app.querySelector(`[name="${typing}"]`); if (el) el.focus({ preventScroll: true }); }
}

let lastDone = -1, lastBefore = null;
function tick() {
  if (!S.setup) return;
  const d = stagesDone(), b = before();
  const busy = modal.open || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  if ((d !== lastDone || b !== lastBefore) && lastDone !== -1 && !busy) { lastDone = d; lastBefore = b; draw(); if (d > 0 && !b) notice('Новый этап: ' + STAGES[d - 1][2]); return; }
  lastDone = d; lastBefore = b;
  if (page !== 'home' || !$('#t0')) return;
  const h = heroState(), c = calc();
  h.parts.forEach((v, i) => { $('#t' + i).textContent = i ? pad(v) : v; });
  $('#bar').style.width = h.pct + '%'; $('#nextline').textContent = h.line;
  $('#s-money').textContent = num(c.money); $('#s-puffs').textContent = num(c.puffs);
  $('#bigdays').textContent = b ? Math.ceil((quitAt() - Date.now()) / D) : Math.floor(elapsed() / D);
}

function openModal(html) { modal.innerHTML = html; if (!modal.open) modal.showModal(); }
function closeModal() { clearInterval(timer); timer = null; if (modal.open) modal.close(); }
modal.addEventListener('close', () => { clearInterval(timer); timer = null; });
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

function sos() {
  let left = 180; const phase = t => (t % 10) < 4 ? 'вдох' : 'выдох';
  openModal(`<div class="sosbox"><div class="modalhead"><h2>Переждём вместе</h2><button class="round" data-act="close" aria-label="Закрыть">×</button></div>
    <p class="muted">Вдох носом на 4 счёта, медленный выдох ртом на 6. Тяга — это волна, она уже идёт на спад.</p>
    <div class="breathe" id="ph">вдох</div><div class="clock" id="clock">3:00</div>
    <p class="muted" style="margin-top:14px">Потом: стакан воды, сменить место, написать близкому.</p>
    <div class="formactions" style="justify-content:center"><button data-act="won">Я справилась</button><button class="ghost" data-act="close">Закрыть</button></div></div>`);
  const t0 = Date.now();
  timer = setInterval(() => {
    const s = Math.floor((Date.now() - t0) / 1000); left = Math.max(0, 180 - s);
    const c = $('#clock'), p = $('#ph'); if (!c) return;
    c.textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`; p.textContent = left ? phase(s) : '≈';
    if (!left) { clearInterval(timer); c.textContent = 'Волна прошла'; }
  }, 250);
}
function cravingForm() {
  openModal(`<form data-form="craving"><div class="modalhead"><h2>Записать тягу</h2><button type="button" class="round" data-act="close" aria-label="Закрыть">×</button></div>
    <label>Насколько сильно<div class="lv" style="margin-top:6px">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-lv="${n}" class="${n === 3 ? 'on' : ''}">${n}</button>`).join('')}</div><input type="hidden" name="lv" value="3"></label>
    <label>Что запустило<select name="trig">${TRIGGERS.map(t => `<option>${t}</option>`).join('')}</select></label>
    <label>Заметка<textarea name="note" maxlength="400" placeholder="Где была, что чувствовала"></textarea></label>
    <div class="formactions"><button type="submit" name="k" value="craving" class="ghost">Просто записать</button><button type="submit" name="k" value="win">Справилась ✓</button></div></form>`);
}
function slipForm() {
  openModal(`<form data-form="slip"><div class="modalhead"><h2>Срыв — не провал</h2><button type="button" class="round" data-act="close" aria-label="Закрыть">×</button></div>
    <p class="muted">Срывы случаются у большинства, особенно на стрессе. Прожитые дни никуда не делись. Главное — вернуться сегодня же.</p>
    <label>Что произошло<textarea name="note" maxlength="400" placeholder="Что запустило? Что можно сделать иначе в следующий раз?"></textarea></label>
    <div class="formactions"><button type="submit" name="k" value="keep" class="ghost">Только записать</button><button type="submit" name="k" value="reset" class="danger">Начать отсчёт заново</button></div></form>`);
}

document.addEventListener('click', e => {
  const t = e.target.closest('[data-nav],[data-act],[data-prep],[data-set],[data-del],[data-lv]'); if (!t) return;
  const d = t.dataset;
  if (d.nav) { if (d.nav === page) return; page = d.nav; draw(true); window.scrollTo(0, 0); }
  else if (d.prep) { S.prep[d.prep] = !S.prep[d.prep]; save(); draw(); }
  else if (d.set) { S.theme = d.set; save(); draw(); }
  else if (d.del) { if (confirm('Удалить запись?')) { const x = S.log.find(x => String(x.t) === d.del); if (x && x.type === 'win') S.wins = Math.max(0, S.wins - 1); S.log = S.log.filter(x => String(x.t) !== d.del); save(); draw(); } }
  else if (d.lv) { t.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === t)); t.closest('form').elements.lv.value = d.lv; }
  else if (d.act === 'sos') sos();
  else if (d.act === 'craving') cravingForm();
  else if (d.act === 'slip') slipForm();
  else if (d.act === 'close') closeModal();
  else if (d.act === 'won') { S.wins++; S.log.push({ t: Date.now(), type: 'win', note: 'Переждала с дыханием' }); save(); closeModal(); draw(); notice('Победа над тягой засчитана'); }
  else if (d.act === 'export') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' })); a.download = 'aquarius-backup.json'; a.click(); }
  else if (d.act === 'reset') { if (confirm('Стереть все данные на этом устройстве? Отменить нельзя.')) { try { localStorage.removeItem(KEY); } catch (e) {} S = load(); page = 'home'; draw(); } }
});

document.addEventListener('submit', e => {
  const f = e.target, kind = f.dataset.form; if (!kind) return; e.preventDefault();
  const v = Object.fromEntries(new FormData(f)), k = e.submitter && e.submitter.value;
  if (kind === 'setup' || kind === 'profile') {
    if (!v.quit || isNaN(new Date(v.quit))) return notice('Укажи дату старта');
    Object.assign(S, { name: v.name.trim(), quit: v.quit, price: Math.max(0, +v.price || 0), days: Math.max(1, +v.days || 1), mg: +v.mg === 50 ? 50 : 20, setup: true });
    save(); if (kind === 'setup') page = 'home'; draw(kind === 'setup'); if (kind === 'profile') notice('Сохранено');
  } else if (kind === 'craving') {
    const win = k === 'win'; if (win) S.wins++;
    S.log.push({ t: Date.now(), type: win ? 'win' : 'craving', lv: +v.lv || 3, trig: v.trig, note: v.note.trim() });
    save(); closeModal(); draw(); notice(win ? 'Победа засчитана' : 'Записано');
  } else if (kind === 'slip') {
    S.log.push({ t: Date.now(), type: 'slip', note: v.note.trim() });
    if (k === 'reset') { S.best = Math.max(S.best, elapsed()); S.quit = toLocal(new Date()); }
    save(); closeModal(); draw(); notice(k === 'reset' ? 'Отсчёт начат заново. Ты уже снова в пути.' : 'Записано. Идём дальше.');
  }
});

draw(true); setInterval(tick, 1000);
