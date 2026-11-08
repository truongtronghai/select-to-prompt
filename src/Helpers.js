/**
 * Helper function to evaluate and embed sub-files into the main template.
 */
function include(filename, data) {
  const subTemplate = HtmlService.createTemplateFromFile(filename);
  if (data) {
    Object.assign(subTemplate, data);
  }

  return subTemplate.evaluate().getContent();
}
