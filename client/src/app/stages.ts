/** The three stages of a tenancy, in the order UI.md shows them. */
export const STAGES = [
  { path: '/move-out', name: 'Moving out' },
  { path: '/lease-review', name: 'Before signing' },
  { path: '/tenancy', name: 'During the tenancy' },
] as const;

export type StagePath = (typeof STAGES)[number]['path'];
