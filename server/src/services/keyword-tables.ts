const words = (list: string): readonly string[] => list.split(' ');

// F2-R10
export const STOP_WORDS: ReadonlySet<string> = new Set([
  ...words('a an the of to for and or in on at by is are be shall will may any all'),
  ...words('from as this that with charges charge'),
]);

// F2-R9
export const NEGATION_WORDS: readonly string[] = words('not cannot no never without except unless');

// F2-R11. A word may be in more than one group.
export const TOPIC_GROUPS: Readonly<Record<string, readonly string[]>> = {
  painting: words('paint painting repaint repainting whitewash distemper'),
  cleaning: words('clean cleaning cleaned sweep housekeeping'),
  repair: words('repair repairs repairing fix fixing damage damages replace replacement'),
  rent: words('rent rental monthly month day days daily'),
  electricity: words('electricity electric power unit units meter'),
  water: words('water meter supply'),
  maintenance: words('maintenance society service upkeep'),
  notice: words('notice vacate vacating terminate termination'),
  deposit: words('deposit security refund refundable advance'),
};
