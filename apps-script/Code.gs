/**
 * CIM registration endpoint.
 *
 * Deploy as a Web App: execute as the owner, with access set to anyone.
 * This script intentionally accepts a native form POST so browser CORS is not
 * needed. It replies inside a hidden iframe using postMessage.
 */
const CONFIG = {
  // Set this to the ID in the Google Sheet URL, not the full URL.
  spreadsheetId: 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE',
  sheetName: 'CIM Registrations',
  // Each deployed website origin that may receive the result message.
  allowedReturnOrigins: ['https://your-cim-domain.example']
};

const FIELDS = ['fullName', 'fieldOfStudy', 'levelOfStudy', 'facebookProfile', 'email', 'phone', 'comments'];
const STUDY_FIELDS = ['MPI', 'CBA', 'IMI', 'IIA', 'RT', 'GL', 'CH', 'BIO', 'MIQ'];
const STUDY_LEVELS = ['1', '2', '3', '4', '5'];

function doPost(event) {
  const data = event && event.parameter ? event.parameter : {};
  const returnOrigin = safeOrigin_(data.returnOrigin);

  if (!returnOrigin) {
    return message_('', 'error', 'This registration request came from an unapproved website.');
  }

  // Silently acknowledge bots that complete the hidden honeypot field.
  if (clean_(data.website)) {
    return message_(returnOrigin, 'success', 'Your registration has been recorded.');
  }

  const validationMessage = validate_(data);
  if (validationMessage) return message_(returnOrigin, 'error', validationMessage);

  const cache = CacheService.getScriptCache();
  const rateLimitKey = `cim-registration:${clean_(data.email).toLowerCase()}`;
  if (cache.get(rateLimitKey)) {
    return message_(returnOrigin, 'error', 'A registration using this email was submitted recently. Please wait a moment before trying again.');
  }

  try {
    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      ...FIELDS.map((field) => clean_(data[field])),
      clean_(data.formVersion) || 'cim-web-v1'
    ]);
    cache.put(rateLimitKey, '1', 120);
    return message_(returnOrigin, 'success', 'Your registration has been recorded. Welcome to CIM.');
  } catch (error) {
    console.error(error);
    return message_(returnOrigin, 'error', 'The registration service is temporarily unavailable. Please try again later.');
  }
}

function getSheet_() {
  if (!CONFIG.spreadsheetId || CONFIG.spreadsheetId.indexOf('PASTE_') === 0) {
    throw new Error('Set CONFIG.spreadsheetId before deploying.');
  }
  const spreadsheet = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sheet = spreadsheet.getSheetByName(CONFIG.sheetName) || spreadsheet.insertSheet(CONFIG.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Full Name', 'Field of Study', 'Level of Study', 'Facebook Profile', 'Email', 'Phone Number', 'Comments', 'Form Version']);
    sheet.setFrozenRows(1);
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
  return CONFIG.allowedReturnOrigins.indexOf(origin) > -1 ? origin : '';
}

function clean_(value) {
  return String(value || '').trim().slice(0, 1000);
}

function message_(targetOrigin, status, message) {
  const payload = JSON.stringify({ source: 'cim-registration', status, message }).replace(/</g, '\\u003c');
  const target = JSON.stringify(targetOrigin || '*');
  const html = `<!doctype html><html><body><script>window.parent.postMessage(${payload}, ${target});</script></body></html>`;
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
