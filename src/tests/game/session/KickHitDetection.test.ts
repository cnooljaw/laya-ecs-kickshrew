import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld } from '../../../framework/ecs/GameWorld';
import { createSingletonEntities } from '../../helpers/SingletonTestEntities';
import { createHoleEntities, createShrewEntity } from '../../helpers/CoreTestEntities';
import { createEntityRuntime } from "../../../framework/ecs/EntityRuntime";
import { HammerComponent } from "../../../game/features/hammer";
import { HammerType } from "../../../game/features/hammer";
import {
  BoardPositionComponent,
  BoardOccupantKind,
  HoleComponent,
  MapType,
  HOLE_COUNT,
} from "../../../game/features/board";
import {
  SHREW_TIMING,
  ShrewAction,
  ShrewComponent,
  ShrewType,
} from "../../../game/features/shrew";
import { MonsterComponent, MonsterEntity, MonsterType } from "../../../game/features/monster";
import { PlayerComponent } from "../../../game/features/playerHud";
import { detectKickHit, KickHitResult } from "../../../game/session/KickHitDetection";
import { HAMMER_RULES } from "../../../config/GameTuning";

describe('KickHitDetection', () => {
  let world: ReturnType<typeof createGameWorld>;
  let holes: number[];
  let singletons: ReturnType<typeof createSingletonEntities>;

  beforeEach(() => {
    world = createGameWorld();
    singletons = createSingletonEntities(world);
    holes = createHoleEntities(world, MapType.Meadow);

    // 为每个洞位创建地鼠，并设为可点击
    for (let i = 0; i < HOLE_COUNT; i++) {
      const shrewEid = createShrewEntity(world, ShrewType.Red, MapType.Meadow);
      bindShrewToHole(holes[i], shrewEid);
      ShrewComponent.actionState[shrewEid] = ShrewAction.Stand;
      ShrewComponent.isClickable[shrewEid] = 1;
    }
  });

  const touchAtHole = (holeIndex: number): [number, number] => {
    const holeEid = holes[holeIndex];
    return [HoleComponent.posXRatio[holeEid], HoleComponent.posYRatio[holeEid]];
  };

  const createMonsterAtTriad = (triad: readonly [number, number, number]): number => {
    const monster = createEntityRuntime(world, [MonsterEntity]).create(MonsterEntity, {
      monsterType: MonsterType.Rhino,
      posX: 0,
      posY: 0,
      scale: 1,
      durationSec: 10,
    });
    MonsterComponent.visible[monster] = 1;
    MonsterComponent.hp[monster] = 3;
    MonsterComponent.holeA[monster] = triad[0];
    MonsterComponent.holeB[monster] = triad[1];
    MonsterComponent.holeC[monster] = triad[2];
    BoardPositionComponent.xRatio[monster] = triad.reduce((sum, index) => sum + HoleComponent.posXRatio[holes[index]], 0) / 3;
    BoardPositionComponent.yRatio[monster] = triad.reduce((sum, index) => sum + HoleComponent.posYRatio[holes[index]], 0) / 3;
    BoardPositionComponent.zIndex[monster] = 80;
    for (const index of triad) {
      HoleComponent.occupantKind[holes[index]] = BoardOccupantKind.Monster;
      HoleComponent.occupantEid[holes[index]] = monster;
    }
    return monster;
  };

  it('触摸点在地鼠 hitArea 内: 返回击中结果', () => {
    const result = detectKickHit(world, ...touchAtHole(1));

    expect(result.bKickShrew).toBe(1);
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

    expect(result.bKickShrew).toBe(0);
  });

  it('锤子 hitTable=0 时(动画中): 不响应触摸', () => {
    HammerComponent.hitTable[singletons.hammer] = 0;

    const result = detectKickHit(world, ...touchAtHole(1));

    expect(result.bKickShrew).toBe(0);
  });

  it('锤子 hitTable=1 时: 正常响应触摸', () => {
    HammerComponent.hitTable[singletons.hammer] = 1;

    const result = detectKickHit(world, ...touchAtHole(1));

    expect(result.bKickShrew).toBe(1);
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
    bindShrewToHole(holes[1], shrewEid);
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

    expect(result.bKickShrew).toBe(0);
  });

  it('击中后 hitTable 设为 0 (防止连点)', () => {
    HammerComponent.hitTable[singletons.hammer] = 1;

    detectKickHit(world, ...touchAtHole(1));

    expect(HammerComponent.hitTable[singletons.hammer]).toBe(0);
    expect(HammerComponent.hitCooldownSec[singletons.hammer]).toBeCloseTo(HAMMER_RULES.hitCooldownSec, 3);
  });

  it("命中 Monster 三次后奖励 30 金币并释放三角形洞位", () => {
    const monster = createMonsterAtTriad([0, 1, 3]);
    const x = BoardPositionComponent.xRatio[monster];
    const y = BoardPositionComponent.yRatio[monster];
    PlayerComponent.money[singletons.player] = 100;

    for (let i = 0; i < 3; i++) {
      HammerComponent.hitTable[singletons.hammer] = 1;
      const result = detectKickHit(world, x, y);
      expect(result.hitMonsterEid).toBe(monster);
    }

    expect(MonsterComponent.hp[monster]).toBe(0);
    expect(MonsterComponent.hitSeq[monster]).toBe(3);
    expect(MonsterComponent.defeatedSeq[monster]).toBe(1);
    expect(PlayerComponent.money[singletons.player]).toBe(130);
    for (const index of [0, 1, 3]) {
      expect(HoleComponent.occupantKind[holes[index]]).toBe(BoardOccupantKind.Shrew);
      expect(HoleComponent.occupantEid[holes[index]]).toBe(HoleComponent.residentEid[holes[index]]);
    }
  });
});

function bindShrewToHole(holeEid: number, shrewEid: number): void {
  ShrewComponent.holeIndex[shrewEid] = HoleComponent.index[holeEid];
  HoleComponent.residentKind[holeEid] = BoardOccupantKind.Shrew;
  HoleComponent.residentEid[holeEid] = shrewEid;
  HoleComponent.occupantKind[holeEid] = BoardOccupantKind.Shrew;
  HoleComponent.occupantEid[holeEid] = shrewEid;
  BoardPositionComponent.xRatio[shrewEid] = HoleComponent.posXRatio[holeEid];
  BoardPositionComponent.yRatio[shrewEid] = HoleComponent.posYRatio[holeEid];
  BoardPositionComponent.zIndex[shrewEid] = HoleComponent.zIndex[holeEid];
}
