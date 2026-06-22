export const DIRTY_TARGETS = [
  "shrewDirty",
  "animDirty",
  "holeDirty",
  "hammerDirty",
  "comboDirty",
  "sceneDirty",
  "playerDirty",
  "hitDirty",
  "perfHeroDirty",
  "monsterDirty",
] as const;

export type DirtyTarget = typeof DIRTY_TARGETS[number];
