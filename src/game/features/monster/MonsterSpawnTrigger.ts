import { defineCapability } from "../../../framework/feature/FeatureSetupContext";
import type { MonsterSpawnRule } from "./MonsterRules";

export type MonsterSpawnMilestoneProvider = (
  world: any,
  rule: MonsterSpawnRule,
) => number;

export const MonsterSpawnMilestoneCapability =
  defineCapability<MonsterSpawnMilestoneProvider>("monster.spawnMilestone");
