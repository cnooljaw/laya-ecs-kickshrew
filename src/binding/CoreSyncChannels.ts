import {
  shrewAnimationViewBinding,
  shrewViewBinding,
} from "./ShrewViewBinding";
import { holeViewBinding } from "./HoleViewBinding";
import { hammerViewBinding } from "./HammerViewBinding";
import { sceneViewBinding } from "./SceneViewBinding";
import { playerViewBinding } from "./PlayerViewBinding";
import { hitViewBinding } from "./HitViewBinding";
import { perfHeroViewBinding } from "./PerfHeroViewBinding";
import { createRuleSyncChannel, type SyncChannel } from "./SyncView";
import { SHREW_ANIMATION_RULES, SHREW_COMPONENT_RULES } from "../sync/rules/ShrewViewRules";
import { HOLE_VIEW_RULES } from "../sync/rules/HoleViewRules";
import { HAMMER_VIEW_RULES } from "../sync/rules/HammerViewRules";
import { SCENE_VIEW_RULES } from "../sync/rules/SceneViewRules";
import { PLAYER_VIEW_RULES } from "../sync/rules/PlayerViewRules";
import { HIT_VIEW_RULES } from "../sync/rules/HitViewRules";
import { PERF_HERO_VIEW_RULES } from "../sync/rules/PerfHeroViewRules";

export const CORE_SYNC_CHANNELS: readonly SyncChannel[] = [
  createRuleSyncChannel({
    name: "shrew",
    dirtyTarget: "shrewDirty",
    rules: SHREW_COMPONENT_RULES,
    binding: shrewViewBinding,
  }),
  createRuleSyncChannel({
    name: "anim",
    dirtyTarget: "animDirty",
    rules: SHREW_ANIMATION_RULES,
    binding: shrewAnimationViewBinding,
  }),
  createRuleSyncChannel({
    name: "hole",
    dirtyTarget: "holeDirty",
    rules: HOLE_VIEW_RULES,
    binding: holeViewBinding,
  }),
  createRuleSyncChannel({
    name: "hammer",
    dirtyTarget: "hammerDirty",
    rules: HAMMER_VIEW_RULES,
    binding: hammerViewBinding,
  }),
  createRuleSyncChannel({
    name: "scene",
    dirtyTarget: "sceneDirty",
    rules: SCENE_VIEW_RULES,
    binding: sceneViewBinding,
  }),
  createRuleSyncChannel({
    name: "player",
    dirtyTarget: "playerDirty",
    rules: PLAYER_VIEW_RULES,
    binding: playerViewBinding,
  }),
  createRuleSyncChannel({
    name: "hit",
    dirtyTarget: "hitDirty",
    rules: HIT_VIEW_RULES,
    binding: hitViewBinding,
  }),
  createRuleSyncChannel({
    name: "perfHero",
    dirtyTarget: "perfHeroDirty",
    rules: PERF_HERO_VIEW_RULES,
    binding: perfHeroViewBinding,
  }),
];

export function coreSyncChannels(names: readonly string[]): SyncChannel[] {
  const nameSet = new Set(names);
  return CORE_SYNC_CHANNELS.filter(channel => nameSet.has(channel.name));
}
