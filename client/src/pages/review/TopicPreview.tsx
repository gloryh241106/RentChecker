import { LeaseIcon } from '../../components/ui/Icon.js';
import { REVIEW_TOPICS } from '../../shared.js';

/** UI.md Before signing: the ten topics, shown until the first review. */
export function TopicPreview() {
  return (
    <section aria-labelledby="preview-heading" className="space-y-3">
      <h2 id="preview-heading" className="text-xl font-bold">
        What the review looks for
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {REVIEW_TOPICS.map(({ id, name }) => (
          <li
            key={id}
            className="flex items-center gap-3 rounded-lg border border-line bg-raised px-4 py-3"
          >
            <LeaseIcon className="size-5 shrink-0 text-primary" />
            {name}
          </li>
        ))}
      </ul>
    </section>
  );
}
