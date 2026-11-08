# AGENTS.md

Google Apps Script project (`@types/google-apps-script`, V8 runtime) that adds a `Video List App`
menu to a Google Sheet and opens an `HtmlService` sidebar form. There is no build step and no local
Apps Script runtime; unit tests run under Node's built-in test runner.

## Commands

```sh
npm test             # node --test test/ — unit tests (no Apps Script runtime needed)
npm run format       # prettier --write on **/*.js, *.json, *.mjs
npm run lint         # eslint .
npm run format:check # CI-style verification
```

- Tests load `src/*.js` through `node:vm`: the GAS files are globals, not modules, so there is no
  `require`/`export`. See `test/prompt.test.js`.
- There is no typecheck: `jsconfig.json` has `checkJs: false`, and it exists only to supply
  Apps Script globals to the editor.
- Prettier runs as an ESLint error (`prettier/prettier`), so run `npm run format` **before**
  `npm run lint`, otherwise lint fails on style only.
- ESLint covers only `**/*.js`; `.prettierignore` excludes `**/*.html`. The inline JS in
  `src/ui/JavaScript.html` is therefore checked by neither tool — verify it by hand, and do not
  "fix" formatting by running Prettier over the HTML (it would mangle `<?!= ?>` scriptlets).

## Deploying / testing

- `clasp` is **not** a devDependency; it is only available globally (`npx clasp ...`).
- `.clasp.json` pins `rootDir: ./src` and a real `scriptId`. `clasp push` writes to the live
  bound spreadsheet project — there is no staging target.
- `.clasprc.json` is gitignored, so each machine must run `clasp login` first.
- `.claspignore` whitelists only `*.js`, `*.ts`, `*.html`, and `appsscript.json` under `src/`.
  A new server file must live in `src/` to be deployed; anything else is silently dropped. Tests
  live in `test/`, outside `rootDir`, so they are never pushed.
- To test HTML/UI changes: `clasp push`, then reopen the sheet or reload the sidebar. There is no
  dev server or hot reload.

## Architecture

- `src/Code.js` — server entrypoints: `onOpen()` (menu), `showSidebar()` (evaluates `Index.html`),
  and `submitDataToSheet(payload)`, called from the client via `google.script.run`.
- `src/Helpers.js` — `include(filename, data)` merges a partial into a template via
  `HtmlService.createTemplateFromFile(...).evaluate()`. `Index.html` uses it for
  `ui/Stylesheet` and `ui/JavaScript`.
- `src/DataStore.js` — global constants `dataTopicMap`, `dataTopicReplacementMap` (topic id →
  `SETTING`/`LIGHTING`/`SCENE_VIDEO`/`MAIN_OBJECT`/`ACTION_*`/`MOOD` arrays), and `videoFields`
  (ordered `{ key, label }` list that drives the field markup). It has no exports; Apps Script
  globals are read directly by the server-side scriptlets in `Index.html`.
- `src/Prompt.js` — `buildPrompt({ topic, fields })` fills the `[PLACEHOLDER]` slots in
  `PROMPT_TEMPLATE` using the `videoFields` keys. Missing or empty values leave the placeholder
  visible; unknown placeholders are untouched. It is not yet wired into `submitDataToSheet`.
- `src/Index.html` + `src/ui/*.html` — template partials. Scriptlets such as
  `<?= dataTopicMap[key] ?>` execute on the Apps Script server, not in the browser; only Apps
  Script globals and project globals are in scope there.
- The sidebar's replacement dropdowns are built client-side: `Index.html` renders empty
  `<select data-field>` shells, then embeds the whole map in an inert
  `<script type="application/json" id="topicData">` block. `ui/JavaScript.html` parses that
  with `JSON.parse(...textContent)` and rebuilds the options on load and on `#topic` change.
- Template output escaping matters: `<?= ?>` HTML-escapes, `<?!= ?>` emits raw. The JSON payload
  must use `<?!= ?>` (escaping quotes would break `JSON.parse`, and script content is never
  entity-decoded). It also appends `.replace(/</g, '\\u003c')` so a data value containing
  `</script>` cannot close the block early. Keep the payload block before the
  `ui/JavaScript` include.
- `src/appsscript.json` — V8 runtime, timezone `Asia/Ho_Chi_Minh`, Stackdriver logging.

## Known quirks (current state)

- Topics whose arrays are empty in `DataStore.js` render one disabled option, "No options for this
  topic". Every topic 1–10 currently has data.
- The form submits `{ topic, fields }`. `submitDataToSheet` writes 14 columns:
  `No. | Date Time | Topic | <9 videoFields> | Prompt | Status`. Row 1 is written or migrated
  automatically, the middle values are validated against `dataTopicReplacementMap`, `Prompt` comes
  from `buildPrompt()`, and `Status` is the literal `Pending`.
- A prompt that already exists in the `Prompt` column is not appended. `submitDataToSheet` returns
  `{ success: false, duplicate: true, message }` and the sidebar shows a warning banner without
  resetting the form. `findPromptRow()` does the lookup (blank prompts never match).
- `src/ui/ComponentList.html` is unused. It is a server-side option partial; the client-side render
  path in `ui/JavaScript.html` does not use it.
