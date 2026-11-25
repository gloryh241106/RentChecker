const POINTS = [
  [
    'Understands',
    'Google Gemini works out which check you need and points at the facts you wrote.',
  ],
  ['Proves', 'Code reads each amount and date from your own words. AI never fills in a number.'],
  ['Asks', 'One question at a time for what is still missing.'],
  ['Warns', 'Likely mistakes are named before anything is filled in, such as an extra zero.'],
] as const;

/** Shown beside the prompt until there is a plan. */
export function WhatItDoes() {
  return (
    <dl className="space-y-3 rounded-xl bg-sunken p-4 sm:p-5">
      {POINTS.map(([name, text]) => (
        <div key={name}>
          <dt className="font-bold">{name}</dt>
          <dd>{text}</dd>
        </div>
      ))}
    </dl>
  );
}
