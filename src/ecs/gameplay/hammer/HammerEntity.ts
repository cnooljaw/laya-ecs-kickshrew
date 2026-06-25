import { HammerComponent } from "../../components";
import { defineEntityType } from "../../runtime/EntityType";
import { HammerType } from "../../types";

export const HammerEntity = defineEntityType({
  name: "hammer",
  components: [HammerComponent],
  cardinality: "one",
  initialize: (eid: number) => {
    HammerComponent.selectedType[eid] = HammerType.Wood;
    HammerComponent.isThunderActive[eid] = 0;
    HammerComponent.hitTable[eid] = 1;
    HammerComponent.hitCooldownSec[eid] = 0;
    HammerComponent.touchX[eid] = 0;
    HammerComponent.touchY[eid] = 0;
    HammerComponent.hitSeq[eid] = 0;
  },
});
