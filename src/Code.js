/**
 * Runs automatically when the sheet is opened.
 * Injects a custom menu item into the Google Sheets toolbar.
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Video List App')
    .addItem('Open Form Sidebar', 'showSidebar')
    .addToUi();
}

/**
 * Loads and renders the Index.html file as a right-hand sidebar.
 */
function showSidebar() {
  // 1. Use createTemplateFromFile (NOT createHtmlOutputFromFile)
  const template = HtmlService.createTemplateFromFile('Index');

  // 2. Evaluate the template to execute the <?!= include(...) ?> scriptlets
  const htmlOutput = template.evaluate().setTitle('Click and create prompt');

  // 3. Show on sidebar
  SpreadsheetApp.getUi().showSidebar(htmlOutput);
}

/**
 * Column headers for the submission sheet. The middle columns come from
 * videoFields so they always match the sidebar options.
 *
 * @return {string[]} 14 headers.
 */
function getSheetHeaders() {
  return [
    'No.',
    'Date Time',
    'Topic',
    ...videoFields.map((field) => field.label),
    'Prompt',
    'Status',
  ];
}

/**
 * Writes the header row when it is missing or does not match the current
 * layout. Returns true when the sheet was (re)initialised.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string[]} headers
 * @return {boolean}
 */
function ensureHeaders(sheet, headers) {
  const width = headers.length;

  if (sheet.getMaxColumns() < width) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
  }

  const current = sheet.getLastRow() === 0 ? [] : sheet.getRange(1, 1, 1, width).getValues()[0];
  const matches = headers.every((header, index) => current[index] === header);

  if (matches) {
    return false;
  }

  const headerRange = sheet.getRange(1, 1, 1, width);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  sheet.setFrozenRows(1);

  const widths = [60, 170, 260, ...videoFields.map(() => 220), 420, 110];
  widths.forEach((pixels, index) => sheet.setColumnWidth(index + 1, pixels));

  return true;
}

/**
 * Validates the sidebar payload and builds one sheet row.
 *
 * @param {{ topic?: string, fields?: Object<string, string> }} payload
 * @param {number} no Row number written in column A.
 * @param {Date} now Timestamp written in column B.
 * @param {string} status Value written in the Status column.
 * @return {Array<number|string|Date>} 14 cells, ready for appendRow.
 */
function buildRowValues(payload, no, now, status) {
  const topic = String((payload && payload.topic) || '');

  if (!dataTopicMap[topic]) {
    throw new Error('Please choose a valid topic.');
  }

  const fields = (payload && payload.fields) || {};
  const validated = {};

  const values = videoFields.map(({ key }) => {
    const value = String(fields[key] == null ? '' : fields[key]).trim();
    validated[key] = value;

    if (!value) {
      return '';
    }

    const allowed = (dataTopicReplacementMap[topic] || {})[key] || [];

    if (!allowed.includes(value)) {
      throw new Error(`"${value}" is not a valid ${key} option for this topic.`);
    }

    return value;
  });

  // Build the prompt from the validated values, never from the raw payload.
  const prompt = buildPrompt({ topic, fields: validated });

  return [no, now, dataTopicMap[topic], ...values, prompt, status];
}

/**
 * Finds the 1-based sheet row where the same prompt already exists.
 * Returns undefined when the prompt is new (or blank).
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {string} prompt
 * @param {number} promptColumn 1-based column of the Prompt header.
 * @return {number|undefined} Sheet row of the existing prompt.
 */
function findPromptRow(sheet, prompt, promptColumn) {
  const needle = String(prompt == null ? '' : prompt).trim();
  const lastRow = sheet.getLastRow();

  if (!needle || lastRow < 2) {
    return undefined;
  }

  const values = sheet.getRange(2, promptColumn, lastRow - 1, 1).getValues();
  const index = values.findIndex((row) => String(row[0]).trim() === needle);

  return index === -1 ? undefined : index + 2;
}

/**
 * Backend function invoked via google.script.run from the frontend.
 * Appends the selected values, the generated prompt, and a status to the active
 * sheet, creating or migrating the header row when needed.
 *
 * A prompt that already exists in the Prompt column is rejected: the row is not
 * appended and a message is returned instead.
 *
 * @return {{ success: boolean, message: string, row: number, duplicate?: boolean }}
 */
function submitDataToSheet(payload) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const headers = getSheetHeaders();

    ensureHeaders(sheet, headers);

    const promptColumn = headers.indexOf('Prompt') + 1;
    const dataRows = Math.max(0, sheet.getLastRow() - 1);
    const no = dataRows + 1;

    const candidate = buildRowValues(payload, no, new Date(), 'Pending');
    const existingRow = findPromptRow(sheet, candidate[promptColumn - 1], promptColumn);
    const row = existingRow === undefined ? candidate : undefined;

    // Duplicate prompt: do not append, tell the user where it already lives.
    if (row === undefined) {
      return {
        success: false,
        duplicate: true,
        message: `This prompt already exists in row ${existingRow}. Nothing was added.`,
        row: existingRow,
      };
    }

    sheet.appendRow(row);

    const rowIndex = sheet.getLastRow();
    sheet.getRange(rowIndex, 1).setNumberFormat('0');
    sheet.getRange(rowIndex, 2).setNumberFormat('yyyy-mm-dd hh:mm:ss');
    sheet.getRange(rowIndex, promptColumn).setWrap(true);
    sheet.getRange(rowIndex, 1, 1, headers.length).setVerticalAlignment('top');

    return {
      success: true,
      message: `Saved #${no} — ${dataTopicMap[payload.topic]}`,
      row: rowIndex,
    };
  } catch (err) {
    throw new Error(err.message, { cause: err });
  }
}
