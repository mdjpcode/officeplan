/**
 * Google Apps Script Web App for office seating tracker.
 * Sheet name: Assignments
 * Columns: date | staff | location
 */
const SHEET_NAME = 'Assignments';

function doGet(e) {
  const date = (e.parameter.date || '').trim();
  if (!date) return jsonResponse({ error: 'Missing date' }, 400);

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();
  const layout = {};

  for (let i = 1; i < values.length; i++) {
    const [rowDate, staff, location] = values[i];
    if (String(rowDate) === date && staff && location) {
      if (!layout[location]) layout[location] = [];
      layout[location].push(staff);
    }
  }

  return jsonResponse({ date, layout });
}

function doPost(e) {
  const raw = (e && e.parameter && e.parameter.payload) || (e && e.postData && e.postData.contents) || '{}';
  const payload = JSON.parse(raw);
  const { date, staff, location } = payload;

  if (!date || !staff || !location) {
    return jsonResponse({ error: 'date, staff and location are required' }, 400);
  }

  const sheet = getSheet();
  const values = sheet.getDataRange().getValues();

  for (let i = values.length; i >= 2; i--) {
    const [rowDate, rowStaff] = sheet.getRange(i, 1, 1, 2).getValues()[0];
    if (String(rowDate) === date && rowStaff === staff) {
      sheet.deleteRow(i);
    }
  }

  if (location !== 'Unassigned') {
    sheet.appendRow([date, staff, location]);
  }

  return doGet({ parameter: { date } });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['date', 'staff', 'location']);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
