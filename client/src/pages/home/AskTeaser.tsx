import { ASK_PAGE } from '../../app/stages.js';
import { ButtonLink } from '../../components/ui/Button.js';
import { Card } from '../../components/ui/Card.js';
import { MessageIcon } from '../../components/ui/Icon.js';
import { SAMPLE_DEPOSIT_SENTENCE } from '../../state/sample.js';

/** UI.md Home: what Ask your lease does, with a question about the sample lease. */
export function AskTeaser() {
  return (
    <section
      aria-labelledby="ask-heading"
      className="grid items-center gap-6 rounded-2xl bg-sunken p-5 sm:p-8 lg:grid-cols-2"
    >
      <div className="space-y-4">
        <span className="flex size-12 items-center justify-center rounded-lg bg-band text-accent">
          <MessageIcon className="size-7 shrink-0" />
        </span>
        <h2 id="ask-heading" className="text-2xl font-bold">
          Not sure what your lease says?
        </h2>
        <p className="text-lg">
          Ask in your own words. The answer is a sentence of your lease, checked word for word.
        </p>
        <ButtonLink to={ASK_PAGE.path} variant="primary" isFullWidth>
          {ASK_PAGE.name}
        </ButtonLink>
      </div>
      <Card>
        <p className="font-semibold">When is the deposit refunded?</p>
        <p>The lease says:</p>
        <blockquote className="border-l-4 border-line-input pl-3 italic">
          {SAMPLE_DEPOSIT_SENTENCE}
        </blockquote>
      </Card>
    </section>
  );
}
