import { describe, expect, it } from "vitest";
import { defineEntity } from "../../framework/ecs/EntityDefinition";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../framework/ecs/GameWorld";
import { defineCapability } from "../../framework/feature/FeatureSetupContext";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";
import { SceneComponent } from "../../game/board/BoardComponents";
import { createSetupContext } from "../helpers/FeatureSetupTestContext";

const TestSceneEntity = defineEntity({
  name: "testSetupScene",
  components: [SceneComponent],
  cardinality: "one",
  initialize: () => {},
});
const sceneSource = projectionSource("scene", SceneComponent);
const TestSceneProjection = defineProjection({
  name: "testSetupScene",
  components: [SceneComponent],
  rows: [watch(sceneSource, ["currentMap"], "current map", noProjection)],
});

describe("FeatureSetupContext", () => {
  it("shares typed setup capabilities between features", () => {
    const TestCapability = defineCapability<{ value: number }>("test.capability");
    const world = createGameWorld();
    const entities = createEntityRuntime(world, []);
    const setup = createSetupContext(entities);

    setup.context.provide(TestCapability, { value: 7 });

    expect(setup.context.use(TestCapability).value).toBe(7);
  });

  it("mounts singleton entity views through setup context capability", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [TestSceneEntity]);
    entities.bootstrapSingletons();
    const setup = createSetupContext(entities);

    const node = setup.context.mountSingleton({
      entity: TestSceneEntity,
      projection: TestSceneProjection,
      create: () => ({ destroy: () => {}, create: () => {} }),
    });

    expect(node).toBeDefined();
    expect(Object.fromEntries(setup.mounts)).toEqual({ testSetupScene: 1 });
  });

  it("creates and mounts many entity views through setup context capability", () => {
    const ManyEntity = defineEntity<number>({
      name: "testSetupMany",
      components: [SceneComponent],
      cardinality: "many",
      initialize: (eid, value) => {
        SceneComponent.currentMap[eid] = value;
      },
    });
    const ManyProjection = defineProjection({
      name: "testSetupMany",
      components: [SceneComponent],
      rows: [watch(sceneSource, ["currentMap"], "current map", noProjection)],
    });
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [ManyEntity]);
    const setup = createSetupContext(entities);

    const nodes = setup.context.createAndMountMany({
      entity: ManyEntity,
      inputs: [1, 2, 3],
      projection: ManyProjection,
      create: () => ({ destroy: () => {}, create: () => {} }),
    });

    expect(nodes).toHaveLength(3);
    expect(Object.fromEntries(setup.mounts)).toEqual({ testSetupMany: 3 });
  });
});
