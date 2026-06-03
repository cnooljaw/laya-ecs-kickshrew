import { defineQuery } from "bitecs";
import { PerfLadybirdComponent } from "../components";

const perfLadybirdQuery = defineQuery([PerfLadybirdComponent]);

export function perfLadybirdSystem(world: any, deltaSec: number): void {
  const entities = perfLadybirdQuery(world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const phase = PerfLadybirdComponent.phase[eid] + PerfLadybirdComponent.speed[eid] * deltaSec;
    PerfLadybirdComponent.phase[eid] = phase;
    PerfLadybirdComponent.posX[eid] =
      PerfLadybirdComponent.baseX[eid] + Math.sin(phase) * PerfLadybirdComponent.radiusX[eid];
    PerfLadybirdComponent.posY[eid] =
      PerfLadybirdComponent.baseY[eid] + Math.cos(phase * 1.37) * PerfLadybirdComponent.radiusY[eid];
  }
}
