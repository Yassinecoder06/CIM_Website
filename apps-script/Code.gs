/**
 * CIM — Unified Form Handler (Registration + Contact)
 * ONE Apps Script project, ONE spreadsheet (same Excel file), TWO tabs:
 *  - "CIM Registration" : JoinPage (fullName, fieldOfStudy, levelOfStudy, facebookProfile, email, phone, comments)
 *  - "Submission"       : GetInTouch (name, email, phone, message)
 *
 * SETUP:
 *  1. Paste this file as Code.gs in ONE Apps Script project.
 *  2. Project Settings > Script Properties > add:
 *       SPREADSHEET_ID = <the single Google Sheet ID>
 *     (optional overrides: REGISTRATION_SHEET_NAME, CONTACT_SHEET_NAME)
 *  3. Run setup() once, then Deploy > Web app > Execute as Me, Anyone.
 *  4. Paste the ONE /exec URL into .env as BOTH
 *     VITE_REGISTRATION_ENDPOINT and VITE_CONTACT_ENDPOINT.
 */

const CONFIG = {
  registrationSheetName: 'CIM Registration',
  contactSheetName: 'Submission',
  allowedReturnOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://localhost:4175',
    'https://your-cim-domain.example',
    'https://cim-insat.example.com'
  ],
  rateLimitSeconds: 60
};

const REGISTRATION_FIELDS = ['fullName', 'fieldOfStudy', 'levelOfStudy', 'facebookProfile', 'email', 'phone', 'comments'];
const CONTACT_FIELDS = ['name', 'email', 'phone', 'message'];
const STUDY_FIELDS = ['MPI', 'CBA', 'IMI', 'IIA', 'RT', 'GL', 'CH', 'BIO', 'MIQ'];
const STUDY_LEVELS = ['1', '2', '3', '4', '5'];
const MAX_LENGTH = 1000;
const HONEYPOT_FIELD = 'website';

// Script Properties — single source of truth, nothing hardcoded.
function getSpreadsheetId_() {
  const v = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (v && v.trim()) return v.trim();
  throw new Error('Missing Script Property SPREADSHEET_ID — set it in Project Settings > Script Properties');
}
function getRegistrationSheetName_() {
  const v = PropertiesService.getScriptProperties().getProperty('REGISTRATION_SHEET_NAME');
  if (v && v.trim()) return v.trim();
  return CONFIG.registrationSheetName;
}
function getContactSheetName_() {
  const v = PropertiesService.getScriptProperties().getProperty('CONTACT_SHEET_NAME');
  if (v && v.trim()) return v.trim();
  return CONFIG.contactSheetName;
}
function setup() {
  const r = getRegistrationSheet_();
  const c = getContactSheet_();
  Logger.log('Sheets ready: %s + %s (spreadsheet %s)', r.getName(), c.getName(), getSpreadsheetId_());
}

function doPost(e) {
  const data = (e && e.parameter) ? e.parameter : {};
  if (e && e.postData && e.postData.type === 'application/json') {
    try {
      Object.assign(data, JSON.parse(e.postData.contents));
    } catch (err) {
      return jsonResponse_('error', 'Invalid JSON body.', false, clean_(data.callback));
    }
  }

  const returnOrigin = safeOrigin_(data.returnOrigin);
  const wantsJson = String(data.expectsJson || data.format || '').toLowerCase() === 'json';
  const callback = clean_(data.callback);
  const formVersion = String(data.formVersion || '').toLowerCase();

  // Route: formVersion is authoritative, field presence as fallback.
  let isRegistration;
  if (formVersion.indexOf('get-in-touch') === 0) isRegistration = false;
  else if (formVersion.indexOf('cim-web') === 0) isRegistration = true;
  else if (data.fullName && !data.name) isRegistration = true;
  else if (data.name && !data.fullName) isRegistration = false;
  else isRegistration = !!(data.fullName || data.fieldOfStudy);

  // Honeypot — silently succeed (no row, but UI shows success).
  if (clean_(data[HONEYPOT_FIELD])) {
    const msg = isRegistration ? 'Your registration has been recorded.' : 'Your message has been recorded. Thank you!';
    return wantsJson ? jsonResponse_('success', msg, isRegistration, callback) : htmlResponse_(returnOrigin || '*', 'success', msg, isRegistration);
  }

  const err = isRegistration ? validateRegistration_(data) : validateContact_(data);
  if (err) {
    return wantsJson ? jsonResponse_('error', err, isRegistration, callback) : htmlResponse_(returnOrigin || '*', 'error', err, isRegistration);
  }

  try {
    const cache = CacheService.getScriptCache();
    const key = (isRegistration ? 'cim:' : 'cim-contact:') + clean_(data.email).toLowerCase();
    if (cache.get(key)) {
      const msg = 'A submission using this email was sent recently. Please wait a moment before trying again.';
      return wantsJson ? jsonResponse_('error', msg, isRegistration, callback) : htmlResponse_(returnOrigin || '*', 'error', msg, isRegistration);
    }

    if (isRegistration) {
      const sheet = getRegistrationSheet_();
      sheet.appendRow([
        new Date(),
        ...REGISTRATION_FIELDS.map(f => clean_(data[f])),
        clean_(data.formVersion) || 'cim-web-v1'
      ]);
    } else {
      const sheet = getContactSheet_();
      sheet.appendRow([
        new Date(),
        ...CONTACT_FIELDS.map(f => clean_(data[f] || (f === 'phone' ? '—' : ''))),
        clean_(data.formVersion) || 'get-in-touch-v1'
      ]);
    }
    cache.put(key, '1', CONFIG.rateLimitSeconds);

    const msg = isRegistration ? 'Your registration has been recorded. Welcome to CIM.' : 'Your message has been recorded. Thank you!';
    return wantsJson ? jsonResponse_('success', msg, isRegistration, callback) : htmlResponse_(returnOrigin || '*', 'success', msg, isRegistration);
  } catch (err) {
    console.error(err);
    const msg = String(err);
    return wantsJson ? jsonResponse_('error', msg, isRegistration, callback) : htmlResponse_(returnOrigin || '*', 'error', msg, isRegistration);
  }
}

function doGet(e) {
  const cb = e && e.parameter && e.parameter.callback;
  const payload = JSON.stringify({ status: 'ok', message: 'CIM Unified Handler is running. Use POST to submit.' });
  if (cb) return ContentService.createTextOutput(cb + '(' + payload + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}
function doOptions() {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function getRegistrationSheet_() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const sname = getRegistrationSheetName_();
  let sheet = ss.getSheetByName(sname);
  if (!sheet) sheet = ss.insertSheet(sname);
  if (sheet.getLastRow() === 0) {
    const header = ['Timestamp', 'Full Name', 'Field of Study', 'Level of Study', 'Facebook Profile', 'Email', 'Phone Number', 'Comments', 'Form Version'];
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, header.length);
  }
  return sheet;
}
function getContactSheet_() {
  const ss = SpreadsheetApp.openById(getSpreadsheetId_());
  const sname = getContactSheetName_();
  let sheet = ss.getSheetByName(sname);
  if (!sheet) sheet = ss.insertSheet(sname);
  if (sheet.getLastRow() === 0) {
    const header = ['Timestamp', 'Name', 'Email', 'Phone', 'Message', 'Form Version'];
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, header.length);
  }
  return sheet;
}

function validateRegistration_(data) {
  if (clean_(data.fullName).length < 2) return 'Please enter your full name.';
  if (STUDY_FIELDS.indexOf(clean_(data.fieldOfStudy)) === -1) return 'Please select a valid field of study.';
  if (STUDY_LEVELS.indexOf(clean_(data.levelOfStudy)) === -1) return 'Please select a valid level of study.';
  if (!clean_(data.facebookProfile)) return 'Please enter a Facebook profile or handle.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(data.email))) return 'Please enter a valid email address.';
  if (clean_(data.phone).length < 6) return 'Please enter a valid phone number.';
  return '';
}
function validateContact_(data) {
  if (clean_(data.name).length < 2) return 'Please enter your name (at least 2 characters).';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(data.email))) return 'Please enter a valid email address.';
  const ph = clean_(data.phone);
  if (ph && ph !== '—' && ph.length < 6) return 'Please enter a valid phone number (at least 6 characters).';
  if (clean_(data.message).length < 5) return 'Please enter a message (at least 5 characters).';
  return '';
}

function safeOrigin_(origin) {
  if (!origin) return '';
  const o = String(origin).trim();
  if (!o) return '';
  if (!CONFIG.allowedReturnOrigins || CONFIG.allowedReturnOrigins.length === 0) return o;
  if (CONFIG.allowedReturnOrigins.indexOf(o) > -1) return o;
  if (o.indexOf('http://localhost:') === 0 || o.indexOf('http://127.0.0.1:') === 0) return o;
  try {
    const u = new URL(o);
    if (u.protocol === 'http:' || u.protocol === 'https:') return o;
  } catch {}
  if (o.indexOf('http://') === 0 || o.indexOf('https://') === 0) return o;
  return '';
}
function clean_(v) { return String(v || '').trim().slice(0, MAX_LENGTH); }

function htmlResponse_(targetOrigin, status, message, isRegistration) {
  const source = isRegistration ? 'cim-registration' : 'cim-form';
  const payload = JSON.stringify({ source, status, message }).replace(/</g, '\\u003c');
  const target = JSON.stringify(targetOrigin || '*');
  const html = `<!doctype html><html><body><script>
(function(){
  var data=${payload};
  var target=${target};
  function send(w){ try{ w.postMessage(data, target); }catch(e){} }
  send(window.parent);
  send(window.top);
  try{ send(window.parent.parent); }catch(e){}
  try{ if(window.top!==window) window.top.postMessage(data, "*"); }catch(e){}
})();
</script></body></html>`;
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function jsonResponse_(status, message, isRegistration, callback) {
  const source = isRegistration ? 'cim-registration' : 'cim-form';
  const out = JSON.stringify({ source, status, message });
  if (callback) return ContentService.createTextOutput(callback + '(' + out + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

function testWriteRegistration() {
  const sh = getRegistrationSheet_();
  sh.appendRow([new Date(), 'TEST-MANUAL', 'MPI', '1', 'https://fb.com/test', 'test_manual_' + Date.now() + '@example.com', '12345678', 'via editor', 'cim-web-v1']);
  Logger.log('append ok to ' + sh.getName() + ' rows:' + sh.getLastRow());
}
function testWriteContact() {
  const sh = getContactSheet_();
  sh.appendRow([new Date(), 'Test User', 'test_' + Date.now() + '@example.com', '12345678', 'Hello from editor', 'get-in-touch-v1']);
  Logger.log('append ok to ' + sh.getName() + ' rows:' + sh.getLastRow());
}
