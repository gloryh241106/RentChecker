import { CalculatorIcon, LockIcon, MessageIcon, QuoteCheckIcon } from '../../components/ui/Icon.js';

const POINTS = [
  {
    Icon: CalculatorIcon,
    title: 'Rules work out every amount',
    text: 'Rent per day, meter readings, receipts and fees the lease states. AI never works out an amount.',
  },
  {
    Icon: QuoteCheckIcon,
    title: 'Quotes are checked',
    text: 'Google Gemini looks for the clause. A quote that is not in your lease is ignored.',
  },
  {
    Icon: MessageIcon,
    title: 'A message you can edit',
    text: 'It asks for the clause, the receipt or a new calculation, charge by charge.',
  },
  {
    Icon: LockIcon,
    title: 'Your data stays with you',
    text: 'Your entries are stored in this browser. The lease is sent only after you agree, to find clauses.',
  },
] as const;

/** UI.md Home: what the app does, in four points. */
export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="space-y-4">
      <h2 id="how-heading" className="text-2xl font-bold">
        How it works
      </h2>
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {POINTS.map(({ Icon, title, text }) => (
          <li key={title} className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-info-bg text-info">
              <Icon />
            </span>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="max-w-prose text-ink-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
