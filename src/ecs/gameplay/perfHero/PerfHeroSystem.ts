import { defineQuery } from "bitecs";
import { PerfHeroComponent } from "../../components";
import { respawnPerfHero } from "./PerfHeroEntity";

const perfHeroQuery = defineQuery([PerfHeroComponent]);

export function perfHeroSystem(world: any, deltaSec: number): void {
  const entities = perfHeroQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    PerfHeroComponent.ageSec[eid] += deltaSec;
    if (PerfHeroComponent.ageSec[eid] >= PerfHeroComponent.durationSec[eid]) {
      respawnPerfHero(eid);
    }
  }
}
