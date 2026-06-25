import { defineQuery } from "bitecs";
import { HAMMER_RULES } from "../../config/GameTuning";
import {
  HammerComponent,
  HammerType,
} from "../features/hammer/index";
import { PlayerComponent } from "../features/playerHud/index";

const hammerQuery = defineQuery([HammerComponent]);
const playerQuery = defineQuery([PlayerComponent]);

export function thunderSystem(world: any): void {
  const hammer = hammerQuery(world)[0];
  const player = playerQuery(world)[0];
  if (hammer === undefined || player === undefined) return;
  if (HammerComponent.isThunderActive[hammer] === 1) return;
  if (PlayerComponent.angry[player] < HAMMER_RULES.thunderAngryThreshold) return;

  HammerComponent.isThunderActive[hammer] = 1;
  HammerComponent.selectedType[hammer] = HammerType.Thunder;
  HammerComponent.hitTable[hammer] = 0;
  HammerComponent.hitCooldownSec[hammer] = 0;
}
