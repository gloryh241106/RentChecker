/** The three stages of a tenancy, in the order UI.md shows them. */
export const STAGES = [
  { path: '/move-out', name: 'Moving out' },
  { path: '/lease-review', name: 'Before signing' },
  { path: '/tenancy', name: 'During the tenancy' },
] as const;

/** Not a stage. It works at any time, on the lease of Moving out. */
export const ASK_PAGE = { path: '/ask', name: 'Ask your lease' } as const;

export type StagePath = (typeof STAGES)[number]['path'];
