import { PageHeading } from '../../app/PageHeading.js';
import { SampleBanner } from '../../components/SampleBanner.js';
import { BillSection } from './BillSection.js';
import { RepairSection } from './RepairSection.js';

/** UC-4 and UC-5. The bill check and the repair log, on one screen. */
export function TenancyPage() {
  return (
    <div className="space-y-8">
      <SampleBanner />
      <PageHeading title="During the tenancy" />
      <BillSection />
      <RepairSection />
    </div>
  );
}
