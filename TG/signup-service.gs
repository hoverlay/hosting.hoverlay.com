/**
 * Supply Chain AI Training Hub: use-case sign-up service.
 *
 * Records who chose which use case, inside this spreadsheet:
 *   - "Claims" tab: one row per taken use case (the record the page reads).
 *   - "Use cases" tab: the Taken By / Progress / Taken On columns are refreshed
 *     from the Claims tab after every change. Use cases that participants add
 *     themselves ("addOwn") are appended to this tab with the next free UC ID.
 *
 * Actions sent by the page: list, claim, switch, update, addOwn, progress, release.
 * Each person can hold one use case per mandatory session; one use case can cover
 * several sessions. Taking a use case for a session replaces whatever that person
 * had for the same session.
 *
 * Setup (once):
 *   1. In the spreadsheet: Extensions > Apps Script. Replace the editor contents with this file. Save.
 *   2. Select the "setup" function and click Run. Approve the permissions prompt.
 *   3. Deploy > New deployment > type "Web app". Execute as: Me. Who has access: Anyone. Deploy.
 *   4. Copy the Web app URL (ends in /exec) into flowUrl in the HTML file.
 *
 * After every code change: Deploy > Manage deployments > pencil icon > Version: "New version" > Deploy.
 * Saving alone does not change what the /exec URL runs. Editing the existing deployment keeps the same URL.
 *
 * To edit sign-ups by hand, edit or delete rows in the Claims tab. The page picks up the
 * change on its next refresh (every 30 seconds).
 */

const USE_CASES_TAB = 'Use cases';
const CLAIMS_TAB = 'Claims';
// Claims tab columns, matched by header text. Missing headers are added at the end of row 1.
const CLAIM_FIELDS = [
  ['UC ID', 'ucId'], ['Use Case Title', 'ucTitle'], ['Name', 'name'], ['Email', 'email'],
  ['Participant #', 'pid'], ['SC Function', 'fn'], ['Progress', 'progress'], ['Taken On', 'created'],
  ['Assigned By', 'assignedBy'], ['Sessions', 'sessions'], ['Own Use Case', 'own'],
  ['Current Process', 'ownPain'], ['Proposed AI Solution', 'ownSolution'], ['Expected Outcome', 'ownOutcome'],
  ['AI Tools', 'ownTools'], ['Tracker ID', 'trackerId'], ['Updated', 'updated']
];
const MIRROR_HEADERS = ['Taken By', 'Progress', 'Taken On'];
const PROGRESS_VALUES = ['Not started', 'In progress', 'Done'];
// Fields a participant may change on their own claim through "update". Admin can change any field.
const SELF_UPDATABLE = ['sessions', 'session', 'ucTitle', 'ownPain', 'ownSolution', 'ownOutcome', 'ownTools', 'updated'];
// Stage written to an own use case that is released, so it drops off the page's list (the page hides "reject" stages).
const WITHDRAWN_STAGE = 'Rejected (withdrawn by submitter)';
// Sign-ups remain open throughout the training program; there is no date cutoff.

function doGet() {
  return respond_(handle_({ action: 'list' }));
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return respond_({ ok: false, error: 'Bad request.' });
  }
  return respond_(handle_(body));
}

/** Run once from the editor to create the tabs and columns and grant permissions. */
function setup() {
  claimHeaders_();
  mirror_(readClaims_());
}

function handle_(body) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'The sign-up service is busy. Try again in a moment.' };
  try {
    const claims = readClaims_();
    const action = String(body.action || 'list');
    if (action === 'list') return { ok: true, claims: publicClaims_(claims) };

    const admin = body.by === 'admin';
    const fail = function (msg) { return { ok: false, error: msg, claims: publicClaims_(claims) }; };

    const ucTable = useCaseTable_();
    let next, extra = {};

    if (action === 'claim' || action === 'switch') {
      const c = cleanClaim_(body.claim, admin);
      if (!c.ucId || !c.name || !c.email) return fail('Missing use case or participant details.');
      const uc = findUseCase_(ucTable, c.ucId);
      if (!uc) return fail(c.ucId + ' is not in the use case list.');
      if (uc.completed) return fail(c.ucId + ' was completed in phase 1 and is not open for sign-up.');
      c.ucTitle = uc.title || c.ucTitle;
      if (!c.sessions.length && uc.session) c.sessions = [uc.session];
      const taken = claims.filter(function (x) { return x.ucId === c.ucId && !sameEmail_(x.email, c.email); })[0];
      if (taken) return fail(c.ucId + ' was just taken by ' + taken.name + '.');
      let list = claims.filter(function (x) { return !(x.ucId === c.ucId && sameEmail_(x.email, c.email)); });
      if (action === 'switch' && body.fromUcId) {
        list = list.filter(function (x) { return !(x.ucId === body.fromUcId && sameEmail_(x.email, c.email)); });
      }
      next = stripOverlap_([c].concat(list), c, ucTable);

    } else if (action === 'addOwn') {
      const c = cleanClaim_(body.claim, admin);
      const u = body.useCase || {};
      if (!c.name || !c.email) return fail('Missing participant details.');
      if (str_(u.title).length < 5) return fail('Add a short title for your use case.');
      const id = nextUcId_(ucTable, claims);
      c.ucId = id;
      c.trackerId = id;
      c.own = true;
      c.ucTitle = str_(u.title);
      appendUseCase_(ucTable, id, u);
      next = stripOverlap_([c].concat(claims), c, ucTable);
      extra.ucId = id;

    } else if (action === 'update') {
      const target = claims.filter(function (x) { return x.ucId === body.ucId && sameEmail_(x.email, body.email); })[0];
      if (!target) return fail('That sign-up was not found. Refresh the page and try again.');
      const fields = body.fields || {};
      const patch = {};
      Object.keys(fields).forEach(function (k) {
        if (k === 'ucId' || k === 'email') return;
        if (admin || SELF_UPDATABLE.indexOf(k) >= 0) patch[k] = fields[k];
      });
      if (patch.sessions !== undefined || patch.session !== undefined) {
        patch.sessions = toSessions_(patch.sessions !== undefined ? patch.sessions : patch.session);
        delete patch.session;
      }
      ['ucTitle', 'ownPain', 'ownSolution', 'ownOutcome', 'ownTools', 'trackerId', 'updated'].forEach(function (k) {
        if (patch[k] !== undefined) patch[k] = str_(patch[k]);
      });
      const updated = Object.assign({}, target, patch);
      next = claims.map(function (x) { return x === target ? updated : x; });
      if (patch.sessions) next = stripOverlap_(next, updated, ucTable);
      if (target.own && body.useCase) updateUseCase_(ucTable, target.ucId, body.useCase);

    } else if (action === 'progress') {
      if (PROGRESS_VALUES.indexOf(body.progress) < 0) return fail('Unknown progress value.');
      next = claims.map(function (x) {
        return x.ucId === body.ucId && sameEmail_(x.email, body.email) ? Object.assign({}, x, { progress: body.progress }) : x;
      });

    } else if (action === 'release') {
      const gone = claims.filter(function (x) { return x.ucId === body.ucId && sameEmail_(x.email, body.email); })[0];
      next = claims.filter(function (x) { return x !== gone; });
      if (gone && gone.own) setUseCaseCells_(ucTable, gone.ucId, { 'Stage': WITHDRAWN_STAGE });

    } else {
      return fail('Unknown action: ' + action + '.');
    }

    writeClaims_(next);
    mirror_(next);
    return Object.assign({ ok: true, claims: publicClaims_(next) }, extra);
  } finally {
    lock.releaseLock();
  }
}

/* ---------- claims ---------- */

function str_(v) { return String(v == null ? '' : v).trim().slice(0, 2000); }

function sameEmail_(a, b) {
  return String(a || '').toLowerCase() === String(b || '').toLowerCase();
}

function toSessions_(v) {
  const arr = Array.isArray(v) ? v : String(v == null ? '' : v).match(/[1-4]/g) || [];
  const out = [];
  arr.forEach(function (x) { const n = Number(String(x).replace(/\D/g, '')); if (n >= 1 && n <= 4 && out.indexOf(n) < 0) out.push(n); });
  return out;
}

function cleanClaim_(c, admin) {
  c = c || {};
  const sessions = toSessions_(c.sessions && c.sessions.length ? c.sessions : c.session);
  return {
    ucId: str_(c.ucId), ucTitle: str_(c.ucTitle), name: str_(c.name), email: str_(c.email), pid: str_(c.pid), fn: str_(c.fn),
    progress: PROGRESS_VALUES.indexOf(c.progress) >= 0 ? c.progress : 'Not started',
    created: new Date().toISOString(),
    assignedBy: admin ? (str_(c.assignedBy) || 'Program team') : '',
    sessions: sessions,
    own: false,
    ownPain: str_(c.ownPain), ownSolution: str_(c.ownSolution), ownOutcome: str_(c.ownOutcome), ownTools: str_(c.ownTools),
    trackerId: '', updated: ''
  };
}

/** Sessions a claim covers; old rows without a Sessions value use the use case's Session column. */
function sessionsOf_(x, ucTable) {
  if (x.sessions && x.sessions.length) return x.sessions;
  const uc = findUseCase_(ucTable, x.ucId);
  return uc && uc.session ? [uc.session] : [];
}

/**
 * Same rule as the page: the new claim keeps its sessions; the person's other claims lose those
 * sessions, and a claim left with no session is dropped.
 */
function stripOverlap_(list, c, ucTable) {
  const mine = sessionsOf_(c, ucTable);
  const out = [];
  list.forEach(function (x) {
    if (x === c || x.ucId === c.ucId || !sameEmail_(x.email, c.email)) { out.push(x); return; }
    const had = sessionsOf_(x, ucTable);
    const left = had.filter(function (s) { return mine.indexOf(s) < 0; });
    if (left.length === had.length) out.push(x);
    else if (left.length) out.push(Object.assign({}, x, { sessions: left }));
    else if (x.own) setUseCaseCells_(ucTable, x.ucId, { 'Stage': WITHDRAWN_STAGE });
  });
  return out;
}

/** What the page receives: adds "session" (first covered session), drops spreadsheet-only extras. */
function publicClaims_(claims) {
  return claims.map(function (x) {
    const o = Object.assign({}, x);
    delete o._extra;
    if (o.sessions && o.sessions.length) o.session = o.sessions[0]; else delete o.sessions;
    ['ownPain', 'ownSolution', 'ownOutcome', 'ownTools', 'trackerId', 'updated', 'assignedBy'].forEach(function (k) { if (!o[k]) delete o[k]; });
    if (!o.own) delete o.own;
    return o;
  });
}

function claimsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CLAIMS_TAB);
  if (!sh) {
    sh = ss.insertSheet(CLAIMS_TAB);
    sh.setFrozenRows(1);
  }
  return sh;
}

/** Returns the Claims header row, adding any missing column headers at the end. */
function claimHeaders_() {
  const sh = claimsSheet_();
  const lastCol = Math.max(1, sh.getLastColumn());
  const head = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim(); });
  while (head.length && !head[head.length - 1]) head.pop();
  CLAIM_FIELDS.forEach(function (f) {
    if (head.indexOf(f[0]) < 0) {
      head.push(f[0]);
      sh.getRange(1, head.length).setValue(f[0]).setFontWeight('bold');
    }
  });
  return head;
}

function fieldOf_(header) {
  for (let i = 0; i < CLAIM_FIELDS.length; i++) if (CLAIM_FIELDS[i][0] === header) return CLAIM_FIELDS[i][1];
  return null;
}

function readClaims_() {
  const head = claimHeaders_();
  const sh = claimsSheet_();
  const last = sh.getLastRow();
  if (last < 2) return [];
  const values = sh.getRange(2, 1, last - 1, head.length).getValues();
  const out = [];
  values.forEach(function (r) {
    const c = { _extra: {} };
    head.forEach(function (h, i) {
      const f = fieldOf_(h), v = r[i];
      if (!f) { if (h) c._extra[h] = v; return; }
      if (f === 'sessions') c.sessions = toSessions_(v);
      else if (f === 'own') c.own = /^(yes|true|1)$/i.test(String(v).trim());
      else if (f === 'created' || f === 'updated') c[f] = v instanceof Date ? v.toISOString() : String(v || '');
      else c[f] = String(v == null ? '' : v).trim();
    });
    if (!c.ucId || !c.email) return;
    if (!c.progress) c.progress = 'Not started';
    out.push(c);
  });
  return out;
}

function writeClaims_(claims) {
  const head = claimHeaders_();
  const sh = claimsSheet_();
  const last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, head.length).clearContent();
  if (!claims.length) return;
  const rows = claims.map(function (c) {
    return head.map(function (h) {
      const f = fieldOf_(h);
      if (!f) return c._extra && c._extra[h] !== undefined ? c._extra[h] : '';
      const v = c[f];
      if (f === 'sessions') return (v || []).join(', ');
      if (f === 'own') return v ? 'Yes' : '';
      if (f === 'created' || f === 'updated') { if (!v) return ''; const d = new Date(v); return isNaN(d.getTime()) ? v : d; }
      return v == null ? '' : v;
    });
  });
  const pidCol = head.indexOf('Participant #');
  if (pidCol >= 0) sh.getRange(2, pidCol + 1, rows.length, 1).setNumberFormat('@');
  sh.getRange(2, 1, rows.length, head.length).setValues(rows);
}

/* ---------- use cases tab ---------- */

function useCaseTable_() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USE_CASES_TAB);
  if (!sh) throw new Error('Tab "' + USE_CASES_TAB + '" not found.');
  const values = sh.getDataRange().getValues();
  const head = values[0].map(function (h) { return String(h).trim(); });
  return { sh: sh, values: values, head: head, col: function (name) { return head.indexOf(name); } };
}

function findRow_(t, id) {
  const iId = t.col('UC ID');
  for (let i = 1; i < t.values.length; i++) if (String(t.values[i][iId]).trim() === id) return i;
  return -1;
}

function findUseCase_(t, id) {
  const i = findRow_(t, id);
  if (i < 0) return null;
  const r = t.values[i], get = function (h) { const c = t.col(h); return c < 0 ? '' : String(r[c]).trim(); };
  const sm = get('Session').match(/[1-4]/);
  return {
    title: get('Use Case Title'),
    completed: /^complete/i.test(get('Status')),
    session: sm ? Number(sm[0]) : 0
  };
}

function nextUcId_(t, claims) {
  const iId = t.col('UC ID');
  let max = 0;
  const scan = function (v) { const m = /^UC-(\d+)/i.exec(String(v || '')); if (m) max = Math.max(max, Number(m[1])); };
  for (let i = 1; i < t.values.length; i++) scan(t.values[i][iId]);
  claims.forEach(function (c) { scan(c.ucId); });
  return 'UC-' + String(max + 1).padStart(3, '0');
}

function useCaseCells_(u) {
  return {
    'Use Case Title': str_(u.title), 'Use Case Description': str_(u.description),
    'Current Process': str_(u.pain), 'Proposed AI Solution': str_(u.solution), 'AI Tools': str_(u.tools),
    'Session': str_(u.sessions)
  };
}

function appendUseCase_(t, id, u) {
  const cells = Object.assign(useCaseCells_(u), {
    'UC ID': id, 'Submitted By': str_(u.submittedBy), 'Stage': str_(u.stage) || '1-Submitted',
    'Status': str_(u.status) || 'In Progress', 'Cluster': 'Participant submitted', 'Use Case Type': 'Other'
  });
  const row = t.head.map(function (h) { return cells[h] !== undefined ? cells[h] : ''; });
  t.sh.getRange(t.values.length + 1, 1, 1, row.length).setValues([row]);
  t.values.push(row);
}

function updateUseCase_(t, id, u) {
  setUseCaseCells_(t, id, useCaseCells_(u));
}

function setUseCaseCells_(t, id, cells) {
  const i = findRow_(t, id);
  if (i < 0) return;
  Object.keys(cells).forEach(function (h) {
    const c = t.col(h);
    if (c < 0) return;
    t.sh.getRange(i + 1, c + 1).setValue(cells[h]);
    t.values[i][c] = cells[h];
  });
}

/** Refreshes the Taken By / Progress / Taken On columns of the Use cases tab. */
function mirror_(claims) {
  const t = useCaseTable_();
  const rowsCount = t.values.length - 1;
  const byId = {};
  claims.forEach(function (c) { byId[c.ucId] = c; });
  const iId = t.col('UC ID');
  MIRROR_HEADERS.forEach(function (name, k) {
    let ci = t.col(name);
    if (ci < 0) {
      ci = t.head.length;
      t.head.push(name);
      t.sh.getRange(1, ci + 1).setValue(name);
    }
    if (rowsCount < 1) return;
    const col = [];
    for (let i = 1; i <= rowsCount; i++) {
      const c = byId[String(t.values[i][iId]).trim()];
      if (!c) { col.push(['']); continue; }
      if (k === 0) col.push([c.name]);
      else if (k === 1) col.push([c.progress]);
      else { const d = new Date(c.created); col.push([isNaN(d.getTime()) ? c.created : d]); }
    }
    t.sh.getRange(2, ci + 1, rowsCount, 1).setValues(col);
  });
}

function respond_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
