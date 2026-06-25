import { PlayerComponent } from "../../ecs/components";
import type { IPlayerHUD } from "../contracts/PlayerViewContract";
import { defineProjection, projectionSource, watch } from "../projection/ProjectionDefinition";

const source = projectionSource("player", PlayerComponent);

export const PlayerProjection = defineProjection<IPlayerHUD>({
  name: "player",
  components: [PlayerComponent],
  rows: [
    watch(source, ["money"], "player money", ({ eid, node }) => {
      node.setMoney(PlayerComponent.money[eid]);
    }),
    watch(source, ["angry"], "player angry", ({ eid, node }) => {
      node.setAngry(PlayerComponent.angry[eid]);
    }),
    watch(source, ["power", "powerTop"], "player power", ({ eid, node }) => {
      node.setPower(PlayerComponent.power[eid], PlayerComponent.powerTop[eid]);
    }),
    watch(source, ["level"], "player level", ({ eid, node }) => {
      node.setLevel(PlayerComponent.level[eid]);
    }),
  ],
});
