/**
 * Video prompt template. Square-bracket placeholders are filled by buildPrompt().
 * Keep this text byte-for-byte in sync with the prompt spec.
 */
const PROMPT_TEMPLATE = [
  '9:16 vertical photorealistic video, 10 seconds, continuous camera move, no cuts.',
  'In [SETTING] in [LIGHTING] light, [SCENE_VIDEO], with [MAIN_OBJECT] as the main subject, in tack-sharp focus.',
  '[MOOD] atmosphere.',
  '0-1s: [ACTION_0_1S].',
  '1-3s: [ACTION_1_3S].',
  '3-7s: [ACTION_3_7S].',
  '7-10s: [ACTION_7_10S], looping seamlessly back to the start.',
  'Negative prompt: text, captions, subtitles, logos, watermarks, extra [MAIN_OBJECT], distorted [MAIN_OBJECT], morphing, object swapping, scene cuts, jump cuts, slow static opening, empty wide shot in the first 3 seconds, blur, soft focus, motion blur, out of focus, low resolution, grain, flicker, oversaturated colours, cartoon style, people, faces, talking, loud music, rushed movements, fast cuts. .',
].join(' ');

/**
 * Replaces every [PLACEHOLDER] in PROMPT_TEMPLATE with the matching value from
 * the sidebar payload ({ topic, fields }). Placeholders with a missing or empty
 * value are left visible, and unknown placeholders are left untouched.
 *
 * @param {{ topic?: string, fields?: Object<string, string> }} formData
 * @return {string} The assembled prompt.
 */
function buildPrompt(formData) {
  const fields = (formData && formData.fields) || {};

  return PROMPT_TEMPLATE.replace(/\[([A-Z0-9_]+)\]/g, (match, key) => {
    if (!Object.prototype.hasOwnProperty.call(fields, key)) {
      return match;
    }

    const raw = fields[key];
    const value = raw == null ? '' : String(raw).trim();

    return value === '' ? match : value;
  });
}
