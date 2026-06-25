import {
  HoleEntity,
  ShrewEntity,
} from "../../ecs/gameplay/core/CoreEntities";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { HOLE_COUNT, type MapType, type ShrewType } from "../../ecs/types";

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
