// Google Apps Script - Deploy this as a Web App
// Instructions:
// 1. Create a new Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Paste this code
// 4. Deploy > New deployment > Web app
// 5. Set "Execute as" to "Me" and "Who has access" to "Anyone"
// 6. Copy the deployment URL and use it in your teleprompter app

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  if (e.parameter.action === 'list') {
    return listScripts(sheet);
  } else if (e.parameter.action === 'load' && e.parameter.name) {
    return loadScript(sheet, e.parameter.name);
  } else if (e.parameter.action === 'save' && e.parameter.name && e.parameter.data) {
    // Handle save via GET request (to avoid CORS issues)
    try {
      const sessionData = JSON.parse(e.parameter.data);
      return saveScript(sheet, e.parameter.name, sessionData);
    } catch (error) {
      return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'save') {
      return saveScript(sheet, data.name, data.sessionData);
    } else if (data.action === 'delete') {
      return deleteScript(sheet, data.name);
    }

    return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function listScripts(sheet) {
  const data = sheet.getDataRange().getValues();
  const scripts = [];

  // Skip header row if exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {  // If name exists
      scripts.push({
        name: data[i][0],
        lastModified: data[i][1] || ''
      });
    }
  }

  return ContentService.createTextOutput(JSON.stringify({scripts: scripts}))
    .setMimeType(ContentService.MimeType.JSON);
}

function loadScript(sheet, name) {
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      try {
        const sessionData = JSON.parse(data[i][2]);
        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          sessionData: sessionData
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
          error: 'Failed to parse script data'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    error: 'Script not found'
  })).setMimeType(ContentService.MimeType.JSON);
}

function saveScript(sheet, name, sessionData) {
  const data = sheet.getDataRange().getValues();
  const timestamp = new Date().toLocaleString();
  let rowIndex = -1;

  // Check if script already exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex > 0) {
    // Update existing
    sheet.getRange(rowIndex, 2).setValue(timestamp);
    sheet.getRange(rowIndex, 3).setValue(JSON.stringify(sessionData));
  } else {
    // Add new row
    sheet.appendRow([name, timestamp, JSON.stringify(sessionData)]);
  }

  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    message: 'Script saved successfully'
  })).setMimeType(ContentService.MimeType.JSON);
}

function deleteScript(sheet, name) {
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === name) {
      sheet.deleteRow(i + 1);
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Script deleted'
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    error: 'Script not found'
  })).setMimeType(ContentService.MimeType.JSON);
}

// Initialize sheet with headers (run this once)
function initializeSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.clear();
  sheet.appendRow(['Script Name', 'Last Modified', 'Session Data']);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
}
