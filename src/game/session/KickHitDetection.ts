import {
  findHammer,
  getHammerHitStatus,
  startHammerHitCooldown,
} from "../features/hammer/index";
import {
  applyMonsterLocalHit,
  collectMonsterKickTargets,
} from "../features/monster/index";
import {
  applyPlayerReward,
  findPlayer,
} from "../features/playerHud/index";
import {
  applyShrewLocalHit,
  collectShrewKickTargets,
} from "../features/shrew/index";
import {
  findClosestKickTarget,
  KickHitTargetKind,
  type KickTarget,
} from "./KickTargeting";

export { KickHitTargetKind } from "./KickTargeting";

export interface KickHitResult {
  bKickShrew: number;
  hitHoleIndex: number;
  hitHoleEid: number;
  hitShrewEid: number;
  hitMonsterEid: number;
  hitShrewType: number;
  numOfShrew: number;
  targetKind: KickHitTargetKind;
  actionState: number;
  actionStateName: string;
  animType: number;
  animTypeName: string;
  dizzyTriggered: boolean;
  isClickable: number;
  hp: number;
}

export function detectKickHit(world: any, touchXRatio: number, touchYRatio: number): KickHitResult {
  const emptyResult = createEmptyKickHitResult();
  const hammerEid = findHammer(world);
  if (hammerEid === undefined) return emptyResult;
  if (!getHammerHitStatus(hammerEid).canHit) return emptyResult;

  const target = findClosestKickTarget(collectKickTargets(world), {
    xRatio: touchXRatio,
    yRatio: touchYRatio,
  });
  if (!target) return emptyResult;

  startHammerHitCooldown(hammerEid);

  if (target.kind === KickHitTargetKind.Monster) {
    const hit = applyMonsterLocalHit(target.eid);
    if (hit.reward > 0) {
      const player = findPlayer(world);
      if (player !== undefined) applyPlayerReward(player, hit.reward);
    }
    return {
      ...emptyResult,
      hitMonsterEid: hit.hitMonsterEid,
      targetKind: KickHitTargetKind.Monster,
    };
  }

  const hit = applyShrewLocalHit(target.eid);
  return {
    ...emptyResult,
    bKickShrew: 1,
    hitHoleIndex: target.holeIndex,
    hitHoleEid: target.holeEid,
    hitShrewEid: target.eid,
    hitShrewType: hit.hitShrewType,
    numOfShrew: 1,
    targetKind: KickHitTargetKind.Shrew,
    actionState: hit.actionState,
    actionStateName: hit.actionStateName,
    animType: hit.animType,
    animTypeName: hit.animTypeName,
    dizzyTriggered: hit.dizzyTriggered,
    isClickable: hit.isClickable,
    hp: hit.hp,
  };
}

function collectKickTargets(world: any): KickTarget[] {
  return [
    ...collectShrewKickTargets(world).map(target => ({
      kind: KickHitTargetKind.Shrew as const,
      eid: target.eid,
      xRatio: target.xRatio,
      yRatio: target.yRatio,
      holeIndex: target.holeIndex,
      holeEid: target.holeEid,
      hitShrewType: target.shrewType,
    })),
    ...collectMonsterKickTargets(world).map(target => ({
      kind: KickHitTargetKind.Monster as const,
      eid: target.eid,
      xRatio: target.xRatio,
      yRatio: target.yRatio,
      holeIndex: -1,
      holeEid: -1,
      hitShrewType: 0,
    })),
  ];
}

function createEmptyKickHitResult(): KickHitResult {
  return {
    bKickShrew: 0,
    hitHoleIndex: -1,
    hitHoleEid: -1,
    hitShrewEid: -1,
    hitMonsterEid: -1,
    hitShrewType: 0,
    numOfShrew: 0,
    targetKind: KickHitTargetKind.None,
    actionState: 0,
    actionStateName: "",
    animType: 0,
    animTypeName: "",
    dizzyTriggered: false,
    isClickable: 0,
    hp: 0,
  };
}
