const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = path.join(__dirname, '..', 'src');

/**
 * GAS files are globals, not modules: load them into a VM context and pull the
 * names out through a trailing expression. Extra globals (e.g. SpreadsheetApp)
 * can be injected through the sandbox.
 */
function loadAppsScript(files, sandbox = {}) {
  const source = files.map((file) => readFileSync(path.join(SRC, file), 'utf8')).join('\n');
  const names =
    ';({ buildPrompt, PROMPT_TEMPLATE, videoFields, dataTopicMap, dataTopicReplacementMap,' +
    ' buildRowValues, getSheetHeaders, submitDataToSheet, findPromptRow })';

  return vm.runInNewContext(`${source}\n${names}`, sandbox);
}

const app = loadAppsScript(['DataStore.js', 'Prompt.js', 'Code.js']);

const { buildPrompt, PROMPT_TEMPLATE, videoFields, dataTopicMap, dataTopicReplacementMap } = app;
const { buildRowValues, getSheetHeaders, submitDataToSheet, findPromptRow } = app;

const fieldKeys = Array.from(videoFields, ({ key }) => key);
const fieldLabels = Array.from(videoFields, ({ label }) => label);
const NOW = new Date('2026-11-08T09:43:41.000Z');

function payloadFor(topic, overrides = {}) {
  const fields = {};
  for (const key of fieldKeys) {
    const values = (dataTopicReplacementMap[topic] || {})[key] || [];
    fields[key] = values.length ? values[0] : '';
  }
  return { topic, fields: { ...fields, ...overrides } };
}

/* ------------------------------------------------------------------ */
/* Minimal SpreadsheetApp double                                      */
/* ------------------------------------------------------------------ */

class FakeRange {
  constructor(sheet, row, col, numRows = 1, numCols = 1) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValues() {
    return Array.from({ length: this.numRows }, (_, r) =>
      Array.from({ length: this.numCols }, (_, c) => this.sheet.getCell(this.row + r, this.col + c))
    );
  }

  setValues(values) {
    values.forEach((rowValues, r) =>
      rowValues.forEach((value, c) => {
        this.sheet.setCell(this.row + r, this.col + c, value);
      })
    );
  }

  setFontWeight(weight) {
    this.sheet.formats.push({ row: this.row, col: this.col, fontWeight: weight });
  }

  setNumberFormat(format) {
    this.sheet.formats.push({ row: this.row, col: this.col, numberFormat: format });
  }

  setWrap(wrap) {
    this.sheet.formats.push({ row: this.row, col: this.col, wrap });
  }

  setVerticalAlignment(alignment) {
    this.sheet.formats.push({ row: this.row, col: this.col, verticalAlignment: alignment });
  }
}

class FakeSheet {
  constructor(rows = []) {
    this.cells = new Map();
    this.maxColumns = 26;
    this.frozenRows = 0;
    this.widths = {};
    this.formats = [];
    this.appended = [];

    rows.forEach((values, r) => values.forEach((value, c) => this.setCell(r + 1, c + 1, value)));
  }

  static key(row, col) {
    return `${row}:${col}`;
  }

  getCell(row, col) {
    return this.cells.has(FakeSheet.key(row, col)) ? this.cells.get(FakeSheet.key(row, col)) : null;
  }

  setCell(row, col, value) {
    this.cells.set(FakeSheet.key(row, col), value);
  }

  getLastRow() {
    let last = 0;
    for (const key of this.cells.keys()) {
      last = Math.max(last, Number(key.split(':')[0]));
    }
    return last;
  }

  getLastColumn() {
    let last = 0;
    for (const key of this.cells.keys()) {
      last = Math.max(last, Number(key.split(':')[1]));
    }
    return last;
  }

  getMaxColumns() {
    return this.maxColumns;
  }

  insertColumnsAfter(_after, count) {
    this.maxColumns += count;
  }

  getRange(row, col, numRows = 1, numCols = 1) {
    return new FakeRange(this, row, col, numRows, numCols);
  }

  appendRow(values) {
    const row = this.getLastRow() + 1;
    values.forEach((value, index) => this.setCell(row, index + 1, value));
    this.appended.push(values);
  }

  setFrozenRows(count) {
    this.frozenRows = count;
  }

  setColumnWidth(col, pixels) {
    this.widths[col] = pixels;
  }

  readRow(row, width) {
    return Array.from({ length: width }, (_, index) => this.getCell(row, index + 1));
  }
}

function withFakeSheet(sheet) {
  return loadAppsScript(['DataStore.js', 'Prompt.js', 'Code.js'], {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getActiveSheet: () => sheet }),
    },
  });
}

const isDate = (value) => Object.prototype.toString.call(value) === '[object Date]';

/* ------------------------------------------------------------------ */
/* Headers                                                            */
/* ------------------------------------------------------------------ */

test('headers are No., Date Time, Topic, 9 fields, Prompt, Status', () => {
  const headers = Array.from(getSheetHeaders());

  assert.equal(headers.length, 14);
  assert.deepEqual(headers.slice(0, 3), ['No.', 'Date Time', 'Topic']);
  assert.deepEqual(headers.slice(3, 12), fieldLabels);
  assert.deepEqual(headers.slice(12), ['Prompt', 'Status']);
});

/* ------------------------------------------------------------------ */
/* buildRowValues                                                     */
/* ------------------------------------------------------------------ */

test('buildRowValues returns 14 cells', () => {
  assert.equal(buildRowValues(payloadFor('1'), 7, NOW, 'Pending').length, 14);
});

test('buildRowValues puts number, date and topic label first', () => {
  const row = buildRowValues(payloadFor('1'), 7, NOW, 'Pending');

  assert.equal(row[0], 7);
  assert.ok(isDate(row[1]));
  assert.equal(row[1].getTime(), NOW.getTime());
  assert.equal(row[2], dataTopicMap['1']);
});

test('buildRowValues keeps videoFields order for the 9 field values', () => {
  const payload = payloadFor('2');
  const row = buildRowValues(payload, 1, NOW, 'Pending');

  fieldKeys.forEach((key, index) => {
    assert.equal(row[3 + index], payload.fields[key], `column for ${key}`);
  });
});

test('buildRowValues appends the generated prompt and the status', () => {
  const payload = payloadFor('3');
  const row = buildRowValues(payload, 1, NOW, 'Pending');

  assert.equal(row[12], buildPrompt({ topic: '3', fields: payload.fields }));
  assert.equal(row[13], 'Pending');
});

test('buildRowValues prompt contains every selected value', () => {
  const payload = payloadFor('1');
  const row = buildRowValues(payload, 1, NOW, 'Pending');

  for (const key of fieldKeys) {
    assert.ok(row[12].includes(payload.fields[key]), `prompt missing ${key}`);
  }
});

test('buildRowValues trims values', () => {
  const row = buildRowValues(
    { topic: '1', fields: { ...payloadFor('1').fields, SETTING: '  a quiet bamboo forest  ' } },
    1,
    NOW,
    'Pending'
  );

  assert.equal(row[3], 'a quiet bamboo forest');
});

test('buildRowValues writes blanks for an all-empty field set', () => {
  const fields = Object.fromEntries(fieldKeys.map((key) => [key, '']));
  const row = buildRowValues({ topic: '1', fields }, 1, NOW, 'Pending');

  assert.deepEqual(
    Array.from(row.slice(3, 12)),
    fieldKeys.map(() => '')
  );
  assert.equal(row[12], PROMPT_TEMPLATE);
  assert.equal(row[13], 'Pending');
});

test('buildRowValues rejects an unknown topic', () => {
  assert.throws(
    () => buildRowValues({ topic: '99', fields: {} }, 1, NOW, 'Pending'),
    /valid topic/
  );
  assert.throws(() => buildRowValues({ topic: '', fields: {} }, 1, NOW, 'Pending'), /valid topic/);
});

test('buildRowValues rejects a value that is not offered for the topic', () => {
  const payload = payloadFor('1');

  assert.throws(
    () =>
      buildRowValues(
        { topic: '1', fields: { ...payload.fields, SETTING: 'hacked' } },
        1,
        NOW,
        'Pending'
      ),
    /not a valid SETTING/
  );
  assert.throws(
    () =>
      buildRowValues(
        { topic: '1', fields: { ...payload.fields, MOOD: 'furious' } },
        1,
        NOW,
        'Pending'
      ),
    /not a valid MOOD/
  );
});

test('buildRowValues ignores payload keys outside videoFields', () => {
  const row = buildRowValues({ ...payloadFor('1'), evil: 'x' }, 1, NOW, 'Pending');
  const rowWithExtraField = buildRowValues(
    { topic: '1', fields: { ...payloadFor('1').fields, EVIL: 'x' } },
    1,
    NOW,
    'Pending'
  );

  assert.equal(row.length, 14);
  assert.deepEqual(
    Array.from(rowWithExtraField),
    Array.from(buildRowValues(payloadFor('1'), 1, NOW, 'Pending'))
  );
});

/* ------------------------------------------------------------------ */
/* submitDataToSheet (fake spreadsheet)                               */
/* ------------------------------------------------------------------ */

test('first submit writes headers and appends a 14-cell row', () => {
  const sheet = new FakeSheet();
  const { submitDataToSheet: submit } = withFakeSheet(sheet);

  const result = submit(payloadFor('1'));

  assert.equal(result.success, true);
  assert.equal(result.row, 2);
  assert.match(result.message, /^Saved #1 — Walking in a Bamboo Forest$/);
  assert.equal(sheet.frozenRows, 1);
  assert.deepEqual(Array.from(sheet.readRow(1, 14)), Array.from(getSheetHeaders()));

  assert.equal(sheet.getCell(2, 1), 1);
  assert.ok(isDate(sheet.getCell(2, 2)));
  assert.equal(sheet.getCell(2, 3), 'Walking in a Bamboo Forest');
  assert.equal(sheet.getCell(2, 13), buildPrompt(payloadFor('1')));
  assert.equal(sheet.getCell(2, 14), 'Pending');
});

test('first submit formats the new row', () => {
  const sheet = new FakeSheet();
  const { submitDataToSheet: submit } = withFakeSheet(sheet);

  submit(payloadFor('1'));

  assert.ok(
    sheet.formats.some((entry) => entry.row === 2 && entry.col === 1 && entry.numberFormat === '0')
  );
  assert.ok(
    sheet.formats.some(
      (entry) => entry.row === 2 && entry.col === 2 && entry.numberFormat === 'yyyy-mm-dd hh:mm:ss'
    )
  );
  assert.ok(
    sheet.formats.some((entry) => entry.row === 2 && entry.col === 13 && entry.wrap === true)
  );
  assert.ok(
    sheet.formats.some(
      (entry) => entry.row === 2 && entry.col === 1 && entry.verticalAlignment === 'top'
    )
  );
});

test('subsequent submits keep the header and increment the number', () => {
  const sheet = new FakeSheet();
  const { submitDataToSheet: submit } = withFakeSheet(sheet);

  submit(payloadFor('1'));
  const second = submit(payloadFor('2'));

  assert.equal(second.row, 3);
  assert.equal(sheet.getCell(3, 1), 2);
  assert.equal(sheet.getCell(3, 3), 'Cherry Blossom Tree in Full Bloom');
  assert.equal(sheet.appended.length, 2);
  assert.deepEqual(Array.from(sheet.readRow(1, 14)), Array.from(getSheetHeaders()));
});

test('an old 2-column header is rewritten before appending', () => {
  const sheet = new FakeSheet([['Timestamp', 'Topic']]);
  const { submitDataToSheet: submit } = withFakeSheet(sheet);

  submit(payloadFor('1'));

  assert.deepEqual(Array.from(sheet.readRow(1, 14)), Array.from(getSheetHeaders()));
  assert.equal(sheet.getCell(2, 3), 'Walking in a Bamboo Forest');
  assert.equal(sheet.getCell(2, 14), 'Pending');
});

test('a tampered payload surfaces an error and writes nothing', () => {
  const sheet = new FakeSheet();
  const { submitDataToSheet: submit } = withFakeSheet(sheet);

  assert.throws(
    () => submit({ topic: '1', fields: { ...payloadFor('1').fields, SETTING: 'hacked' } }),
    /not a valid SETTING/
  );
  assert.equal(sheet.appended.length, 0);
});

/* ------------------------------------------------------------------ */
/* Duplicate prompts                                                  */
/* ------------------------------------------------------------------ */

test('findPromptRow returns undefined on an empty sheet', () => {
  assert.equal(findPromptRow(new FakeSheet(), 'anything', 13), undefined);
});

test('findPromptRow returns undefined when only the header exists', () => {
  const sheet = new FakeSheet();
  sheet.setCell(1, 13, 'Prompt');

  assert.equal(findPromptRow(sheet, 'anything', 13), undefined);
});

test('findPromptRow returns the sheet row of an existing prompt', () => {
  const sheet = new FakeSheet();
  const { submitDataToSheet: submit } = withFakeSheet(sheet);

  submit(payloadFor('1'));

  assert.equal(findPromptRow(sheet, buildPrompt(payloadFor('1')), 13), 2);
  assert.equal(findPromptRow(sheet, 'some other prompt', 13), undefined);
});

test('findPromptRow ignores blank prompts', () => {
  const sheet = new FakeSheet();
  sheet.setCell(1, 13, 'Prompt');
  sheet.setCell(2, 13, '   ');

  assert.equal(findPromptRow(sheet, '', 13), undefined);
  assert.equal(findPromptRow(sheet, '   ', 13), undefined);
});

test('a duplicate prompt is not appended and returns a message', () => {
  const sheet = new FakeSheet();
  const { submitDataToSheet: submit } = withFakeSheet(sheet);

  const first = submit(payloadFor('1'));
  const duplicate = submit(payloadFor('1'));

  assert.equal(first.success, true);
  assert.equal(duplicate.success, false);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.row, 2);
  assert.match(duplicate.message, /already exists in row 2/);

  assert.equal(sheet.appended.length, 1);
  assert.equal(sheet.getLastRow(), 2);
  assert.equal(sheet.getCell(2, 1), 1);
  assert.equal(sheet.getCell(2, 3), 'Walking in a Bamboo Forest');
});

test('a different prompt still appends after a rejected duplicate', () => {
  const sheet = new FakeSheet();
  const { submitDataToSheet: submit } = withFakeSheet(sheet);

  submit(payloadFor('1'));
  assert.equal(submit(payloadFor('1')).success, false);

  const settings = dataTopicReplacementMap['1'].SETTING;
  const second = submit({
    topic: '1',
    fields: { ...payloadFor('1').fields, SETTING: settings[1] },
  });

  assert.equal(second.success, true);
  assert.equal(second.row, 3);
  assert.equal(sheet.getCell(3, 1), 2);
  assert.equal(sheet.appended.length, 2);
});
