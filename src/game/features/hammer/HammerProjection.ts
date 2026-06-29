import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../../framework/sync/ProjectionDefinition";
import { HammerComponent } from "./HammerComponents";
import type { IHammerNode } from "./IHammerNode";

const source = projectionSource("hammer", HammerComponent);

function applyHammerType({ eid, node }: { eid: number; node: IHammerNode }): void {
  node.setHammerType(HammerComponent.selectedType[eid]);
}

function applyThunderActive({ eid, node }: { eid: number; node: IHammerNode }): void {
  node.setThunderActive(HammerComponent.isThunderActive[eid] === 1);
}

function applyHitFeedback({ eid, node }: { eid: number; node: IHammerNode }): void {
  if (HammerComponent.hitSeq[eid] === 0) return;
  node.followTouch(HammerComponent.touchX[eid], HammerComponent.touchY[eid]);
  node.playHitAnimation();
}

export const HammerProjection = defineProjection<IHammerNode>({
  name: "hammer",
  components: [HammerComponent],
  rows: [
    watch(source, ["selectedType"], "hammer type", applyHammerType),
    watch(source, ["isThunderActive"], "thunder active", applyThunderActive),
    watch(source, ["hitTable"], "hit enabled", noProjection),
    watch(source, ["touchX", "touchY", "hitSeq"], "hit feedback", applyHitFeedback),
  ],
});
