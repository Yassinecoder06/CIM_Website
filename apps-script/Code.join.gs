/**
 * CIM — Registration Handler (JoinPage only)
 * Handles: fullName, fieldOfStudy, levelOfStudy, facebookProfile, email, phone, comments
 * Deploy as Web App: Execute as Me, Who has access: Anyone
 * Sheet tab: CIM Registrations
 */

const CONFIG = {
  spreadsheetId: '1hMztarbViyPryg8FZznNDq0o1yVVXWGZnjPvnYlNvkk',
  sheetName: 'CIM Registrations',
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

const FIELDS = ['fullName', 'fieldOfStudy', 'levelOfStudy', 'facebookProfile', 'email', 'phone', 'comments'];
const STUDY_FIELDS = ['MPI', 'CBA', 'IMI', 'IIA', 'RT', 'GL', 'CH', 'BIO', 'MIQ'];
const STUDY_LEVELS = ['1', '2', '3', '4', '5'];
const MAX_LENGTH = 1000;
const HONEYPOT_FIELD = 'website';

function doPost(e) {
  const data = (e && e.parameter) ? e.parameter : {};
  if (e && e.postData && e.postData.type === 'application/json') {
    try {
      Object.assign(data, JSON.parse(e.postData.contents));
    } catch (err) {
      return jsonResponse_('error', 'Invalid JSON body.', clean_(data.callback));
    }
  }

  const returnOrigin = safeOrigin_(data.returnOrigin);
  const wantsJson = String(data.expectsJson || data.format || '').toLowerCase() === 'json';
  const callback = clean_(data.callback);

  // Honeypot — silently succeed
  if (clean_(data[HONEYPOT_FIELD])) {
    const msg = 'Your registration has been recorded.';
    return wantsJson ? jsonResponse_('success', msg, callback) : htmlResponse_(returnOrigin || '*', 'success', msg);
  }

  const err = validate_(data);
  if (err) {
    return wantsJson ? jsonResponse_('error', err, callback) : htmlResponse_(returnOrigin || '*', 'error', err);
  }

  try {
    const cache = CacheService.getScriptCache();
    const key = 'cim:' + clean_(data.email).toLowerCase();
    if (cache.get(key)) {
      const msg = 'A registration using this email was submitted recently. Please wait a moment before trying again.';
      return wantsJson ? jsonResponse_('error', msg, callback) : htmlResponse_(returnOrigin || '*', 'error', msg);
    }

    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      ...FIELDS.map(f => clean_(data[f])),
      clean_(data.formVersion) || 'cim-web-v1'
    ]);
    cache.put(key, '1', CONFIG.rateLimitSeconds);

    return wantsJson
      ? jsonResponse_('success', 'Your registration has been recorded. Welcome to CIM.', callback)
      : htmlResponse_(returnOrigin || '*', 'success', 'Your registration has been recorded. Welcome to CIM.');
  } catch (err) {
    console.error(err);
    const msg = String(err); // DEBUG: show real error
    return wantsJson ? jsonResponse_('error', msg, callback) : htmlResponse_(returnOrigin || '*', 'error', msg);
  }
}

function doGet(e) {
  const cb = e && e.parameter && e.parameter.callback;
  const payload = JSON.stringify({ status: 'ok', message: 'CIM Registration Handler is running. Use POST to submit.' });
  if (cb) return ContentService.createTextOutput(cb + '(' + payload + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(payload).setMimeType(ContentService.MimeType.JSON);
}

function doOptions() {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function getSheet_() {
  if (!CONFIG.spreadsheetId || CONFIG.spreadsheetId.indexOf('PASTE_') === 0) throw new Error('Set CONFIG.spreadsheetId');
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  let sheet = ss.getSheetByName(CONFIG.sheetName);
  if (!sheet) sheet = ss.insertSheet(CONFIG.sheetName);
  if (sheet.getLastRow() === 0) {
    const header = ['Timestamp', 'Full Name', 'Field of Study', 'Level of Study', 'Facebook Profile', 'Email', 'Phone Number', 'Comments', 'Form Version'];
    sheet.appendRow(header);
    sheet.getRange(1, 1, 1, header.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, header.length);
  }
  return sheet;
}

function validate_(data) {
  if (clean_(data.fullName).length < 2) return 'Please enter your full name.';
  if (STUDY_FIELDS.indexOf(clean_(data.fieldOfStudy)) === -1) return 'Please select a valid field of study.';
  if (STUDY_LEVELS.indexOf(clean_(data.levelOfStudy)) === -1) return 'Please select a valid level of study.';
  if (!clean_(data.facebookProfile)) return 'Please enter a Facebook profile or handle.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(data.email))) return 'Please enter a valid email address.';
  if (clean_(data.phone).length < 6) return 'Please enter a valid phone number.';
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

function htmlResponse_(targetOrigin, status, message) {
  const payload = JSON.stringify({ source: 'cim-registration', status, message }).replace(/</g, '\u003c');
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

function jsonResponse_(status, message, callback) {
  const out = JSON.stringify({ source: 'cim-registration', status, message });
  if (callback) return ContentService.createTextOutput(callback + '(' + out + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}

function testWrite(){
  try{
    Logger.log("ID: "+CONFIG.spreadsheetId);
    const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
    Logger.log("SS: "+ss.getName());
    const sh = getSheet_();
    Logger.log("Sheet: "+sh.getName()+" rows:"+sh.getLastRow());
    sh.appendRow([new Date(),"TEST-MANUAL","MPI","1","https://fb.com/test","test_manual_"+Date.now()+"@example.com","12345678","via editor","cim-web-v1"]);
    Logger.log("append ok");
  } catch(e){ Logger.log("ERROR: "+e.message+" \n"+e.stack); throw e; }
}