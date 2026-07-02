import { defineQuery } from "bitecs";
import { defineCapability } from "../../../framework/feature/FeatureSetupContext";
import { HoleComponent, SceneComponent } from "./BoardComponents";
import type { MapType } from "./BoardTypes";
import { BoardOccupantKind } from "./BoardTypes";

export class BoardRuntime {
  readonly holes: readonly number[];

  constructor(
    private readonly sceneEid: number,
    holes: readonly number[],
  ) {
    this.holes = holes;
  }

  currentMap(): MapType {
    return SceneComponent.currentMap[this.sceneEid] as MapType;
  }

  getHoleEid(index: number): number {
    const eid = this.holes[index];
    if (eid === undefined) throw new Error(`Board hole is not found: ${index}`);
    return eid;
  }

  getHoleIndex(holeEid: number): number {
    return Math.round(HoleComponent.index[holeEid]);
  }

  getHoleCenter(index: number): { xRatio: number; yRatio: number } {
    const eid = this.getHoleEid(index);
    return {
      xRatio: HoleComponent.posXRatio[eid],
      yRatio: HoleComponent.posYRatio[eid],
    };
  }

  getHoleZOrder(index: number): number {
    return HoleComponent.zIndex[this.getHoleEid(index)];
  }

  bindResident(index: number, kind: BoardOccupantKind, eid: number): void {
    const holeEid = this.getHoleEid(index);
    HoleComponent.residentKind[holeEid] = kind;
    HoleComponent.residentEid[holeEid] = eid;
    this.restoreResident(index);
  }

  restoreResident(index: number): void {
    const holeEid = this.getHoleEid(index);
    HoleComponent.occupantKind[holeEid] = HoleComponent.residentKind[holeEid];
    HoleComponent.occupantEid[holeEid] = HoleComponent.residentEid[holeEid];
  }

  canOccupyTriad(triad: readonly [number, number, number]): boolean {
    return triad.every(index => {
      const holeEid = this.getHoleEid(index);
      return HoleComponent.occupantKind[holeEid] === HoleComponent.residentKind[holeEid]
        && HoleComponent.occupantEid[holeEid] === HoleComponent.residentEid[holeEid];
    });
  }

  tryOccupyTriad(triad: readonly [number, number, number], kind: BoardOccupantKind, eid: number): boolean {
    if (!this.canOccupyTriad(triad)) return false;
    for (const index of triad) {
      const holeEid = this.getHoleEid(index);
      HoleComponent.occupantKind[holeEid] = kind;
      HoleComponent.occupantEid[holeEid] = eid;
    }
    return true;
  }

  releaseTriad(triad: readonly [number, number, number]): void {
    for (const index of triad) this.restoreResident(index);
  }
}

export const BoardCapability = defineCapability<BoardRuntime>("board");

const sceneQuery = defineQuery([SceneComponent]);
const holeQuery = defineQuery([HoleComponent]);

export function createBoardRuntimeFromWorld(world: any): BoardRuntime | undefined {
  const scenes = sceneQuery(world);
  if (scenes.length === 0) return undefined;

  const holes = Array.from(holeQuery(world));
  holes.sort((a, b) => HoleComponent.index[a] - HoleComponent.index[b]);
  if (holes.length === 0) return undefined;
  return new BoardRuntime(scenes[0], holes);
}
