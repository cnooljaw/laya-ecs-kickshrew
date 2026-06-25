import { PlayerComponent } from "../../components";
import { defineEntityType } from "../../runtime/EntityType";

export const PlayerEntity = defineEntityType({
  name: "player",
  components: [PlayerComponent],
  cardinality: "one",
  initialize: (eid: number) => {
    PlayerComponent.money[eid] = 0;
    PlayerComponent.angry[eid] = 0;
    PlayerComponent.power[eid] = 0;
    PlayerComponent.powerTop[eid] = 0;
    PlayerComponent.level[eid] = 0;
  },
});
