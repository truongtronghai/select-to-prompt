const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = path.join(__dirname, '..', 'src');
const FIXTURES = path.join(__dirname, 'fixtures');

/**
 * GAS files are globals, not modules: load them into a VM context and pull the
 * names out through a trailing expression.
 */
function loadAppsScript(...files) {
  const source = files.map((file) => readFileSync(path.join(SRC, file), 'utf8')).join('\n');
  const names = ';({ buildPrompt, PROMPT_TEMPLATE, videoFields, dataTopicReplacementMap })';

  return vm.runInNewContext(`${source}\n${names}`, {});
}

const { buildPrompt, PROMPT_TEMPLATE, videoFields, dataTopicReplacementMap } = loadAppsScript(
  'DataStore.js',
  'Prompt.js'
);

const EXPECTED_TEMPLATE = readFileSync(
  path.join(FIXTURES, 'prompt-template.txt'),
  'utf8'
).trimEnd();

const fieldKeys = videoFields.map(({ key }) => key);

const placeholders = (text) => text.match(/\[[A-Z0-9_]+\]/g) || [];

/** Payload shaped exactly like the sidebar submit: { topic, fields }. */
function payloadFor(topic) {
  const fields = {};
  for (const key of fieldKeys) {
    const values = (dataTopicReplacementMap[topic] || {})[key] || [];
    fields[key] = values.length ? values[0] : '';
  }
  return { topic, fields };
}

const topics = Object.keys(dataTopicReplacementMap);
const populatedTopics = topics.filter((topic) =>
  fieldKeys.every((key) => ((dataTopicReplacementMap[topic] || {})[key] || []).length > 0)
);

test('template matches the approved spec byte-for-byte', () => {
  assert.equal(PROMPT_TEMPLATE, EXPECTED_TEMPLATE);
});

test('template is a single line that starts and ends with the spec text', () => {
  assert.ok(!PROMPT_TEMPLATE.includes('\n'));
  assert.ok(
    PROMPT_TEMPLATE.startsWith(
      '9:16 vertical photorealistic video, 10 seconds, continuous camera move, no cuts. In [SETTING]'
    )
  );
  assert.ok(PROMPT_TEMPLATE.endsWith('rushed movements, fast cuts. .'));
});

test('every placeholder in the template maps to a videoFields key', () => {
  const used = [...new Set([...PROMPT_TEMPLATE.matchAll(/\[([A-Z0-9_]+)\]/g)].map((m) => m[1]))];

  assert.deepEqual([...used].sort(), [...fieldKeys].sort());
});

test('template has 11 slots across 9 distinct keys', () => {
  assert.equal(placeholders(PROMPT_TEMPLATE).length, 11);
  assert.equal(new Set(placeholders(PROMPT_TEMPLATE)).size, 9);
});

test('the 3-7s slot uses the renamed ACTION_3_7S placeholder', () => {
  assert.ok(PROMPT_TEMPLATE.includes('3-7s: [ACTION_3_7S].'));
  assert.ok(!PROMPT_TEMPLATE.includes('[CAMERA_3_7S]'));
});

test('a full payload replaces every placeholder', () => {
  const prompt = buildPrompt(payloadFor(populatedTopics[0]));

  assert.deepEqual(placeholders(prompt), []);
});

test('a full payload inserts every selected value', () => {
  const payload = payloadFor(populatedTopics[0]);
  const prompt = buildPrompt(payload);

  for (const key of fieldKeys) {
    assert.ok(prompt.includes(payload.fields[key]), `missing value for ${key}`);
  }
});

test('[MAIN_OBJECT] fills all three slots', () => {
  const prompt = buildPrompt({ topic: '1', fields: { MAIN_OBJECT: 'ZZZ_MAIN_OBJECT' } });

  assert.equal(prompt.split('ZZZ_MAIN_OBJECT').length - 1, 3);
});

test('empty fields leave the template unchanged', () => {
  assert.equal(buildPrompt({ topic: '4', fields: {} }), PROMPT_TEMPLATE);
});

test('null or undefined formData returns the template', () => {
  assert.equal(buildPrompt(null), PROMPT_TEMPLATE);
  assert.equal(buildPrompt(undefined), PROMPT_TEMPLATE);
});

test('a payload without fields returns the template', () => {
  assert.equal(buildPrompt({ topic: '1' }), PROMPT_TEMPLATE);
});

test('an empty string keeps the placeholder visible', () => {
  const prompt = buildPrompt({ topic: '1', fields: { SETTING: '' } });

  assert.ok(prompt.includes('In [SETTING] in'));
});

test('null and undefined values keep the placeholder visible', () => {
  for (const value of [null, undefined]) {
    const prompt = buildPrompt({ topic: '1', fields: { SETTING: value } });

    assert.ok(prompt.includes('[SETTING]'));
    assert.ok(!prompt.includes('undefined'));
    assert.ok(!prompt.includes('null'));
  }
});

test('a whitespace-only value keeps the placeholder visible', () => {
  assert.ok(buildPrompt({ topic: '1', fields: { SETTING: '   ' } }).includes('[SETTING]'));
});

test('inserted values are trimmed', () => {
  const prompt = buildPrompt({ topic: '1', fields: { SETTING: '  padded  ' } });

  assert.ok(prompt.includes('In padded in'));
});

test('payload keys absent from the template are ignored', () => {
  assert.equal(buildPrompt({ topic: '1', fields: { FOO: 'x' } }), PROMPT_TEMPLATE);
});

test('dollar sequences in values are inserted literally', () => {
  const value = "$& $1 $` $' $_";
  const prompt = buildPrompt({ topic: '1', fields: { SETTING: value } });

  assert.ok(prompt.includes(value));
});

test('backslashes in values are inserted literally', () => {
  const value = 'C:\\path\\to\\file';
  const prompt = buildPrompt({ topic: '1', fields: { SETTING: value } });

  assert.ok(prompt.includes(value));
});

test('a value containing a placeholder is not expanded again', () => {
  const prompt = buildPrompt({
    topic: '1',
    fields: { ...payloadFor(populatedTopics[0]).fields, SETTING: '[LIGHTING]' },
  });

  assert.deepEqual(placeholders(prompt), ['[LIGHTING]']);
});

test('the topic does not affect the prompt', () => {
  const fields = payloadFor(populatedTopics[0]).fields;

  assert.equal(buildPrompt({ topic: '1', fields }), buildPrompt({ topic: '9', fields }));
});

test('every populated topic produces a placeholder-free prompt', () => {
  assert.ok(populatedTopics.length > 0, 'expected at least one populated topic');

  for (const topic of populatedTopics) {
    assert.deepEqual(placeholders(buildPrompt(payloadFor(topic))), [], `topic ${topic}`);
  }
});

test('an all-blank field set returns the template unchanged', () => {
  const fields = Object.fromEntries(fieldKeys.map((key) => [key, '']));

  assert.equal(buildPrompt({ topic: populatedTopics[0], fields }), PROMPT_TEMPLATE);
});
