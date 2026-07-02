import type { FeatureSetupContext } from "../../framework/feature/FeatureSetupContext";
import {
  MonsterSpawnMilestoneCapability,
  type MonsterSpawnMilestoneProvider,
} from "../features/monster";
import {
  findPlayer,
  getPlayerMoney,
} from "../features/playerHud";

export function setupMonsterSpawnSession(ctx: FeatureSetupContext): void {
  ctx.provide(MonsterSpawnMilestoneCapability, playerMoneyMonsterSpawnMilestone);
}

export const playerMoneyMonsterSpawnMilestone: MonsterSpawnMilestoneProvider = (
  world,
  rule,
) => {
  if (rule.trigger.mode !== "multiple" || rule.trigger.interval <= 0) return 0;
  if (rule.trigger.source !== "money") return 0;

  const player = findPlayer(world);
  if (player === undefined) return 0;
  return Math.floor(getPlayerMoney(player) / rule.trigger.interval);
};
