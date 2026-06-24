import {
  BIT_MONSTER_POS,
  BIT_MONSTER_SCALE,
  BIT_MONSTER_SHOW,
  BIT_MONSTER_SPAWN,
} from "../../DirtyFlags";
import type { IMonsterNode } from "../../contracts/MonsterViewContract";
import { createSyncRow, defineViewSyncSpec } from "../ViewSyncSpec";
import { MONSTER_CONFIG } from "../../../config/MonsterConfig";
import { MonsterComponent } from "../../../ecs/gameplay/monster/MonsterComponent";
import { MonsterType } from "../../../ecs/gameplay/monster/MonsterTypes";

type MonsterField = Extract<keyof typeof MonsterComponent, string>;
const syncRow = createSyncRow<IMonsterNode, MonsterField>();

function applyMonster({ eid, node }: { eid: number; node: IMonsterNode }): void {
  const monsterType = MonsterComponent.monsterType[eid] as MonsterType;
  const config = MONSTER_CONFIG[monsterType] ?? MONSTER_CONFIG[MonsterType.Rhino];
  node.playMonster(monsterType, config.skUrl, config.pngUrl, MonsterComponent.spawnSeq[eid]);
}

function applyPosition({ eid, node }: { eid: number; node: IMonsterNode }): void {
  node.setPosition(MonsterComponent.posX[eid], MonsterComponent.posY[eid]);
}

function applyScale({ eid, node }: { eid: number; node: IMonsterNode }): void {
  node.setScale(MonsterComponent.scale[eid]);
}

function applyVisible({ eid, node }: { eid: number; node: IMonsterNode }): void {
  node.setVisible(MonsterComponent.visible[eid] === 1);
}

export const MONSTER_VIEW_SYNC_SPEC = defineViewSyncSpec<IMonsterNode, MonsterField>(
  "MonsterComponent",
  MonsterComponent,
  [
    // bit                label        fields                    apply
    syncRow(BIT_MONSTER_SPAWN, "怪物生成", ["monsterType", "spawnSeq"], applyMonster),
    syncRow(BIT_MONSTER_POS,   "怪物坐标", ["posX", "posY"],           applyPosition),
    syncRow(BIT_MONSTER_SCALE, "怪物缩放", ["scale"],                  applyScale),
    syncRow(BIT_MONSTER_SHOW,  "怪物显隐", ["visible"],                applyVisible),
  ],
);
