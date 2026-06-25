import { PerfHeroComponent } from "../../ecs/components";
import type { IPerfHeroNode } from "../contracts/PerfHeroViewContract";
import { defineProjection, projectionSource, watch } from "../../framework/sync/ProjectionDefinition";

const source = projectionSource("perfHero", PerfHeroComponent);

function applyTransform({ eid, node }: { eid: number; node: IPerfHeroNode }): void {
  node.setTransform(
    PerfHeroComponent.posX[eid],
    PerfHeroComponent.posY[eid],
    PerfHeroComponent.scale[eid],
  );
}

export const PerfHeroProjection = defineProjection<IPerfHeroNode>({
  name: "perfHero",
  components: [PerfHeroComponent],
  rows: [
    watch(source, ["posX", "posY"], "hero position", applyTransform),
    watch(source, ["scale"], "hero scale", applyTransform),
    watch(source, ["heroType", "spawnSeq"], "hero spawn", ({ eid, node }) => {
      node.playHero(PerfHeroComponent.heroType[eid], PerfHeroComponent.spawnSeq[eid]);
    }),
  ],
});
