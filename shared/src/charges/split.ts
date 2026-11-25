// F8-R1. `Rs. 500` is one part, and so is `12,000`.
const PART_BREAK = /[\n\r;|]+|(?<!\brs)\.\s+|,(?![0-9])|(?<=,[0-9]{3}):\s/i;
const JOIN = /(\s+and\s+|\s*[&+]\s*)/i;

/** Text with no number belongs to what follows its "and", as in "Water and electricity 1,200". */
function joinNumberless(pieces: readonly string[]): string[] {
  const parts: string[] = [];
  let held = '';
  pieces.forEach((piece, index) => {
    const isJoin = index % 2 === 1;
    if (isJoin) {
      held = held === '' ? '' : held + piece;
    } else if (/[0-9]/.test(piece) || index === pieces.length - 1) {
      parts.push(held + piece);
      held = '';
    } else {
      held += piece;
    }
  });
  return parts;
}

/** F8-R1. The parts of a message, each with at most one charge. */
export function splitMessage(message: string): string[] {
  return message
    .split(PART_BREAK)
    .flatMap((part) => joinNumberless(part.split(JOIN)))
    .map((part) => part.trim())
    .filter((part) => part !== '');
}
