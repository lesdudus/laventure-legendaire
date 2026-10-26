// ------------------------------ INTERFACE ------------------------------
let _lastToast = '', _lastToastT = 0;
function toast(msg, kind = 'info', ms = CONFIG.toastMs) {
  const now = performance.now();
  if (msg === _lastToast && now - _lastToastT < 2500) return;
  _lastToast = msg; _lastToastT = now;
  const box = $('toasts'), el = document.createElement('div');
  el.className = 'toast card ' + kind; el.textContent = msg; box.appendChild(el);
  setTimeout(() => el.remove(), Math.max(ms, CONFIG.toastMs));
  while (box.children.length > 6) box.firstChild.remove();
}
const effText = (eff) => !eff ? '' : Object.entries(eff).map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${({ nour: 'nourriture', energie: 'énergie', vie: 'vie' })[k]}`).join(' · ');
function slotHTML(s, key) {
  if (!s) return key ? `<span class="k">${key}</span>` : '';
  let eq = '';
  if (s.id === 'armure' && G.armor && G.armor.on) eq = `<span class="eqb" title="Portée">🛡️</span><span class="pips">${'●'.repeat(G.armor.dur)}${'○'.repeat(Math.max(0, 5 - G.armor.dur))}</span>`;
  else if (s.id === 'tenue_invis' && isInvisible()) eq = '<span class="eqb inv" title="Active">✓</span>';
  return `${key ? `<span class="k">${key}</span>` : ''}${ITEMS[s.id].icon}${s.n > 1 ? `<span class="n">${s.n}</span>` : ''}${eq}`;
}
// Remplit une case et ajoute le cadre « équipé » (armure portée : doré · tenue active : violet)
function paintSlot(el, s, key) {
  el.innerHTML = slotHTML(s, key);
  el.classList.toggle('eq-armor', !!(s && s.id === 'armure' && G.armor && G.armor.on));
  el.classList.toggle('eq-invis', !!(s && s.id === 'tenue_invis' && isInvisible()));
}

const UI = {
  panel: null, dirty: true, tab: 'main', drag: null, hudCache: {}, mmBg: null,
  init() {
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => UI.close()));
    $('btn-new').onclick = () => { if (loadSave(SAVE_KEY) && !confirm('Commencer une nouvelle partie ? La sauvegarde actuelle sera remplacée.')) return; startGame(null); };
    $('btn-continue').onclick = () => startGame(loadSave(SAVE_KEY));
    $('btn-keys').onclick = () => { UI.back = 'title'; UI.open('keys'); };
    $('btn-keys2').onclick = () => { UI.back = 'pause'; UI.open('keys'); };
    $('btn-keys-back').onclick = () => UI.open(UI.back || 'pause');
    $('btn-resume').onclick = () => UI.close();
    $('btn-opts').onclick = () => { $('o-build-mode').value = SETTINGS.buildMode; UI.open('options'); };
    $('btn-opts-back').onclick = () => UI.open('pause');
    $('btn-save').onclick = () => { saveGame(); toast('Partie sauvegardée.', 'success'); };
    $('btn-restart').onclick = () => { if (confirm('Recommencer une nouvelle partie ?')) startGame(null); };
    $('btn-totitle').onclick = () => { saveGame(); G.started = false; UI.open('title'); };
    $('btn-over-load').onclick = () => { const d = loadSave(CHECK_KEY) || loadSave(SAVE_KEY); startGame(d); };
    $('btn-over-new').onclick = () => startGame(null);
    $('btn-win-go').onclick = () => UI.close();
    $('btn-sort').onclick = () => { INV.sort(); UI.renderInv(); };
    $('btn-rest').onclick = () => { UI.close(); startRest(false); };
    $('btn-sleep').onclick = () => { UI.close(); startRest(true); };
    document.querySelectorAll('#p-journal .tabs button').forEach((b) => b.onclick = () => { UI.tab = b.dataset.tab; UI.renderJournal(); });
    const opt = (id, key, fmt, apply) => {
      const el = $(id), out = $(id + '-v');
      const upd = () => { const v = el.type === 'checkbox' ? el.checked : parseFloat(el.value); SETTINGS[key] = v; if (out) out.textContent = fmt(v); apply && apply(v); saveSettings(); };
      if (el.type === 'checkbox') el.checked = !!SETTINGS[key]; else el.value = SETTINGS[key];
      el.addEventListener('input', upd); upd();
    };
    opt('o-sens', 'sens', (v) => v.toFixed(1));
    opt('o-fov', 'fov', (v) => v + '°', (v) => { if (CAM) { CAM.fov = v; CAM.updateProjectionMatrix(); } });
    opt('o-vol', 'vol', (v) => Math.round(v * 100) + '%', (v) => SFX.setVolume(v));
    opt('o-inv', 'invY', () => '');
    const st = $('o-style'); st.value = STYLES[SETTINGS.style] ? SETTINGS.style : 'pixel';
    st.addEventListener('change', () => { SETTINGS.style = st.value; applyStyle(st.value); saveSettings(); });
    for (const [id, key] of [['o-ghost-build', 'ghostBuild'], ['o-ghost-explore', 'ghostExplore'], ['o-build-mode', 'buildMode']]) {
      const el = $(id); el.value = SETTINGS[key];
      el.addEventListener('change', () => { SETTINGS[key] = el.value; saveSettings(); UI.dirty = true; });
    }
    opt('o-explore-noplace', 'exploreNoPlace', () => '');
    opt('o-dog-night', 'dogNight', () => '');
    opt('o-cat-unlimited', 'catUnlimited', () => '');
    opt('o-fps', 'showFps', () => '', (v) => $('fps').classList.toggle('hidden', !v));
    { const q = $('o-quality'); q.value = SETTINGS.quality || 'auto'; q.addEventListener('change', () => { SETTINGS.quality = q.value; saveSettings(); applyQuality(); }); }
    opt('o-lib-all', 'libAll', () => '', () => { if (UI.panel === 'lib') UI.renderLibrary(); });
    $('btn-lib').onclick = () => UI.open('lib');
    $('btn-lib-back').onclick = () => UI.open('inv');
    // grilles d'inventaire
    const mk = (host, n, cls) => { const h = $(host); h.innerHTML = ''; for (let i = 0; i < n; i++) { const d = document.createElement('div'); d.className = 'slot ' + (cls || ''); d.dataset.i = i; h.appendChild(d); } };
    mk('inv-grid', CONFIG.invSize); mk('chest-grid', CONFIG.chestSize); mk('chest-inv', CONFIG.invSize);
    const hb = $('hotbar'); hb.innerHTML = '';
    for (let i = 0; i < CONFIG.hotbar; i++) { const d = document.createElement('div'); d.className = 'slot'; d.dataset.i = i; hb.appendChild(d); }
    this.wireInv();
  },
  open(name) {
    document.querySelectorAll('#modal > .panel').forEach((p) => p.classList.add('hidden'));
    $('modal').classList.remove('hidden'); $('p-' + name).classList.remove('hidden');
    $('modal').classList.toggle('clear', name === 'title');
    this.panel = name; Input.unlock(); $('tooltip').classList.add('hidden');
    if (name === 'inv') this.renderInv();
    if (name === 'chest') this.renderChest();
    if (name === 'lib') this.renderLibrary();
    if (name === 'look') this.renderLook();
    if (name === 'craft') this.renderCraft();
    if (name === 'journal') this.renderJournal();
    if (name === 'title') $('btn-continue').disabled = !loadSave(SAVE_KEY);
    if (name === 'pause') $('pause-sub').textContent = `Jour ${G.day} · ${fmtClock(G.time % 1440)} · ${G.stars} ⭐`;
  },
  close(lock = true) {
    $('modal').classList.add('hidden'); this.panel = null; $('tooltip').classList.add('hidden');
    if (lock && G.started && !G.freeMouse) Input.lock();
  },
  // ---------- inventaire / coffre ----------
  wireInv() {
    const tip = $('tooltip'), ghost = $('drag-ghost');
    const slotInfo = (el) => {
      const host = el.parentElement.id, i = +el.dataset.i;
      if (host === 'chest-grid') return { inv: CHEST, i, host };
      return { inv: INV, i, host };
    };
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest && e.target.closest('.slot');
      if (!el || !el.parentElement) { tip.classList.add('hidden'); return; }
      const { inv, i } = slotInfo(el), s = inv.slots[i];
      if (!s) { tip.classList.add('hidden'); return; }
      const it = ITEMS[s.id];
      tip.innerHTML = `<b>${it.icon} ${esc(it.name)}${s.n > 1 ? ' ×' + s.n : ''}</b>${esc(it.desc || '')}${it.eff ? `<div class="eff">${effText(it.eff)}</div>` : ''}${it.quest ? '<div class="eff">Objet de quête</div>' : ''}`;
      tip.classList.remove('hidden');
    });
    document.addEventListener('mousemove', (e) => {
      tip.style.left = Math.min(innerWidth - 300, e.clientX + 16) + 'px'; tip.style.top = Math.min(innerHeight - 140, e.clientY + 16) + 'px';
      if (this.drag) { ghost.style.left = e.clientX - 14 + 'px'; ghost.style.top = e.clientY - 14 + 'px'; }
    });
    $('inv-grid').addEventListener('mousedown', (e) => {
      const el = e.target.closest('.slot'); if (!el) return;
      const i = +el.dataset.i;
      if (e.button === 2) { useInvSlot(i); this.renderInv(); return; }
      if (e.button !== 0 || !INV.slots[i]) return;
      this.drag = { i }; el.classList.add('drag');
      ghost.textContent = ITEMS[INV.slots[i].id].icon; ghost.classList.remove('hidden');
      ghost.style.left = e.clientX - 14 + 'px'; ghost.style.top = e.clientY - 14 + 'px';
    });
    $('inv-grid').addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mouseup', (e) => {
      if (!this.drag) return;
      const from = this.drag.i; this.drag = null; ghost.classList.add('hidden');
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const tgt = el && el.closest && el.closest('#inv-grid .slot');
      if (tgt) {
        const to = +tgt.dataset.i, a = INV.slots[from], b = INV.slots[to];
        if (to !== from) {
          if (b && a && b.id === a.id && b.n < INV.max(b.id)) { const k = Math.min(a.n, INV.max(b.id) - b.n); b.n += k; a.n -= k; if (!a.n) INV.slots[from] = null; }
          else { INV.slots[from] = b; INV.slots[to] = a; }
          if (this.pick === from) this.pick = to;
        } else { this.pick = from; SFX.play('click'); }
      } else if (!(el && el.closest && el.closest('#p-inv'))) {
        const s = INV.slots[from];
        if (s && (ITEMS[s.id].quest || ITEMS[s.id].keep)) toast(ITEMS[s.id].keep ? 'Cet objet est trop précieux pour être jeté.' : 'Impossible de jeter un objet de quête.', 'warn');
        else if (s) { INV.slots[from] = null; dropFromPlayer(s.id, s.n); toast(`Tu as jeté : ${ITEMS[s.id].name}${s.n > 1 ? ' ×' + s.n : ''}`, 'info'); }
      }
      this.renderInv();
    });
    const transfer = (src, dst, i, after) => { const s = src.slots[i]; if (!s) return; const left = dst.add(s.id, s.n); if (left) { s.n = left; toast('Plus de place.', 'warn'); } else src.slots[i] = null; SFX.play('click'); after(); };
    $('chest-grid').addEventListener('mousedown', (e) => { const el = e.target.closest('.slot'); if (el) transfer(CHEST, INV, +el.dataset.i, () => this.renderChest()); });
    $('chest-inv').addEventListener('mousedown', (e) => { const el = e.target.closest('.slot'); if (el) transfer(INV, CHEST, +el.dataset.i, () => this.renderChest()); });
  },
  renderInv() {
    const els = $('inv-grid').children;
    for (let i = 0; i < els.length; i++) { paintSlot(els[i], INV.slots[i], i < CONFIG.hotbar ? i + 1 : ''); els[i].classList.toggle('sel', i === G.sel); els[i].classList.toggle('picked', i === this.pick); els[i].classList.remove('drag'); }
    this.renderDetail(); this.renderHand();
    this.dirty = true;
  },
  recipeRow(r, withBtn) {
    const info = recipeInfo(r), where = ({ main: '🖐️ dans l’inventaire', bbq: '🔥 au barbecue' })[recipeWhere(r)] || '🔨 à l’établi';
    const ing = Object.entries(r.in).map(([k, n]) => `${ITEMS[k].icon}${n > 1 ? '×' + n : ''}`).join(' + ');
    const can = withBtn && !recipeDone(r) && INV.has(r.in);
    return `<div class="rec"><span>${info.icon} <b>${esc(info.name)}</b><br><small>${ing} · ${where}</small></span>${withBtn ? `<button data-rk="${recipeKey(r)}" ${can ? 'class="primary"' : 'disabled'}>Fabriquer</button>` : ''}</div>`;
  },
  renderDetail() {
    const host = $('inv-detail'), s = INV.slots[this.pick];
    if (!s) { host.innerHTML = '<p class="sub">Clique sur un objet pour afficher sa fiche : à quoi il sert, un indice, et les recettes où il est utilisé.</p>'; return; }
    const it = ITEMS[s.id], uses = RECIPES.filter((r) => r.in[s.id]);
    const known = uses.filter(recipeUnlocked), unknown = uses.length - known.length;
    let h = `<div class="big">${it.icon}</div><h3>${esc(it.name)}${s.n > 1 ? ' ×' + s.n : ''}</h3><div>${esc(it.desc || '')}</div>`;
    if (it.eff) h += `<p><b>Effets :</b> ${effText(it.eff)}</p>`;
    if (HINTS[s.id]) h += `<p class="hint">« ${esc(HINTS[s.id])} »</p>`;
    if (known.length) h += `<p><b>Utilisé dans :</b></p>` + known.map((r) => this.recipeRow(r, recipeWhere(r) === 'main')).join('');
    if (unknown) h += `<p class="hint">🔒 ${unknown} recette${unknown > 1 ? 's' : ''} encore inconnue${unknown > 1 ? 's' : ''} avec cet objet… il te manque un ingrédient.</p>`;
    host.innerHTML = h;
    host.querySelectorAll('[data-rk]').forEach((b) => b.onclick = () => { craft(RECIPES.find((r) => recipeKey(r) === b.dataset.rk), 'main'); this.renderInv(); });
  },
  renderHand() {
    const host = $('hand-list'), list = RECIPES.filter((r) => recipeWhere(r) === 'main' && recipeUnlocked(r));
    host.innerHTML = list.length ? list.map((r) => this.recipeRow(r, true)).join('') : '<p class="sub">Aucune recette connue pour l’instant.</p>';
    host.querySelectorAll('[data-rk]').forEach((b) => b.onclick = () => { craft(RECIPES.find((r) => recipeKey(r) === b.dataset.rk), 'main'); this.renderInv(); });
  },
  renderChest() {
    const a = $('chest-grid').children, b = $('chest-inv').children;
    for (let i = 0; i < a.length; i++) paintSlot(a[i], CHEST.slots[i]);
    for (let i = 0; i < b.length; i++) paintSlot(b[i], INV.slots[i], i < CONFIG.hotbar ? i + 1 : '');
    this.dirty = true;
  },
  // ---------- bibliothèque de recettes ----------
  renderLibrary() {
    const all = SETTINGS.libAll !== false, host = $('lib-body');
    const known = (k) => !!(G.known && G.known[k]);
    let h = '', hidden = 0;
    for (const [w, title] of [['main', '🖐️ À la main, depuis l’inventaire'], ['atelier', '🔨 À l’établi de la base'], ['bbq', '🔥 Au barbecue du jardin (quand il est chaud)']]) {
      const list = RECIPES.filter((r) => recipeWhere(r) === w), vis = list.filter((r) => all || Object.keys(r.in).every(known));
      hidden += list.length - vis.length;
      if (!vis.length) continue;
      h += `<h3>${title}</h3>`;
      for (const r of vis) {
        const info = recipeInfo(r), done = recipeDone(r), it = r.out && ITEMS[r.out];
        const chips = Object.entries(r.in).map(([k, n]) => {
          const I = ITEMS[k];
          if (!known(k)) return `<span class="chip unk"><span class="gi">${I.icon}</span>${esc(I.name)} <b>×${n}</b></span>`;
          const have = INV.count(k);
          return `<span class="chip ${have >= n ? 'ok' : 'ko'}">${I.icon} ${esc(I.name)} <b>${have}/${n}</b></span>`;
        }).join('');
        const can = !done && INV.has(r.in) && recipeUnlocked(r);
        const btn = done ? '<span class="where">✔ Installé</span>'
          : w === 'main' ? `<button data-lib="${recipeKey(r)}" ${can ? 'class="primary"' : 'disabled'}>Fabriquer</button>`
            : `<span class="where">${w === 'bbq' ? '🔥 Va au barbecue' : '🔨 Va à l’établi'}</span>`;
        h += `<div class="librow"><div class="ic">${info.icon}</div><div><b>${esc(info.name)}</b>${it && it.eff ? ` <small>${effText(it.eff)}</small>` : ''}<div class="chips">${chips}</div></div>${btn}</div>`;
      }
    }
    if (hidden) h += `<p class="sub">🔒 ${hidden} recette${hidden > 1 ? 's' : ''} cachée${hidden > 1 ? 's' : ''} : elles apparaîtront quand tu auras possédé tous leurs ingrédients. (Paramètres → « Afficher les recettes non découvertes »)</p>`;
    host.innerHTML = h || '<p class="sub">Aucune recette découverte pour l’instant.</p>';
    host.querySelectorAll('[data-lib]').forEach((b) => b.onclick = () => { craft(RECIPES.find((r) => recipeKey(r) === b.dataset.lib), 'main'); this.renderLibrary(); });
  },
  renderCraft() {
    const host = $('craft-list'); host.innerHTML = '';
    let locked = 0;
    for (const r of RECIPES) {
      if (recipeWhere(r) === 'bbq') continue;
      if (!recipeUnlocked(r)) { locked++; continue; }
      const info = recipeInfo(r), done = recipeDone(r);
      const ing = Object.entries(r.in).map(([k, n]) => { const have = INV.count(k); return `<span class="${have >= n ? 'ok' : 'ko'}">${ITEMS[k].icon} ${esc(ITEMS[k].name)} ${have}/${n}</span>`; }).join(' · ');
      const can = !done && INV.has(r.in);
      const tag = r.up ? 'amélioration voiture' : r.base ? 'amélioration de base' : recipeWhere(r) === 'main' ? 'aussi faisable à la main' : '';
      const d = document.createElement('div'); d.className = 'recipe';
      d.innerHTML = `<div class="ic">${info.icon}</div><div><b>${esc(info.name)}${r.n > 1 ? ' ×' + r.n : ''}</b>${tag ? ` <small>(${tag})</small>` : ''}<div class="ing">${ing}</div><small>${esc(info.desc || '')}</small></div>`;
      const btn = document.createElement('button'); btn.textContent = done ? 'Installé' : 'Fabriquer'; btn.disabled = !can;
      if (can) btn.className = 'primary';
      btn.onclick = () => { craft(r, 'atelier'); this.renderCraft(); };
      d.appendChild(btn); host.appendChild(d);
    }
    if (locked) { const p = document.createElement('p'); p.className = 'sub'; p.textContent = `🔒 ${locked} recette${locked > 1 ? 's' : ''} à découvrir : possède au moins une fois chacun de leurs ingrédients pour les débloquer.`; host.appendChild(p); }
  },
  // ---------- garde-robe ----------
  renderLook() {
    for (const [k, list] of Object.entries(LOOK_COLORS)) {
      const host = $('sw-' + k); host.innerHTML = '';
      for (const c of list) {
        const b = document.createElement('button'); b.className = 'sw' + (G.look[k] === c ? ' on' : '');
        b.style.background = '#' + c.toString(16).padStart(6, '0'); b.title = 'Choisir';
        b.onclick = () => { G.look[k] = c; refreshPlayerModel(); SFX.play('click'); this.renderLook(); };
        host.appendChild(b);
      }
    }
  },
  // ---------- journal ----------
  renderJournal() {
    document.querySelectorAll('#p-journal .tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === this.tab));
    const host = $('journal-body'); let h = '';
    if (this.tab === 'main') {
      h += `<p class="sub">« Le Grand Départ » — rejoindre la cabane du jardin et y fonder une colonie.</p>`;
      MAIN.forEach((st, i) => {
        const cls = i < G.mainStep ? 'done' : i === G.mainStep ? 'cur' : '';
        if (i > G.mainStep) { h += `<div class="quest"><div class="t">${i + 1}. ???</div></div>`; return; }
        h += `<div class="quest ${cls}"><div class="t">${i < G.mainStep ? '✔' : '➤'} ${i + 1}. ${esc(st.title)}</div><p>${esc(st.desc)}</p>${i === G.mainStep && st.progress ? `<p>${esc(st.progress())}</p>` : ''}</div>`;
      });
    } else if (this.tab === 'side') {
      for (const q of SIDE) {
        const done = G.side[q.id], locked = q.req && !G.side[q.req];
        if (locked) { h += `<div class="quest"><div class="t">🔒 ???</div><p>Débloquée par « ${esc(SIDE.find((s) => s.id === q.req).title)} ».</p></div>`; continue; }
        const rw = Object.entries(q.reward || {}).map(([k, n]) => ITEMS[k].icon + (n > 1 ? '×' + n : '')).join(' ') + (q.upgrade ? ' ' + UPGRADES[q.upgrade].icon : '');
        h += `<div class="quest ${done ? 'done' : G.track === q.id ? 'cur' : ''}"><div class="t"><span>${done ? '✔' : '•'} ${esc(q.title)} ${q.progress && !done ? `<small>(${esc(q.progress())})</small>` : ''}</span>${done ? '<small>Terminée</small>' : `<button data-track="${q.id}">${G.track === q.id ? 'Ne plus suivre' : 'Suivre'}</button>`}</div><p>${esc(q.desc)}</p><p>Récompense : ${rw || '—'}</p></div>`;
      }
    } else if (this.tab === 'daily') {
      h += `<p class="sub">Nouveaux défis chaque matin à 6h. Récompense : un objet rare + ⭐.</p>`;
      for (const d of G.daily) {
        const def = DAILY.find((q) => q.id === d.id);
        const prog = def.unit === 'cm' ? `${fmtDist(Math.min(d.n, def.goal))} / ${fmtDist(def.goal)}` : `${Math.min(Math.floor(d.n), def.goal)} / ${def.goal}`;
        h += `<div class="quest ${d.done ? 'done' : ''}"><div class="t"><span>${d.done ? '✔' : '⭐'} ${esc(def.text)}</span><small>${prog}</small></div></div>`;
      }
    } else {
      const s = G.stats;
      h += `<div class="stat-grid"><span>Jour</span><b>${G.day}</b><span>Étoiles</span><b>${G.stars} ⭐</b><span>Quêtes secondaires</span><b>${Object.keys(G.side).length}/${SIDE.length}</b><span>Objets ramassés</span><b>${G.counters.pickup || 0}</b><span>Objets fabriqués</span><b>${G.counters.craft || 0}</b><span>Fois repéré</span><b>${s.spotted}</b><span>Captures (total)</span><b>${s.captures}</b><span>Distance en voiture</span><b>${fmtDist(G.counters.carDist || 0)}</b><span>Affection de Moustache</span><b>${Math.floor(G.cat.aff)}/100</b><span>Clins d’œil cubiques trouvés</span><b>${Object.keys(G.egg.found).length}/${EGG_COUNT}</b><span>Cristaux d’ombre</span><b>${INV.count('cristal') + CHEST.count('cristal')}/4</b><span>Améliorations</span><b>${Object.keys(G.upgrades).filter((k) => G.upgrades[k]).map((k) => UPGRADES[k].icon + ' ' + UPGRADES[k].name).join(', ') || '—'}</b></div>`;
    }
    host.innerHTML = h;
    host.querySelectorAll('[data-track]').forEach((b) => b.onclick = () => { G.track = G.track === b.dataset.track ? null : b.dataset.track; this.renderJournal(); });
  },
  // ---------- dialogue ----------
  dialog(who, text, opts) {
    this.open('dialog');
    $('dlg-who').textContent = who; $('dlg-text').textContent = text;
    const host = $('dlg-opts'); host.innerHTML = '';
    for (const o of opts) { const b = document.createElement('button'); b.textContent = o.label; b.onclick = () => { SFX.play('click'); o.fn ? o.fn() : UI.close(); }; host.appendChild(b); }
  },
  openRest() {
    const P = G.p, s = hideScore(P.x, P.y, P.z), bed = nearBed();
    this.open('rest');
    $('rest-score').textContent = s; $('rest-label').textContent = 'Cachette : ' + hideLabel(s);
    $('rest-meter').style.width = s + '%';
    const r = riskPerHour(s);
    $('rest-risk').innerHTML = `Risque estimé d'être surpris : <b>${(r * 100).toFixed(1).replace('.', ',')} %</b> par heure de jeu (humains ${humanActivityLabel()}).`;
    $('rest-sub').textContent = bed ? 'Tu es près de ton lit : tu peux dormir en toute sécurité.' : 'Pas de lit ici : tu peux seulement te reposer (récupération lente).';
    $('btn-sleep').disabled = !bed;
  },
  // ---------- HUD ----------
  setBar(id, v) {
    const c = this.hudCache, k = Math.round(v);
    if (c[id] === k) return; c[id] = k;
    const el = $(id); el.querySelector('i').style.width = clamp(v, 0, 100) + '%'; el.querySelector('b').textContent = k; el.classList.toggle('low', v < 20);
  },
  hud() {
    const S = G.s, c = this.hudCache;
    this.setBar('b-vie', S.vie); this.setBar('b-nour', S.nour);
    $('b-nour').classList.toggle('feast', (G.fx.feastUntil || 0) > G.time);
    const eqh = equipHUD(); if (c.eq !== eqh) { c.eq = eqh; $('equip-row').innerHTML = eqh; $('equip-row').classList.toggle('hidden', !eqh); }
    {
      const nC = INV.count('cristal'), show = isInvisible() || G.invis.charge > 0 || nC > 0;
      const ik = show ? `${Math.round(G.invis.charge)}|${nC}|${isInvisible()}` : '';
      if (c.inv !== ik) {
        c.inv = ik; const el = $('b-invis'); el.classList.toggle('hidden', !show);
        if (show) { el.querySelector('i').style.width = (100 * G.invis.charge / CONFIG.invisMinutes) + '%'; el.querySelector('b').textContent = '×' + nC; el.classList.toggle('active', isInvisible()); el.title = `Cristal d’ombre : ${fmtDur(G.invis.charge)} restantes · ${nC} cristal(aux) en réserve`; }
      }
    } this.setBar('b-energie', S.energie);
    {
      // jauge de Moustache (pendant la chevauchée) et barre Souffle (au-dessus de l'inventaire)
      const riding = G.mode === 'cat', unl = !!SETTINGS.catUnlimited, cr = G.cat.ride ?? CONFIG.cat.rideTime;
      const ck = riding ? (unl ? '∞' : Math.ceil(cr)) : '';
      if (c.cat !== ck) {
        c.cat = ck; const el = $('b-cat'); el.classList.toggle('hidden', !riding);
        if (riding) { el.querySelector('i').style.width = (unl ? 100 : 100 * cr / CONFIG.cat.rideTime) + '%'; el.querySelector('b').textContent = unl ? '∞' : ck + ' s'; el.classList.toggle('low', !unl && cr < 15); }
      }
      const B = G.breath, show = B.v < 100 || G.simT - B.fullT < 2;
      const bk = `${Math.round(B.v)}|${show}|${B.out}`;
      if (c.br !== bk) {
        c.br = bk; const el = $('souffle');
        el.classList.toggle('show', show); el.classList.toggle('low', B.v < 25 && !B.out); el.classList.toggle('out', B.out);
        el.querySelector('i').style.width = B.v + '%';
        el.title = B.out ? 'À bout de souffle : marche jusqu’à 30 % pour courir à nouveau' : `Souffle : ${Math.round(B.v)} %`;
      }
    }
    const t = fmtClock(G.time % 1440);
    if (c.t !== t) { c.t = t; $('clk-time').textContent = t; $('clk-day').textContent = 'Jour ' + G.day; $('clk-ic').textContent = G.daylight > 0.5 ? '☀️' : G.daylight > 0 ? '🌅' : '🌙'; }
    const cap = `🫙 ${G.capturesToday}/${CONFIG.capture.maxPerDay}`; if (c.cap !== cap) { c.cap = cap; $('clk-cap').textContent = cap; }
    const list = Missions.list(), m = list[0];
    const key = list.map((q) => q.title + '|' + q.progress).join('#');
    if (c.obj !== key) {
      c.obj = key; $('obj-title').textContent = m.kind + ' ' + m.title; $('obj-prog').textContent = m.progress || '';
      $('obj-more').innerHTML = list.slice(1).map((q) => `<li><span>${q.kind} ${esc(q.title)}</span><span>${esc(q.progress || '')}</span></li>`).join('');
    }
    const tg = m.target;
    if (tg) {
      const dx = tg.x - G.p.x, dz = tg.z - G.p.z, d = Math.hypot(dx, dz, tg.y - G.p.y);
      const ang = Math.atan2(dx, dz) - (G.yaw + Math.PI);
      $('obj-arrow').style.transform = `rotate(${-ang * 180 / Math.PI - 90}deg)`;
      $('obj-arrow').style.opacity = 1;
      $('obj-dist').textContent = fmtDist(d) + (tg.y - G.p.y > 25 ? ' ↑' : tg.y - G.p.y < -25 ? ' ↓' : '');
      MARKER.visible = true; MARKER.position.set(tg.x, tg.y + 6 + Math.sin(G.simT * 3), tg.z);
      const sc = clamp(d * 0.03, 3, 30); MARKER.scale.set(sc, sc, 1);
    } else { $('obj-arrow').style.opacity = 0.3; $('obj-dist').textContent = ''; MARKER.visible = false; }
    // retrouver la voiture
    {
      const C = G.car, dx = C.x - G.p.x, dz = C.z - G.p.z, d = Math.hypot(dx, dz, C.y - G.p.y);
      const show = G.mode !== 'car' && d > 25 && !carStowed();
      $('carfind').classList.toggle('hidden', !show);
      CAR_BEACON.visible = show && G.mode !== 'jar';
      if (show) {
        const ang = Math.atan2(dx, dz) - (G.yaw + Math.PI);
        $('car-arrow').style.transform = `rotate(${-ang * 180 / Math.PI - 90}deg)`;
        $('car-dist').textContent = fmtDist(d) + (C.y - G.p.y > 25 ? ' ↑' : C.y - G.p.y < -25 ? ' ↓' : '');
        CAR_BEACON.position.set(C.x, C.y + 10 + Math.sin(G.simT * 2) * 0.8, C.z);
        const sc = clamp(d * 0.025, 3, 22); CAR_BEACON.scale.set(sc, sc, 1);
      }
    }
    // discrétion
    const st = G.alertState;
    if (c.st !== st) {
      c.st = st; const e = $('eye');
      e.className = st === 2 ? 'spot' : st === 1 ? 'vis' : '';
      e.textContent = st === 2 ? '😨' : st === 1 ? '👁️' : '🙈';
      $('eye-txt').textContent = st === 2 ? 'Repéré !' : st === 1 ? 'Visible' : 'Caché';
    }
    const nl = Math.round(clamp(G.noiseShown, 0, 1) * 5);
    if (c.nl !== nl) { c.nl = nl; [...$('noise').children].forEach((el, i) => { el.classList.toggle('on', i < nl); el.classList.toggle('hi', nl >= 4); }); }
    const hs = `Cachette ici : ${G.hideHere} (${hideLabel(G.hideHere)})${G.flags.inFur ? ' · dans la fourrure de Moustache' : G.flags.inCastle ? ' · dans le château de Léa' : ''}`; if (c.hs !== hs) { c.hs = hs; $('hide-score').textContent = hs; }
    // mémoire des humains : étoiles qui redescendent (15 s de près, 4 s de loin)
    {
      let best = null; for (const h of HUMANS) if (h.mem > 0 && (!best || h.mem > best.mem)) best = h;
      $('memory').classList.toggle('hidden', !best);
      if (best) {
        const n = Math.ceil(best.mem / 3), stars = '<b>' + '★'.repeat(n) + '</b>' + '☆'.repeat(5 - n);
        const txt = `${best.name} t’oublie dans ${Math.ceil(best.mem)} s`;
        if (c.mem !== stars + txt) { c.mem = stars + txt; $('stars').innerHTML = stars; $('mem-txt').textContent = txt; }
        $('mem-bar').style.width = (100 * best.mem / Math.max(1, best.memFull)) + '%';
      }
    }
    if (this.dirty) {
      this.dirty = false;
      const els = $('hotbar').children;
      for (let i = 0; i < els.length; i++) { paintSlot(els[i], INV.slots[i], i + 1); els[i].classList.toggle('sel', i === G.sel); }
    }
    const pr = G.prompt || ''; if (c.pr !== pr) { c.pr = pr; $('prompt').innerHTML = pr; }
    $('minimap').classList.toggle('hidden', !(G.minimap || (G.baseUp && G.baseUp.periscope)));
    if (G.minimap || (G.baseUp && G.baseUp.periscope)) this.drawMinimap();
    $('vignette').style.opacity = G.alertState === 2 ? 0.9 : (S.vie < 25 ? 0.6 : 0);
    // voile de fatigue (noir) : de 40 % à 0 %
    const fx = (id, v, col) => {
      const k = clamp((40 - v) / 40, 0, 1), key = Math.round(k * 50);
      if (c[id] === key) return; c[id] = key;
      const el = $(id); el.style.opacity = k > 0 ? 1 : 0;
      if (k > 0) el.style.background = `radial-gradient(ellipse at center, transparent ${Math.round((1 - k) * 62)}%, color-mix(in srgb, ${col} ${Math.round(30 + 55 * k)}%, transparent) 100%)`;
    };
    fx('v-fatigue', S.energie, 'black');
    // voile de Nourriture (bleu) : léger à 15 %, l'écran entier est bleu à 0 %
    {
      const k = clamp((CONFIG.stats.low - S.nour) / CONFIG.stats.low, 0, 1), key = Math.round(k * 60);
      if (c.vnour !== key) {
        c.vnour = key; const el = $('v-nour'); el.style.opacity = k > 0 ? 1 : 0;
        if (k > 0) el.style.background = `linear-gradient(color-mix(in srgb, var(--cp-link) ${Math.round(k * k * 72)}%, transparent), color-mix(in srgb, var(--cp-link) ${Math.round(k * k * 72)}%, transparent)), radial-gradient(ellipse at center, transparent ${Math.round((1 - k) * 60)}%, color-mix(in srgb, var(--cp-link) ${Math.round(35 + 55 * k)}%, transparent) 100%)`;
      }
    }
  },
  drawMinimap() {
    const cv = $('minimap'), g = cv.getContext('2d'), sc = 180 / 1440, ox = 120, oz = 70;
    const X = (x) => (x + ox) * sc, Z = (z) => (z + oz) * sc * 0.9;
    if (!this.mmBg) {
      const bg = document.createElement('canvas'); bg.width = 180; bg.height = 213; const b = bg.getContext('2d');
      b.fillStyle = cssVar('--cp-surface-soft'); b.fillRect(0, 0, 180, 213);
      b.fillStyle = 'rgba(106,168,79,0.35)'; b.fillRect(X(-100), Z(862), (1400) * sc, 788 * sc * 0.9);
      b.fillStyle = cssVar('--cp-border');
      for (const s of SOLIDS) if (!s.off && s.y1 > 20 && s.tag !== 'floor' && s.y0 < 120) b.fillRect(X(s.x0), Z(s.z0), Math.max(1, (s.x1 - s.x0) * sc), Math.max(1, (s.z1 - s.z0) * sc * 0.9));
      b.fillStyle = cssVar('--cp-text-muted'); b.font = '9px Segoe UI'; b.textAlign = 'center';
      for (const r of ROOMS) b.fillText(r.name, X((r.x0 + r.x1) / 2), Z((r.z0 + r.z1) / 2));
      this.mmBg = bg;
    }
    g.drawImage(this.mmBg, 0, 0);
    const dot = (x, z, col, r = 3) => { g.fillStyle = col; g.beginPath(); g.arc(X(x), Z(z), r, 0, 7); g.fill(); };
    const spy = G.baseUp && G.baseUp.periscope;
    if (spy) { for (const h of HUMANS) if (!h.away) dot(h.x, h.z, cssVar('--cp-danger'), 4); if (Dog) dot(Dog.x, Dog.z, cssVar('--cp-warning'), 3.5); }
    if (G.baseUp && G.baseUp.vitrine) {
      g.fillStyle = cssVar('--cp-accent'); g.font = 'bold 9px Segoe UI'; g.textAlign = 'center';
      for (const [id, e] of Object.entries(EGGS)) if (e && e.x !== undefined && !G.egg.found[id]) g.fillText('?', X(e.x), Z(e.z) + 3);
    }
    if (Cat) dot(Cat.x, Cat.z, cssVar('--cp-success'), 3);
    if (!carStowed()) { const C = G.car; g.fillStyle = cssVar('--cp-warning'); g.fillRect(X(C.x) - 3, Z(C.z) - 2, 6, 4); g.strokeStyle = cssVar('--cp-text'); g.lineWidth = 1; g.strokeRect(X(C.x) - 3, Z(C.z) - 2, 6, 4); }
    const tg = Missions.current().target; if (tg) dot(tg.x, tg.z, cssVar('--cp-accent'), 3);
    g.save(); g.translate(X(G.p.x), Z(G.p.z)); g.rotate(-G.yaw + Math.PI);
    g.fillStyle = cssVar('--cp-link'); g.beginPath(); g.moveTo(0, 5); g.lineTo(-3.5, -3.5); g.lineTo(3.5, -3.5); g.closePath(); g.fill(); g.restore();
  },
};
