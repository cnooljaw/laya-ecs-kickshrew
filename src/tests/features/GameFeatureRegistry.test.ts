import { describe, expect, it } from "vitest";
import { defineEntity } from "../../framework/ecs/EntityDefinition";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../framework/ecs/GameWorld";
import {
  defineFeature,
  defineSystem,
  type FeatureManifest,
} from "../../framework/feature/FeatureManifest";
import { createGameFeatureRegistry, validateGameFeatures } from "../../framework/feature/FeatureRegistry";
import {
  defineProjection,
  noProjection,
  projectionSource,
  watch,
} from "../../framework/sync/ProjectionDefinition";
import { SceneComponent } from "../../game/board/BoardComponents";
import { createSetupContext } from "../helpers/FeatureSetupTestContext";

const TestSceneEntity = defineEntity({
  name: "testScene",
  components: [SceneComponent],
  cardinality: "one",
  initialize: () => {},
});
const sceneSource = projectionSource("scene", SceneComponent);
const TestSceneProjection = defineProjection({
  name: "testScene",
  components: [SceneComponent],
  rows: [watch(sceneSource, ["currentMap"], "current map", noProjection)],
});

function feature(name: string): FeatureManifest {
  const run = () => {};
  return defineFeature({
    name,
    systems: [defineSystem("feature", `${name}.system`, run)],
  });
}

describe("GameFeatureRegistry", () => {
  it("expands declarations and exposes phased systems only through setup runtime", () => {
    function updateState(): void {}
    function updateFeature(): void {}
    function updateSession(): void {}
    const setupOrder: string[] = [];
    const world = createGameWorld();
    const entities = createEntityRuntime(world, []);
    const setup = createSetupContext(entities);
    const registry = createGameFeatureRegistry([
      defineFeature({
        name: "compiled",
        entities: [TestSceneEntity],
        projections: [TestSceneProjection],
        systems: [
          defineSystem("state", "compiled.state", updateState),
          defineSystem("feature", "compiled.feature", updateFeature),
        ],
        setup: () => {
          setupOrder.push("feature.setup");
        },
        setupSystems: () => {
          setupOrder.push("feature.setupSystems");
          return [];
        },
      }),
    ], {
      sessionSetup: () => {
        setupOrder.push("session.setup");
      },
      systems: [defineSystem("state", "session.test", updateSession)],
    });

    expect(registry.entityTypes()).toEqual([TestSceneEntity]);
    expect(registry.projections()).toEqual([TestSceneProjection]);
    expect("systemsByPhase" in registry).toBe(false);

    const runtime = registry.setupAll(setup.context);
    expect(setupOrder).toEqual([
      "feature.setup",
      "session.setup",
      "feature.setupSystems",
    ]);
    expect(runtime.systemsByPhase("state").map(item => item.run)).toEqual([updateState, updateSession]);
    expect(runtime.systemsByPhase("feature").map(item => item.run)).toEqual([updateFeature]);
  });

  it("reuses precomputed phase arrays", () => {
    const registry = createGameFeatureRegistry([feature("featureA")]);
    const world = createGameWorld();
    const entities = createEntityRuntime(world, []);
    const setup = createSetupContext(entities);
    const runtime = registry.setupAll(setup.context);

    expect(runtime.systemsByPhase("feature")).toBe(runtime.systemsByPhase("feature"));
    expect(runtime.systemsByPhase("state")).toBe(runtime.systemsByPhase("state"));
  });

  it("rejects duplicate names", () => {
    const duplicateSystem = () => {};
    expect(() => validateGameFeatures([
      defineFeature({
        name: "a",
        systems: [defineSystem("state", "duplicate.system", duplicateSystem)],
      }),
      defineFeature({
        name: "b",
        systems: [defineSystem("feature", "duplicate.system", duplicateSystem)],
      }),
    ])).toThrow("FeatureSystem name 重复: duplicate.system");
    expect(() => createGameFeatureRegistry([
      defineFeature({
        name: "a",
        systems: [defineSystem("state", "duplicate.extra", duplicateSystem)],
      }),
    ], {
      systems: [defineSystem("feature", "duplicate.extra", duplicateSystem)],
    })).toThrow("FeatureSystem name 重复: duplicate.extra");
    expect(() => {
      const world = createGameWorld();
      const entities = createEntityRuntime(world, []);
      const setup = createSetupContext(entities);
      createGameFeatureRegistry([
        defineFeature({
          name: "a",
          systems: [defineSystem("state", "duplicate.setup", duplicateSystem)],
          setupSystems: () => [defineSystem("feature", "duplicate.setup", duplicateSystem)],
        }),
      ]).setupAll(setup.context);
    }).toThrow("FeatureSystem name 重复: duplicate.setup");
    expect(() => validateGameFeatures([feature("same"), feature("same")]))
      .toThrow("GameFeature name 重复: same");
    expect(() => validateGameFeatures([
      defineFeature({ name: "a", entities: [TestSceneEntity] }),
      defineFeature({ name: "b", entities: [TestSceneEntity] }),
    ])).toThrow("EntityDefinition name 重复: testScene");
    expect(() => validateGameFeatures([
      defineFeature({ name: "a", projections: [TestSceneProjection] }),
      defineFeature({ name: "b", projections: [TestSceneProjection] }),
    ])).toThrow("Projection name 重复: testScene");
  });
});
