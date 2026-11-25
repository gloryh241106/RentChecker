import { PageHeading } from '../app/PageHeading.js';
import { LoadSampleButton } from '../components/LoadSampleButton.js';
import { Card } from '../components/ui/Card.js';
import { ButtonLink } from '../components/ui/Button.js';
import { hasData } from '../state/has-data.js';
import { useWorkspace } from '../state/workspace-context.js';
import { stepPath } from './move-out/steps.js';

/**
 * UC-6 ends here. Stage links follow UI.md: Moving out, Before signing, During the tenancy. Before
 * signing (step 9) is added between the other two when its page is built.
 */
export function Home() {
  const { workspace } = useWorkspace();
  return (
    <div className="space-y-6">
      <PageHeading title="Check your rent and deposit charges" />
      <p>
        Compare what your landlord took from your deposit with your lease and your own facts. You
        get a clear result for each charge, and the reasons behind it.
      </p>
      <Card>
        <ButtonLink to={stepPath('details')} variant="primary" isFullWidth>
          Moving out
        </ButtonLink>
        <p>Check the deductions your landlord listed against your tenancy and your lease.</p>
        {hasData(workspace) ? <p className="font-semibold">Saved in this browser</p> : null}
      </Card>
      <Card>
        <ButtonLink to="/tenancy" variant="secondary" isFullWidth>
          During the tenancy
        </ButtonLink>
        <p>Check a metered bill against your readings, and keep a dated log of repairs.</p>
      </Card>
      <LoadSampleButton />
    </div>
  );
}
