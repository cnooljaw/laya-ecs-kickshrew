import type { DirtyAspect } from "../DirtySchemaTypes";
import { ComboDirtyAspect } from "./ComboDirtyAspect";
import { HammerDirtyAspect } from "./HammerDirtyAspect";
import { HitDirtyAspect } from "./HitDirtyAspect";
import { HoleDirtyAspect } from "./HoleDirtyAspect";
import { PerfHeroDirtyAspect } from "./PerfHeroDirtyAspect";
import { PlayerDirtyAspect } from "./PlayerDirtyAspect";
import { SceneDirtyAspect } from "./SceneDirtyAspect";
import { ShrewDirtyAspect } from "./ShrewDirtyAspect";

export {
  ComboDirtyAspect,
  HammerDirtyAspect,
  HitDirtyAspect,
  HoleDirtyAspect,
  PerfHeroDirtyAspect,
  PlayerDirtyAspect,
  SceneDirtyAspect,
  ShrewDirtyAspect,
};

export const DIRTY_ASPECTS: DirtyAspect[] = [
  ShrewDirtyAspect,
  HoleDirtyAspect,
  HammerDirtyAspect,
  ComboDirtyAspect,
  SceneDirtyAspect,
  PlayerDirtyAspect,
  HitDirtyAspect,
  PerfHeroDirtyAspect,
];
