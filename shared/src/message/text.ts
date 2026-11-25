/**
 * F3-R16. User text goes into the message as it is, except that every run of white space,
 * newlines included, becomes one space. A label or quote with a line break would otherwise
 * split a block line, and the schemas allow line breaks in labels and quotes.
 */
export function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/** Parts are separated by one empty line (Template). */
export function joinParts(parts: readonly string[]): string {
  return parts.join('\n\n');
}

/** Lines of a block follow each other. */
export function joinLines(lines: readonly string[]): string {
  return lines.join('\n');
}
