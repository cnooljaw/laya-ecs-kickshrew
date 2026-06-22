import {
  BIT_MONSTER_POS,
  BIT_MONSTER_SCALE,
  BIT_MONSTER_SHOW,
  BIT_MONSTER_SPAWN,
} from "../../sync/DirtyFlags";
import type { IMonsterNode } from "../../sync/contracts/MonsterViewContract";
import { createRule, defineViewRules } from "../../sync/rules/ViewBindingRule";
import { MONSTER_CONFIG } from "./MonsterConfig";
import { MonsterComponent } from "./MonsterComponent";
import { MonsterType } from "./MonsterTypes";

type MonsterField = Extract<keyof typeof MonsterComponent, string>;
const rule = createRule<IMonsterNode, MonsterField>();

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

export const MONSTER_VIEW_RULES = defineViewRules<IMonsterNode, MonsterField>(
  "MonsterComponent",
  MonsterComponent,
  [
    // bit                label        fields                    apply
    rule(BIT_MONSTER_SPAWN, "怪物生成", ["monsterType", "spawnSeq"], applyMonster),
    rule(BIT_MONSTER_POS,   "怪物坐标", ["posX", "posY"],           applyPosition),
    rule(BIT_MONSTER_SCALE, "怪物缩放", ["scale"],                  applyScale),
    rule(BIT_MONSTER_SHOW,  "怪物显隐", ["visible"],                applyVisible),
  ],
);
