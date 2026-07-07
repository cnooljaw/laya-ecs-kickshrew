import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld } from '../../../framework/ecs/GameWorld';
import { createSingletonEntities } from '../../helpers/SingletonTestEntities';
import {
  bindShrewToHoleForTest,
  createHoleEntities,
  createMonsterAtTriadForTest,
  createShrewEntity,
} from '../../helpers/CoreTestEntities';
import { HammerComponent } from "../../../game/features/hammer/HammerComponents";
import {
  BoardOccupantKind,
  createBoardTopology,
  MapType,
  HOLE_COUNT,
  type BoardTopology,
} from "../../../game/board";
import { HoleComponent } from "../../../game/board/BoardComponents";
import {
  SHREW_TIMING,
  ShrewAction,
  ShrewType,
} from "../../../game/features/shrew";
import { ShrewComponent } from "../../../game/features/shrew/ShrewComponents";
import { MonsterAction } from "../../../game/features/monster";
import { MonsterComponent } from "../../../game/features/monster/MonsterComponents";
import { monsterLifetimeSystem } from "../../../game/features/monster/MonsterSystems";
import { PlayerComponent } from "../../../game/features/playerHud/PlayerComponents";
import { detectKickHit, KickHitTargetKind } from "../../../game/session/KickHitDetection";
import { HAMMER_RULES } from "../../../config/GameTuning";

describe('KickHitDetection', () => {
  let world: ReturnType<typeof createGameWorld>;
  let holes: number[];
  let board: BoardTopology;
  let singletons: ReturnType<typeof createSingletonEntities>;

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
    holes = createHoleEntities(world, MapType.Meadow);
    board = createBoardTopology(singletons.scene, holes);

    // 为每个洞位创建地鼠，并设为可点击
    for (let i = 0; i < HOLE_COUNT; i++) {
      const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
      bindShrewToHoleForTest(holes[i], shrewEid);
      ShrewComponent.actionState[shrewEid] = ShrewAction.Stand;
      ShrewComponent.isClickable[shrewEid] = 1;
    }
  });

  const touchAtHole = (holeIndex: number): [number, number] => {
    const holeEid = holes[holeIndex];
    return [HoleComponent.posXRatio[holeEid], HoleComponent.posYRatio[holeEid]];
  };

  it('触摸点在地鼠 hitArea 内: 返回击中结果', () => {
    const result = detectKickHit(world, ...touchAtHole(1));

    expect(result.targetKind).toBe(KickHitTargetKind.Shrew);
    if (result.targetKind !== KickHitTargetKind.Shrew) throw new Error("expected shrew hit");
    expect(result.hitHoleIndex).toBeGreaterThanOrEqual(0);
    expect(result.hitHoleIndex).toBeLessThan(HOLE_COUNT);
  });

  it('地鼠 isClickable=0 时: 不击中', () => {
    // 让所有地鼠不可点击
    for (let i = 0; i < HOLE_COUNT; i++) {
      const shrewEid = HoleComponent.occupantEid[holes[i]];
      ShrewComponent.isClickable[shrewEid] = 0;
    }

    const result = detectKickHit(world, ...touchAtHole(1));

    expect(result.targetKind).toBe(KickHitTargetKind.None);
  });

  it('锤子 hitTable=0 时(动画中): 不响应触摸', () => {
    HammerComponent.hitTable[singletons.hammer] = 0;

    const result = detectKickHit(world, ...touchAtHole(1));

    expect(result.targetKind).toBe(KickHitTargetKind.None);
  });

  it('锤子 hitTable=1 时: 正常响应触摸', () => {
    HammerComponent.hitTable[singletons.hammer] = 1;

    const result = detectKickHit(world, ...touchAtHole(1));

    expect(result.targetKind).toBe(KickHitTargetKind.Shrew);
  });

  it('击中红鼠: hp-1, actionState=Dizzy', () => {
    const shrewEid = HoleComponent.occupantEid[holes[1]];
    ShrewComponent.hp[shrewEid] = 1;
    ShrewComponent.isClickable[shrewEid] = 1;

    detectKickHit(world, ...touchAtHole(1));

    expect(ShrewComponent.hp[shrewEid]).toBe(0);
    expect(ShrewComponent.actionState[shrewEid]).toBe(ShrewAction.Dizzy);
    expect(ShrewComponent.animTimer[shrewEid]).toBeCloseTo(SHREW_TIMING.dizzyHoldSec, 3);
    expect(ShrewComponent.isClickable[shrewEid]).toBe(0);
  });

  it('击中蓝鼠第一击: hp-1, hasHat→0, 进入Dizzy', () => {
    const shrewEid = createShrewEntity(world, ShrewType.Blue, MapType.Meadow);
    bindShrewToHoleForTest(holes[1], shrewEid);
    ShrewComponent.hp[shrewEid] = 2;
    ShrewComponent.hasHat[shrewEid] = 1;
    ShrewComponent.isClickable[shrewEid] = 1;
    ShrewComponent.actionState[shrewEid] = ShrewAction.Stand;

    detectKickHit(world, ...touchAtHole(1));

    expect(ShrewComponent.hp[shrewEid]).toBe(1);
    expect(ShrewComponent.hasHat[shrewEid]).toBe(0);
    expect(ShrewComponent.actionState[shrewEid]).toBe(ShrewAction.Dizzy);
  });

  it('触摸点不在任何洞位范围内: 未击中', () => {
    // 触摸坐标超出所有洞位范围
    const result = detectKickHit(world, 0.01, 0.01);

    expect(result.targetKind).toBe(KickHitTargetKind.None);
  });

  it('击中后 hitTable 设为 0 (防止连点)', () => {
    HammerComponent.hitTable[singletons.hammer] = 1;

    detectKickHit(world, ...touchAtHole(1));

    expect(HammerComponent.hitTable[singletons.hammer]).toBe(0);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBeCloseTo(HAMMER_RULES.hitCooldownSec, 3);
  });

  it("Monster Drop 阶段不可命中，也不会穿透命中被占用三洞内的地鼠", () => {
    const triad: readonly [number, number, number] = [0, 1, 3];
    const monster = createMonsterAtTriadForTest(world, holes, triad, {
      actionState: MonsterAction.Drop,
    });
    const [x, y] = triadCenter(holes, triad);

    const result = detectKickHit(world, x, y);

    expect(result.targetKind).toBe(KickHitTargetKind.None);
    expect(MonsterComponent.hp[monster]).toBe(3);
    for (const index of [0, 1, 3]) {
      const resident = HoleComponent.residentEid[holes[index]];
      expect(ShrewComponent.isClickable[resident]).toBe(1);
    }
  });

  it("命中 Monster 三次后进入 Dizzy，奖励 30 金币，Dizzy 结束后释放三角形洞位", () => {
    const triad: readonly [number, number, number] = [0, 1, 3];
    const monster = createMonsterAtTriadForTest(world, holes, triad);
    const [x, y] = triadCenter(holes, triad);
    PlayerComponent.money[singletons.player] = 100;

    for (let i = 0; i < 3; i++) {
      HammerComponent.hitTable[singletons.hammer] = 1;
      const result = detectKickHit(world, x, y);
      expect(result.targetKind).toBe(KickHitTargetKind.Monster);
      if (result.targetKind !== KickHitTargetKind.Monster) throw new Error("expected monster hit");
      expect(result.hitMonsterEid).toBe(monster);
    }

    expect(MonsterComponent.hp[monster]).toBe(0);
    expect(MonsterComponent.actionState[monster]).toBe(MonsterAction.Dizzy);
    expect(MonsterComponent.hitSeq[monster]).toBe(3);
    expect(MonsterComponent.defeatedSeq[monster]).toBe(1);
    expect(PlayerComponent.money[singletons.player]).toBe(130);
    for (const index of [0, 1, 3]) {
      expect(HoleComponent.occupantKind[holes[index]]).toBe(BoardOccupantKind.Monster);
      expect(HoleComponent.occupantEid[holes[index]]).toBe(monster);
    }

    monsterLifetimeSystem(world, 0.6, board);

    expect(MonsterComponent.actionState[monster]).toBe(MonsterAction.Wait);
    expect(MonsterComponent.visible[monster]).toBe(0);
    for (const index of [0, 1, 3]) {
      expect(HoleComponent.occupantKind[holes[index]]).toBe(BoardOccupantKind.Shrew);
      expect(HoleComponent.occupantEid[holes[index]]).toBe(HoleComponent.residentEid[holes[index]]);
    }
  });
});

function triadCenter(
  holes: readonly number[],
  triad: readonly [number, number, number],
): [number, number] {
  return [
    triad.reduce((sum, index) => sum + HoleComponent.posXRatio[holes[index]], 0) / 3,
    triad.reduce((sum, index) => sum + HoleComponent.posYRatio[holes[index]], 0) / 3,
  ];
}
