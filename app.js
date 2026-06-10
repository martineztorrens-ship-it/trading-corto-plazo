const STORAGE_KEY = 'acciones_corto_plazo_data';

let DATA = null;

async function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    DATA = JSON.parse(saved);
    return;
  }
  const res = await fetch('data.json');
  DATA = await res.json();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

/* ===================== RENDER: HEADER ===================== */
function renderHeader() {
  document.getElementById('objetivo').textContent = DATA.objetivo;
  document.getElementById('weekRange').textContent = DATA.weekRange;
  document.getElementById('updated').textContent = DATA.updated;
}

/* ===================== RENDER: PICKS ===================== */
function renderPicks() {
  const row = document.getElementById('picksRow');
  row.innerHTML = '';
  DATA.picks.forEach(pick => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-header" style="background:${pick.color}">
        <div>
          <div class="ticker">${escapeHtml(pick.ticker)}</div>
          <div class="company">${escapeHtml(pick.company)}</div>
        </div>
        <div class="rank-badge">
          <span>RANKING</span>
          <strong>#${pick.rank}</strong>
        </div>
      </div>
      <div class="card-body">
        <div class="levels-grid">
          <div class="level-box buy">
            <div class="lbl">💚 COMPRA</div>
            <div class="val">${escapeHtml(pick.buy)}</div>
            <div class="sub">Zona de entrada</div>
          </div>
          <div class="level-box target">
            <div class="lbl">🎯 OBJETIVO</div>
            <div class="val">${escapeHtml(pick.target)}</div>
            <div class="sub">Toma de ganancias</div>
          </div>
          <div class="level-box stop">
            <div class="lbl">🛑 STOP LOSS</div>
            <div class="val">${escapeHtml(pick.stop)}</div>
            <div class="sub">Cortar pérdidas</div>
          </div>
        </div>
        <div class="upside-bar">
          <div class="upside-label">UPSIDE POTENCIAL</div>
          <div class="upside-track"><div class="upside-fill" style="width:${pick.upsidePct}%; background:${pick.color}"></div></div>
          <div class="upside-pct" style="color:${pick.color}">${escapeHtml(pick.upside)}</div>
        </div>
        <div class="reason-box" style="border-left-color:${pick.color}">${escapeHtml(pick.reason)}</div>
        <table class="mini-table">
          <tr><td>Ratio R/R</td><td>${escapeHtml(pick.rrRatio)}</td></tr>
          <tr><td>Catalizador</td><td>${escapeHtml(pick.catalizador)}</td></tr>
          <tr><td>Analistas</td><td>${escapeHtml(pick.analistas)}</td></tr>
        </table>
      </div>
    `;
    row.appendChild(card);
  });
}

/* ===================== RENDER: CALENDAR ===================== */
function renderCalendar() {
  const row = document.getElementById('calendarRow');
  row.innerHTML = '';
  DATA.calendar.forEach(day => {
    const div = document.createElement('div');
    div.className = `cal-day day-${day.type}`;
    div.innerHTML = `
      <div class="day-header">${escapeHtml(day.day)}</div>
      <div class="day-date">${day.date}</div>
      <div class="day-actions">${day.items.map(i => `<div>${i}</div>`).join('')}</div>
    `;
    row.appendChild(div);
  });
}

/* ===================== RENDER: RULES ===================== */
function renderRules() {
  const row = document.getElementById('rulesRow');
  row.innerHTML = '';
  DATA.picks.forEach(pick => {
    const box = document.createElement('div');
    box.className = 'rules-box';
    box.innerHTML = `
      <div class="rules-header">📊 RESUMEN ${escapeHtml(pick.ticker)} — ${escapeHtml(pick.company.split('·')[0].trim())}</div>
      <table>
        <tr><td>Entrada</td><td class="td-green">${escapeHtml(pick.buy)}</td></tr>
        <tr><td>Objetivo</td><td class="td-blue">${escapeHtml(pick.target)}</td></tr>
        <tr><td>Stop-loss</td><td class="td-red">${escapeHtml(pick.stop)}</td></tr>
        <tr><td>Upside</td><td>${escapeHtml(pick.upside)}</td></tr>
        <tr><td>Ratio R/R</td><td>${escapeHtml(pick.rrRatio)}</td></tr>
        <tr><td>Catalizador</td><td>${escapeHtml(pick.catalizador)}</td></tr>
        <tr><td>Analistas</td><td>${escapeHtml(pick.analistas)}</td></tr>
      </table>
    `;
    row.appendChild(box);
  });
}

/* ===================== RENDER: HISTORIAL ===================== */
const STATUS_LABELS = {
  active:  { label: '⚡ ACTIVA', cls: 'status-active' },
  win:     { label: '✅ GANADA', cls: 'status-win' },
  loss:    { label: '❌ STOP', cls: 'status-loss' },
  expired: { label: '🕐 VENCIDA', cls: 'status-expired' }
};

const ROW_CLASS = {
  active: 'row-active',
  win: 'row-win',
  loss: 'row-stop',
  expired: 'row-empty'
};

function renderHistorial() {
  const body = document.getElementById('histBody');
  body.innerHTML = '';

  document.getElementById('pnlInvBadge').textContent = `$${(DATA.investmentPerTrade/1000).toFixed(0)}K`;
  document.getElementById('pnlInvTitle').textContent = DATA.investmentPerTrade.toLocaleString();

  const activeCount = DATA.historial.filter(h => h.status === 'active').length;
  document.getElementById('activeCount').textContent = `${activeCount} / 10`;

  DATA.historial.forEach((h, idx) => {
    const tr = document.createElement('tr');
    tr.className = ROW_CLASS[h.status] || 'row-active';

    const statusInfo = STATUS_LABELS[h.status] || STATUS_LABELS.active;
    const statusOptions = Object.entries(STATUS_LABELS)
      .map(([k, v]) => `<option value="${k}" ${k === h.status ? 'selected' : ''}>${v.label}</option>`)
      .join('');

    let pnlCell;
    if (h.pnl === null || h.pnl === undefined) {
      pnlCell = `<span class="pnl-pend">— Pendiente —</span>`;
    } else {
      const pnlClass = h.pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
      const sign = h.pnl >= 0 ? '+' : '';
      pnlCell = `
        <span class="${pnlClass}">${sign}$${h.pnl}</span>
        <span class="pnl-sub">${sign}${h.pnlPct}% · ${h.shares ?? '?'} acc.</span>
      `;
    }

    tr.innerHTML = `
      <td class="num">${h.num}</td>
      <td class="fecha">${escapeHtml(h.semana)}</td>
      <td class="ticker-cell ticker-${h.tickerColor}">${escapeHtml(h.ticker)}</td>
      <td class="empresa">${escapeHtml(h.empresa)}</td>
      <td class="precio entry-price">${escapeHtml(h.entry)}</td>
      <td class="precio target-price">${escapeHtml(h.target)}</td>
      <td class="precio stop-price">${escapeHtml(h.stop)}</td>
      <td class="upside up-${h.upsideColor}">${escapeHtml(h.upside)}</td>
      <td class="fecha-op">${escapeHtml(h.buyDate)}</td>
      <td class="fecha-op">${escapeHtml(h.sellDate)}</td>
      <td>
        <select class="status-badge ${statusInfo.cls}" data-idx="${idx}" data-field="status">
          ${statusOptions}
        </select>
      </td>
      <td class="col-pnl editable-pnl">
        ${pnlCell}
        <div style="margin-top:4px;">
          <input type="number" step="any" placeholder="P&L $" data-idx="${idx}" data-field="pnl" value="${h.pnl ?? ''}">
          <input type="number" step="any" placeholder="P&L %" data-idx="${idx}" data-field="pnlPct" value="${h.pnlPct ?? ''}">
          <input type="number" step="any" placeholder="acc." data-idx="${idx}" data-field="shares" value="${h.shares ?? ''}">
        </div>
      </td>
      <td><button class="btn btn-danger" data-idx="${idx}" data-action="delete" style="padding:4px 8px; font-size:9px;">✕</button></td>
    `;
    body.appendChild(tr);
  });

  // fill empty rows up to 10
  for (let i = DATA.historial.length; i < 10; i++) {
    const tr = document.createElement('tr');
    tr.className = 'row-empty';
    tr.innerHTML = `<td class="num">${i + 1}</td><td colspan="12" class="empty-cell">— Próxima ejecución —</td>`;
    body.appendChild(tr);
  }

  attachHistorialListeners();
  renderPnlSummary();
}

function attachHistorialListeners() {
  document.querySelectorAll('[data-field]').forEach(el => {
    el.addEventListener('change', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      const field = e.target.dataset.field;
      let value = e.target.value;
      if (['pnl', 'pnlPct', 'shares'].includes(field)) {
        value = value === '' ? null : Number(value);
      }
      DATA.historial[idx][field] = value;
      save();
      renderHistorial();
    });
  });

  document.querySelectorAll('[data-action="delete"]').forEach(el => {
    el.addEventListener('click', e => {
      const idx = parseInt(e.target.dataset.idx, 10);
      if (confirm('¿Eliminar esta operación del historial?')) {
        DATA.historial.splice(idx, 1);
        DATA.historial.forEach((h, i) => h.num = i + 1);
        save();
        renderHistorial();
      }
    });
  });
}

/* ===================== P&L SUMMARY ===================== */
function renderPnlSummary() {
  const grid = document.getElementById('pnlGrid');
  grid.innerHTML = '';

  const closed = DATA.historial.filter(h => h.pnl !== null && h.pnl !== undefined);
  if (closed.length === 0) {
    grid.innerHTML = `<div class="pnl-item" style="grid-column: span 3;"><div class="pnl-lbl">Sin operaciones cerradas todavía</div></div>`;
    return;
  }

  closed.forEach(h => {
    const cls = h.pnl >= 0 ? 'pnl-item-pos' : 'pnl-item-neg';
    const valCls = h.pnl >= 0 ? 'pnl-green' : 'pnl-red';
    const sign = h.pnl >= 0 ? '+' : '';
    const item = document.createElement('div');
    item.className = `pnl-item ${cls}`;
    item.innerHTML = `
      <div class="pnl-lbl">${escapeHtml(h.ticker)} (#${h.num})</div>
      <div class="pnl-val-big ${valCls}">${sign}$${h.pnl} <span>(${sign}${h.pnlPct}%)</span></div>
    `;
    grid.appendChild(item);
  });

  const totalPnl = closed.reduce((sum, h) => sum + h.pnl, 0);
  const totalInvested = closed.length * DATA.investmentPerTrade;
  const totalPct = ((totalPnl / totalInvested) * 100).toFixed(2);
  const totalCls = totalPnl >= 0 ? 'pnl-green' : 'pnl-red';
  const totalSign = totalPnl >= 0 ? '+' : '';

  const totalItem = document.createElement('div');
  totalItem.className = 'pnl-item pnl-item-total';
  totalItem.style.gridColumn = 'span 3';
  totalItem.innerHTML = `
    <div class="pnl-lbl">RESULTADO NETO (${closed.length} operaciones cerradas · $${totalInvested.toLocaleString()} invertidos)</div>
    <div class="pnl-val-big ${totalCls}">${totalSign}$${totalPnl.toFixed(2)} <span>(${totalSign}${totalPct}%)</span></div>
  `;
  grid.appendChild(totalItem);
}

/* ===================== ADD ROW ===================== */
function attachFormListener() {
  document.getElementById('addRowBtn').addEventListener('click', () => {
    const get = id => document.getElementById(id).value.trim();
    const ticker = get('f-ticker');
    if (!ticker) { alert('El ticker es obligatorio'); return; }

    const newRow = {
      num: DATA.historial.length + 1,
      semana: get('f-semana'),
      ticker: ticker.toUpperCase(),
      empresa: get('f-empresa'),
      tickerColor: document.getElementById('f-color').value,
      entry: get('f-entry'),
      target: get('f-target'),
      stop: get('f-stop'),
      upside: get('f-upside'),
      upsideColor: document.getElementById('f-upcolor').value,
      buyDate: get('f-buydate'),
      sellDate: get('f-selldate'),
      status: 'active',
      shares: null,
      pnl: null,
      pnlPct: null,
      note: ''
    };

    DATA.historial.push(newRow);
    save();
    renderHistorial();

    ['f-semana','f-ticker','f-empresa','f-entry','f-target','f-stop','f-upside','f-buydate','f-selldate']
      .forEach(id => document.getElementById(id).value = '');
  });
}

/* ===================== CLEANUP RULE ===================== */
function attachCleanupListener() {
  document.getElementById('cleanupBtn').addEventListener('click', () => {
    if (DATA.historial.length < 10) {
      alert(`Aún no hay 10 recomendaciones (hay ${DATA.historial.length}). La limpieza automática se aplica al llegar a 10.`);
      return;
    }
    DATA.historial = DATA.historial.filter(h => h.status === 'active');
    DATA.historial.forEach((h, i) => h.num = i + 1);
    save();
    renderHistorial();
  });
}

/* ===================== EXPORT / RESET ===================== */
function attachToolbarListeners() {
  document.getElementById('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(DATA, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plan_trading_data.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('resetBtn').addEventListener('click', async () => {
    if (!confirm('Esto descartará los cambios guardados localmente y recargará los datos originales. ¿Continuar?')) return;
    localStorage.removeItem(STORAGE_KEY);
    const res = await fetch('data.json');
    DATA = await res.json();
    renderAll();
  });
}

/* ===================== INSTALL APP ===================== */
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function attachInstallListener() {
  const btn = document.getElementById('installBtn');
  const overlay = document.getElementById('installOverlay');
  const instructions = document.getElementById('installInstructions');
  const closeBtn = document.getElementById('installCloseBtn');
  const closeBtn2 = document.getElementById('installCloseBtn2');

  if (isStandalone()) {
    btn.style.display = 'none';
    return;
  }

  const closeOverlay = () => overlay.classList.remove('active');
  closeBtn.addEventListener('click', closeOverlay);
  closeBtn2.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });

  btn.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      return;
    }

    if (isIOS()) {
      instructions.innerHTML = `
        <p>Para instalar esta app en tu iPhone/iPad:</p>
        <ol>
          <li>Toca el botón <strong>Compartir</strong> <span class="install-icon">⬆</span> en la barra de Safari (abajo o arriba de la pantalla).</li>
          <li>Desplázate y elige <strong>"Añadir a pantalla de inicio"</strong>.</li>
          <li>Toca <strong>"Añadir"</strong> arriba a la derecha.</li>
        </ol>
        <p>Si no ves esa opción, asegúrate de estar usando <strong>Safari</strong> (no Chrome ni otro navegador) y de no estar en modo de navegación privada.</p>
      `;
    } else {
      instructions.innerHTML = `
        <p>Para instalar esta app:</p>
        <ol>
          <li>Abre el menú de tu navegador (⋮ o ⋯).</li>
          <li>Busca la opción <strong>"Instalar app"</strong> o <strong>"Añadir a pantalla de inicio"</strong>.</li>
          <li>Confirma la instalación.</li>
        </ol>
      `;
    }
    overlay.classList.add('active');
  });
}

/* ===================== PUBLICAR CAMBIOS (Cloudflare Worker) ===================== */
const PUBLISH_URL_KEY = 'acciones_corto_plazo_publish_url';
const PUBLISH_SECRET_KEY = 'acciones_corto_plazo_publish_secret';

function attachPublishListener() {
  const btn = document.getElementById('publishBtn');
  const overlay = document.getElementById('publishOverlay');
  const closeBtn = document.getElementById('publishCloseBtn');
  const configBox = document.getElementById('publishConfigBox');
  const urlInput = document.getElementById('publishUrl');
  const secretInput = document.getElementById('publishSecret');
  const saveBtn = document.getElementById('publishSaveBtn');
  const statusBox = document.getElementById('publishStatus');
  const publishNowBtn = document.getElementById('publishNowBtn');
  const editConfigBtn = document.getElementById('publishEditConfigBtn');

  const closeOverlay = () => overlay.classList.remove('active');
  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });

  function hasConfig() {
    return !!(localStorage.getItem(PUBLISH_URL_KEY) && localStorage.getItem(PUBLISH_SECRET_KEY));
  }

  function refreshView() {
    statusBox.textContent = '';
    if (hasConfig()) {
      configBox.style.display = 'none';
      publishNowBtn.style.display = '';
      editConfigBtn.style.display = '';
    } else {
      configBox.style.display = '';
      publishNowBtn.style.display = 'none';
      editConfigBtn.style.display = 'none';
      urlInput.value = localStorage.getItem(PUBLISH_URL_KEY) || '';
      secretInput.value = '';
    }
  }

  btn.addEventListener('click', () => {
    refreshView();
    overlay.classList.add('active');
  });

  saveBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const secret = secretInput.value.trim();
    if (!url || !secret) {
      statusBox.textContent = '⚠️ Introduce la URL y el código secreto.';
      statusBox.style.color = 'var(--redbrand)';
      return;
    }
    localStorage.setItem(PUBLISH_URL_KEY, url);
    localStorage.setItem(PUBLISH_SECRET_KEY, secret);
    refreshView();
  });

  editConfigBtn.addEventListener('click', () => {
    configBox.style.display = '';
    publishNowBtn.style.display = 'none';
    editConfigBtn.style.display = 'none';
    urlInput.value = localStorage.getItem(PUBLISH_URL_KEY) || '';
    secretInput.value = localStorage.getItem(PUBLISH_SECRET_KEY) || '';
  });

  publishNowBtn.addEventListener('click', async () => {
    const url = localStorage.getItem(PUBLISH_URL_KEY);
    const secret = localStorage.getItem(PUBLISH_SECRET_KEY);
    statusBox.textContent = 'Publicando...';
    statusBox.style.color = '#888';
    publishNowBtn.disabled = true;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': secret
        },
        body: JSON.stringify(DATA)
      });
      const result = await res.json();
      if (res.ok && result.ok) {
        statusBox.textContent = '✅ Publicado. La web se actualizará en 1-2 minutos.';
        statusBox.style.color = 'var(--green)';
      } else {
        statusBox.textContent = `❌ Error: ${result.error || 'desconocido'}`;
        statusBox.style.color = 'var(--redbrand)';
      }
    } catch (err) {
      statusBox.textContent = `❌ Error de conexión: ${err.message}`;
      statusBox.style.color = 'var(--redbrand)';
    } finally {
      publishNowBtn.disabled = false;
    }
  });
}

/* ===================== TABS ===================== */
function attachTabListeners() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

/* ===================== INIT ===================== */
function renderAll() {
  renderHeader();
  renderPicks();
  renderCalendar();
  renderRules();
  renderHistorial();
}

(async function init() {
  await loadData();
  renderAll();
  attachFormListener();
  attachCleanupListener();
  attachToolbarListeners();
  attachTabListeners();
  attachInstallListener();
  attachPublishListener();
})();
