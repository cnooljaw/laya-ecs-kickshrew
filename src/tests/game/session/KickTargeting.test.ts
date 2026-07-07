import { describe, expect, it } from "vitest";
import {
  findClosestKickTarget,
  KickHitTargetKind,
  type KickTarget,
} from "../../../game/session/KickTargeting";

describe("KickTargeting", () => {
  it("keeps Monster target data free of Shrew-only fields", () => {
    const monsterTarget: KickTarget = {
      kind: KickHitTargetKind.Monster,
      eid: 2001,
      xRatio: 0.5,
      yRatio: 0.6,
    };

    const closest = findClosestKickTarget([monsterTarget], {
      xRatio: 0.5,
      yRatio: 0.6,
    });

    expect(closest).toBe(monsterTarget);
    expect(closest).not.toHaveProperty("holeIndex");
    expect(closest).not.toHaveProperty("holeEid");
    expect(closest).not.toHaveProperty("hitShrewType");
  });

  it("keeps Shrew target data explicit about the occupied hole", () => {
    const shrewTarget: KickTarget = {
      kind: KickHitTargetKind.Shrew,
      eid: 1001,
      xRatio: 0.4,
      yRatio: 0.5,
      holeIndex: 1,
      holeEid: 301,
      hitShrewType: 2,
    };

    expect(findClosestKickTarget([shrewTarget], {
      xRatio: 0.4,
      yRatio: 0.5,
    })).toBe(shrewTarget);
  });
});
