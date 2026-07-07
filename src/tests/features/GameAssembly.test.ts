import { describe, expect, it } from "vitest";
import { createEntityRuntime } from "../../framework/ecs/EntityRuntime";
import { createGameWorld } from "../../framework/ecs/GameWorld";
import { validateGameFeatures } from "../../framework/feature/FeatureRegistry";
import {
  BoardFoundation,
  BoardOccupantKind,
  BoardTopologyCapability,
  HoleComponent,
  HoleEntity,
  HoleProjection,
  SceneEntity,
  SceneProjection,
  setupBoard,
} from "../../game/board/assembly";
import { HammerEntity, HammerProjection } from "../../game/features/hammer/assembly";
import { MONSTER_SPAWN_RULES } from "../../game/features/monster";
import {
  MonsterEntity,
  MonsterProjection,
  MonsterTriggerEntity,
} from "../../game/features/monster/assembly";
import {
  PerfHeroEntity,
  PerfHeroProjection,
} from "../../game/features/perfHero/assembly";
import {
  PlayerComponent,
  PlayerEntity,
  PlayerProjection,
} from "../../game/features/playerHud/assembly";
import {
  setupCoreGameplay,
  ShrewAction,
  ShrewComponent,
  ShrewEntity,
  ShrewProjection,
} from "../../game/features/shrew/assembly";
import {
  GAME_FEATURES,
  GAME_FEATURE_REGISTRY,
  GAME_FOUNDATIONS,
  GAME_MODULES,
} from "../../game/GameFeatures";
import { createSetupContext } from "../helpers/FeatureSetupTestContext";

describe("Game assembly", () => {
  it("keeps real feature contribution order stable", () => {
    expect(GAME_FOUNDATIONS.map(feature => feature.name)).toEqual(["board"]);
    expect(GAME_FEATURES.map(feature => feature.name).slice(0, 3)).toEqual([
      "monster",
      "shrew",
      "hammer",
    ]);
    expect(GAME_FEATURES.map(feature => feature.name)).not.toContain("board");
    expect(GAME_FEATURES.map(feature => feature.name)).not.toContain("session");
    expect(GAME_MODULES.map(feature => feature.name).slice(0, 3)).toEqual([
      "board",
      "monster",
      "shrew",
    ]);
    expect(GAME_FEATURE_REGISTRY.entityTypes()).toEqual(expect.arrayContaining([
      SceneEntity,
      HoleEntity,
      ShrewEntity,
      HammerEntity,
      PlayerEntity,
      PerfHeroEntity,
      MonsterEntity,
      MonsterTriggerEntity,
    ]));
    expect(GAME_FEATURE_REGISTRY.projections()).toEqual(expect.arrayContaining([
      SceneProjection,
      HoleProjection,
      ShrewProjection,
      HammerProjection,
      PlayerProjection,
      PerfHeroProjection,
      MonsterProjection,
    ]));
  });

  it("explicitly assembles nine hole-shrew pairs", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, [SceneEntity, HoleEntity, ShrewEntity]);
    entities.bootstrapSingletons();
    const { context } = createSetupContext(entities);

    const boardResult = setupBoard(context);
    const result = setupCoreGameplay(context);

    expect(boardResult.holes).toHaveLength(9);
    expect(result.shrews).toHaveLength(9);
    expect(context.use(BoardTopologyCapability)).toBe(boardResult.topology);
    expect(boardResult.holes.map(eid => HoleComponent.residentEid[eid])).toEqual(result.shrews);
    expect(boardResult.holes.map(eid => HoleComponent.occupantEid[eid])).toEqual(result.shrews);
  });

  it("sets up the complete runtime through stable capabilities", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, GAME_FEATURE_REGISTRY.entityTypes());
    entities.bootstrapSingletons();
    const setup = createSetupContext(entities);

    const runtime = GAME_FEATURE_REGISTRY.setupAll(setup.context);

    expect(Object.fromEntries(setup.mounts)).toEqual({
      scene: 1,
      hole: 9,
      shrew: 9,
      hammer: 1,
      player: 1,
      monster: MONSTER_SPAWN_RULES.reduce((count, rule) => count + rule.maxActiveCount, 0),
    });
    expect(setup.resourceCount()).toBe(1);
    expect(runtime.systemsByPhase("state").map(item => item.name)).toEqual([
      "board.mapCycle",
      "shrew.animationTimer",
      "shrew.state",
      "hammer.state",
      "session.hammerThunder",
    ]);
    expect(runtime.systemsByPhase("feature").map(item => item.name)).toEqual([
      "monster.lifetime",
      "monster.boardSync",
      "monster.spawn",
      "shrew.boardSync",
      "perfHero.state",
    ]);
  });

  it("runs Monster occupancy before final Shrew board sync in the same loop frame", () => {
    const world = createGameWorld();
    const entities = createEntityRuntime(world, GAME_FEATURE_REGISTRY.entityTypes());
    entities.bootstrapSingletons();
    const setup = createSetupContext(entities);
    const runtime = GAME_FEATURE_REGISTRY.setupAll(setup.context);
    const board = setup.context.use(BoardTopologyCapability);

    PlayerComponent.money[entities.one(PlayerEntity)] = 100;
    for (const hole of board.holes) {
      const shrew = HoleComponent.residentEid[hole];
      ShrewComponent.actionState[shrew] = ShrewAction.Stand;
      ShrewComponent.isClickable[shrew] = 1;
    }

    for (const system of runtime.systemsByPhase("state")) {
      system.run(world, 0);
    }
    for (const system of runtime.systemsByPhase("feature")) {
      system.run(world, 0);
    }

    const monsterHoles = board.holes.filter(hole => HoleComponent.occupantKind[hole] === BoardOccupantKind.Monster);
    expect(monsterHoles).toHaveLength(3);
    for (const hole of monsterHoles) {
      const shrew = HoleComponent.residentEid[hole];
      expect(ShrewComponent.actionState[shrew]).toBe(ShrewAction.Wait);
      expect(ShrewComponent.isClickable[shrew]).toBe(0);
    }
  });

  it("validates the real feature table", () => {
    expect(GAME_FOUNDATIONS).toContain(BoardFoundation);
    expect(GAME_FEATURES).not.toContain(BoardFoundation);
    expect(() => validateGameFeatures(GAME_MODULES)).not.toThrow();
  });
});
