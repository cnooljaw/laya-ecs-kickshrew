import {
  ShrewEntity,
} from "../../game/features/shrew";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { HOLE_COUNT, HoleEntity, type MapType } from "../../game/features/board";
import { type ShrewType } from "../../game/features/shrew";

export function createShrewEntity(
  world: any,
  shrewType: ShrewType,
  mapType: MapType,
): number {
  return createEntityRuntime(world, [ShrewEntity]).create(ShrewEntity, {
    shrewType,
    mapType,
  });
}

export function createHoleEntities(world: any, mapType: MapType): number[] {
  return createEntityRuntime(world, [HoleEntity]).createMany(
    HoleEntity,
    Array.from({ length: HOLE_COUNT }, (_, index) => ({ index, mapType })),
  );
}
