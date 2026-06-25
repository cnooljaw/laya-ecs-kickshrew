import { DESIGN_RESOLUTION } from "../../../config/GameTuning";
import { defineEntity } from "../../../framework/ecs/EntityDefinition";
import { PerfHeroComponent } from "./PerfHeroComponents";
import { PERF_HERO_RULES } from "./PerfHeroRules";
import { PERF_HERO_VIEW_CONFIG } from "./PerfHeroViewConfig";

export const PerfHeroEntity = defineEntity<number>({
  name: "perfHero",
  components: [PerfHeroComponent],
  cardinality: "many",
  initialize: (eid, index) => {
    PerfHeroComponent.edge[eid] = index % 4;
    PerfHeroComponent.spawnSeq[eid] = 0;
    respawnPerfHero(eid);
    PerfHeroComponent.ageSec[eid] = -randomRange(0, PerfHeroComponent.durationSec[eid]);
  },
});

export function respawnPerfHero(eid: number): void {
  const edge = PerfHeroComponent.edge[eid];
  const pos = randomEdgePosition(edge);
  PerfHeroComponent.heroType[eid] = Math.floor(Math.random() * PERF_HERO_RULES.heroTypeCount);
  PerfHeroComponent.posX[eid] = pos.x;
  PerfHeroComponent.posY[eid] = pos.y;
  PerfHeroComponent.scale[eid] = randomRange(
    PERF_HERO_VIEW_CONFIG.minScale,
    PERF_HERO_VIEW_CONFIG.maxScale,
  );
  PerfHeroComponent.ageSec[eid] = 0;
  PerfHeroComponent.durationSec[eid] = randomRange(
    PERF_HERO_RULES.minDurationSec,
    PERF_HERO_RULES.maxDurationSec,
  );
  PerfHeroComponent.spawnSeq[eid] += 1;
}

function randomEdgePosition(edge: number): { x: number; y: number } {
  const layout = PERF_HERO_VIEW_CONFIG;
  const minX = layout.marginX;
  const maxX = DESIGN_RESOLUTION.width - layout.marginX;
  const minY = layout.marginY;
  const maxY = DESIGN_RESOLUTION.height - layout.marginY;
  const band = layout.edgeBandSize;

  switch (edge) {
    case 0:
      return { x: randomRange(minX, maxX), y: randomRange(minY, Math.min(minY + band, maxY)) };
    case 1:
      return { x: randomRange(Math.max(minX, maxX - band), maxX), y: randomRange(minY, maxY) };
    case 2:
      return { x: randomRange(minX, maxX), y: randomRange(Math.max(minY, maxY - band), maxY) };
    default:
      return { x: randomRange(minX, Math.min(minX + band, maxX)), y: randomRange(minY, maxY) };
  }
}

function randomRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
