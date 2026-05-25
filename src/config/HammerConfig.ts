import { HammerType } from "../ecs/types";

export interface HammerConfig {
  id: number;
  name: string;
  effectFrameCount: number;
  effectFramePrefix: string;
  price: number;
}

export const HAMMER_CONFIGS: Record<number, HammerConfig> = {
  [HammerType.Wood]: {
    id: HammerType.Wood, name: "木锤", effectFrameCount: 1, effectFramePrefix: "wood_hammer_effect", price: 0,
  },
  [HammerType.Stone]: {
    id: HammerType.Stone, name: "石锤", effectFrameCount: 3, effectFramePrefix: "stone_hammer_effect", price: 50,
  },
  [HammerType.Copper]: {
    id: HammerType.Copper, name: "铜锤", effectFrameCount: 3, effectFramePrefix: "copper_hammer_effect", price: 100,
  },
  [HammerType.Silver]: {
    id: HammerType.Silver, name: "银锤", effectFrameCount: 10, effectFramePrefix: "silver_hammer_effect", price: 200,
  },
  [HammerType.Gold]: {
    id: HammerType.Gold, name: "金锤", effectFrameCount: 3, effectFramePrefix: "gold_hammer_effect", price: 500,
  },
  [HammerType.God]: {
    id: HammerType.God, name: "神锤", effectFrameCount: 4, effectFramePrefix: "god_hammer_effect", price: 1000,
  },
  [HammerType.Thunder]: {
    id: HammerType.Thunder, name: "雷神锤", effectFrameCount: 5, effectFramePrefix: "kickshrew_angry_hammer_effect", price: 0,
  },
};
