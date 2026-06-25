import { defineProjection, projectionSource, watch } from "../../../framework/sync/ProjectionDefinition";
import { PlayerComponent } from "./PlayerComponents";
import type { IPlayerHUD } from "./PlayerViewContract";

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
