import { PageHeading } from '../app/PageHeading.js';
import { ButtonLink } from '../components/ui/Button.js';

export function NotFound() {
  return (
    <div className="space-y-5">
      <PageHeading title="Page not found" />
      <p>There is nothing at this address.</p>
      <ButtonLink to="/" variant="primary">
        Go to the home page
      </ButtonLink>
    </div>
  );
}
