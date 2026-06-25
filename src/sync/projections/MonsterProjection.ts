import { MonsterComponent } from "../../ecs/gameplay/monster/MonsterComponent";
import type { IMonsterNode } from "../contracts/MonsterViewContract";
import { defineProjection, projectionSource, watch } from "../projection/ProjectionDefinition";

const source = projectionSource("monster", MonsterComponent);

export const MonsterProjection = defineProjection<IMonsterNode>({
  name: "monster",
  components: [MonsterComponent],
  rows: [
    watch(source, ["monsterType", "spawnSeq"], "monster spawn", ({ eid, node }) => {
      node.spawn(MonsterComponent.monsterType[eid], MonsterComponent.spawnSeq[eid]);
    }),
    watch(source, ["posX", "posY"], "monster position", ({ eid, node }) => {
      node.setPosition(MonsterComponent.posX[eid], MonsterComponent.posY[eid]);
    }),
    watch(source, ["scale"], "monster scale", ({ eid, node }) => {
      node.setScale(MonsterComponent.scale[eid]);
    }),
    watch(source, ["visible"], "monster visibility", ({ eid, node }) => {
      node.setVisible(MonsterComponent.visible[eid] === 1);
    }),
  ],
});
