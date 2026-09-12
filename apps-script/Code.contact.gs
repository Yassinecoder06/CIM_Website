/**
 * CIM — Contact Handler (GetInTouch only)
 * Handles: name, email, phone, message
 * Deploy as NEW Web App: Execute as Me, Who has access: Anyone
 * Sheet tab: Submissions (same spreadsheet as registrations, different tab)
 * After deploy, paste its /exec URL into .env VITE_CONTACT_ENDPOINT=
 */

const CONFIG = {
  sheetName: 'Submissions',
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

// Script Properties (Project Settings > Script Properties) take precedence over hardcoded CONFIG.
// Set SPREADSHEET_ID = <Sheet ID> and optionally SHEET_NAME = <tab name>.
function getSpreadsheetId_() {
  const v = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (v && v.trim()) return v.trim();
  throw new Error('Missing Script Property SPREADSHEET_ID — set it in Project Settings > Script Properties');
}
function getSheetName_() {
  try {
    const v = PropertiesService.getScriptProperties().getProperty('SHEET_NAME');
    if (v && v.trim()) return v.trim();
  } catch (e) {}
  return CONFIG.sheetName;
}
function setup() {
  const sh = getSheet_();
  Logger.log('Sheet ready: %s (spreadsheet %s)', sh.getName(), getSpreadsheetId_());
}

const FIELDS = ['name', 'email', 'phone', 'message'];
const MAX_LENGTH = 1000;
const HONEYPOT_FIELD = 'website';

function doPost(e) {
  const data = (e && e.parameter) ? e.parameter : {};
  if (e && e.postData && e.postData.type === 'application/json') {
    try { Object.assign(data, JSON.parse(e.postData.contents)); }
    catch (err) { return jsonResponse_('error', 'Invalid JSON body.', clean_(data.callback)); }
  }
  const returnOrigin = safeOrigin_(data.returnOrigin);
  const wantsJson = String(data.expectsJson || data.format || '').toLowerCase() === 'json';
  const callback = clean_(data.callback);

  if (clean_(data[HONEYPOT_FIELD])) {
    return wantsJson ? jsonResponse_('success', 'Your message has been recorded. Thank you!', callback)
                     : htmlResponse_(returnOrigin || '*', 'success', 'Your message has been recorded. Thank you!');
  }

  const err = validate_(data);
  if (err) {
    return wantsJson ? jsonResponse_('error', err, callback) : htmlResponse_(returnOrigin || '*', 'error', err);
  }

  try {
    const cache = CacheService.getScriptCache();
    const key = 'cim-contact:' + clean_(data.email).toLowerCase();
    if (cache.get(key)) {
      const msg = 'A message using this email was submitted recently. Please wait a moment before trying again.';
      return wantsJson ? jsonResponse_('error', msg, callback) : htmlResponse_(returnOrigin || '*', 'error', msg);
    }
    const sheet = getSheet_();
    sheet.appendRow([new Date(), ...FIELDS.map(f => clean_(data[f] || (f==='phone'?'—':'')) , clean_(data.formVersion) || 'get-in-touch-v1')]);
    cache.put(key, '1', CONFIG.rateLimitSeconds);
    return wantsJson ? jsonResponse_('success', 'Your message has been recorded. Thank you!', callback)
                     : htmlResponse_(returnOrigin || '*', 'success', 'Your message has been recorded. Thank you!');
  } catch (err) {
    console.error(err);
    const msg = String(err);
    return wantsJson ? jsonResponse_('error', msg, callback) : htmlResponse_(returnOrigin || '*', 'error', msg);
  }
}

function doGet(e){
  const cb=e&&e.parameter&&e.parameter.callback;
  const p=JSON.stringify({status:'ok',message:'CIM Contact Handler is running. Use POST to submit.'});
  if(cb) return ContentService.createTextOutput(cb+'('+p+')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(p).setMimeType(ContentService.MimeType.JSON);
}
function doOptions(){ return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT); }

function getSheet_(){
  const sid=getSpreadsheetId_();
  const sname=getSheetName_();
  if(!sid) throw new Error('Missing Script Property SPREADSHEET_ID — set it in Project Settings > Script Properties');
  const ss=SpreadsheetApp.openById(sid);
  let sheet=ss.getSheetByName(sname);
  if(!sheet) sheet=ss.insertSheet(sname);
  if(sheet.getLastRow()===0){
    const h=['Timestamp','Name','Email','Phone','Message','Form Version'];
    sheet.appendRow(h); sheet.getRange(1,1,1,h.length).setFontWeight('bold'); sheet.setFrozenRows(1); sheet.autoResizeColumns(1,h.length);
  }
  return sheet;
}
function validate_(data){
  if(clean_(data.name).length<2) return 'Please enter your name (at least 2 characters).';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean_(data.email))) return 'Please enter a valid email address.';
  // phone is optional — allow '—' placeholder from old frontend, validate only if real phone provided
  const ph = clean_(data.phone);
  if(ph && ph !== '—' && ph.length < 6) return 'Please enter a valid phone number (at least 6 characters).';
  if(clean_(data.message).length<5) return 'Please enter a message (at least 5 characters).';
  return '';
}
function safeOrigin_(o){
  if(!o) return ''; o=String(o).trim(); if(!o) return '';
  if(!CONFIG.allowedReturnOrigins||CONFIG.allowedReturnOrigins.length===0) return o;
  if(CONFIG.allowedReturnOrigins.indexOf(o)>-1) return o;
  if(o.indexOf('http://localhost:')===0||o.indexOf('http://127.0.0.1:')===0) return o;
  try{ const u=new URL(o); if(u.protocol==='http:'||u.protocol==='https:') return o; }catch{}
  if(o.indexOf('http://')===0||o.indexOf('https://')===0) return o;
  return '';
}
function clean_(v){ return String(v||'').trim().slice(0,MAX_LENGTH); }
function htmlResponse_(targetOrigin,status,message){
  const payload=JSON.stringify({source:'cim-form',status,message}).replace(/</g,'\\u003c');
  const target=JSON.stringify(targetOrigin||'*');
  const html=`<!doctype html><html><body><script>
(function(){
  var data=${payload};
  var target=${target};
  function send(w){ try{ w.postMessage(data, target); }catch(e){} }
  send(window.parent); send(window.top);
  try{ send(window.parent.parent); }catch(e){}
  try{ if(window.top!==window) window.top.postMessage(data, "*"); }catch(e){}
})();
</script></body></html>`;
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function jsonResponse_(status,message,callback){
  const out=JSON.stringify({source:'cim-form',status,message});
  if(callback) return ContentService.createTextOutput(callback+'('+out+')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}
function testWrite(){
  const sh=getSheet_();
  sh.appendRow([new Date(),"Test User","test_"+Date.now()+"@example.com","12345678","Hello from editor","get-in-touch-v1"]);
  Logger.log("append ok to "+sh.getName()+" rows:"+sh.getLastRow());
}
