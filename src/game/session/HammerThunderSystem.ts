import { HAMMER_RULES } from "../../config/GameTuning";
import {
  activateHammerThunder,
  findHammer,
  isHammerThunderActive,
} from "../features/hammer/index";
import {
  findPlayer,
  getPlayerAngry,
} from "../features/playerHud/index";

export function activateHammerThunderIfCharged(world: any): void {
  const hammer = findHammer(world);
  const player = findPlayer(world);
  if (hammer === undefined || player === undefined) return;
  if (isHammerThunderActive(hammer)) return;
  if (getPlayerAngry(player) < HAMMER_RULES.thunderAngryThreshold) return;

  activateHammerThunder(hammer);
}
