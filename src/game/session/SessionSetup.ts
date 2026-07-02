import type { FeatureSetupContext } from "../../framework/feature/FeatureSetupContext";
import { setupMonsterSpawnSession } from "./MonsterSpawnSession";

export function setupGameSession(ctx: FeatureSetupContext): void {
  setupMonsterSpawnSession(ctx);
}
