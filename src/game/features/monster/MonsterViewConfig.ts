import { DESIGN_RESOLUTION } from "../../../config/GameTuning";
import { MonsterType } from "./MonsterTypes";

export interface MonsterViewConfig {
  readonly skUrl: string;
  readonly pngUrl: string;
  readonly scale: number;
  readonly posX: number;
  readonly posY: number;
  readonly visualBounds: MonsterVisualBounds;
}

export interface MonsterVisualBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const MONSTER_VIEW_CONFIG: Record<MonsterType, MonsterViewConfig> = {
  [MonsterType.Rhino]: {
    skUrl: "resources/monster/rhino.sk",
    pngUrl: "resources/monster/rhino.png",
    scale: 1,
    posX: DESIGN_RESOLUTION.width * 0.5,
    posY: DESIGN_RESOLUTION.height * 0.55,
    visualBounds: { x: -130, y: -190, width: 240, height: 220 },
  },
};

export function validateMonsterViewConfig(
  config: Partial<Record<MonsterType, MonsterViewConfig>> = MONSTER_VIEW_CONFIG,
): string[] {
  const issues: string[] = [];
  for (const monsterType of [MonsterType.Rhino]) {
    const view = config[monsterType];
    if (!view) {
      issues.push(`MONSTER_VIEW_CONFIG 缺少 monsterType=${monsterType}`);
      continue;
    }
    if (!view.skUrl) issues.push(`MONSTER_VIEW_CONFIG[${monsterType}].skUrl 不能为空`);
    if (!view.pngUrl) issues.push(`MONSTER_VIEW_CONFIG[${monsterType}].pngUrl 不能为空`);
    if (view.scale <= 0) issues.push(`MONSTER_VIEW_CONFIG[${monsterType}].scale 必须大于 0`);
    if (!view.visualBounds) {
      issues.push(`MONSTER_VIEW_CONFIG[${monsterType}].visualBounds 不能为空`);
      continue;
    }
    if (view.visualBounds.width <= 0) {
      issues.push(`MONSTER_VIEW_CONFIG[${monsterType}].visualBounds.width 必须大于 0`);
    }
    if (view.visualBounds.height <= 0) {
      issues.push(`MONSTER_VIEW_CONFIG[${monsterType}].visualBounds.height 必须大于 0`);
    }
  }
  return issues;
}
