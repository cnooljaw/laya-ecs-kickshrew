import { defineProjection, projectionSource, watch } from "../../../framework/sync/ProjectionDefinition";
import { BoardPositionComponent } from "../../board/index";
import { MonsterComponent } from "./MonsterComponents";
import type { IMonsterNode } from "./IMonsterNode";

const source = projectionSource("monster", MonsterComponent);
const boardPositionSource = projectionSource("monsterBoardPosition", BoardPositionComponent);

export const MonsterProjection = defineProjection<IMonsterNode>({
  name: "monster",
  components: [MonsterComponent, BoardPositionComponent],
  rows: [
    watch(source, ["monsterType", "spawnSeq"], "monster spawn", ({ eid, node }) => {
      node.spawn(MonsterComponent.monsterType[eid], MonsterComponent.spawnSeq[eid]);
    }),
    watch(boardPositionSource, ["xRatio", "yRatio"], "monster board position", ({ eid, node }) => {
      node.setPosition(BoardPositionComponent.xRatio[eid], BoardPositionComponent.yRatio[eid]);
    }),
    watch(boardPositionSource, ["zIndex"], "monster board z-order", ({ eid, node }) => {
      node.setZOrder(BoardPositionComponent.zIndex[eid]);
    }),
    watch(source, ["actionState", "animationProgress"], "monster animation", ({ eid, node }) => {
      node.setAnimation(MonsterComponent.actionState[eid], MonsterComponent.animationProgress[eid]);
    }),
    watch(source, ["hitSeq"], "monster hit", ({ eid, node }) => {
      node.playHit(MonsterComponent.hitSeq[eid]);
    }),
    watch(source, ["defeatedSeq"], "monster defeated", ({ eid, node }) => {
      node.playDefeated(MonsterComponent.defeatedSeq[eid]);
    }),
    watch(source, ["visible"], "monster visibility", ({ eid, node }) => {
      node.setVisible(MonsterComponent.visible[eid] === 1);
    }),
  ],
});
