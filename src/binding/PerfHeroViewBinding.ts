import type { BindingFn } from "./SyncView";
import { createViewSyncBinding, createViewNodeRegistry } from "./ViewSyncBinding";
import { PERF_HERO_VIEW_SYNC_SPEC } from "../sync/viewSync/specs/PerfHeroViewSyncSpec";
import type { IPerfHeroNode } from "../sync/contracts/PerfHeroViewContract";

const perfHeroRegistry = createViewNodeRegistry<IPerfHeroNode>();

export const registerPerfHeroNode = perfHeroRegistry.register;
export const unregisterPerfHeroNode = perfHeroRegistry.unregister;
export const perfHeroViewBinding: BindingFn = createViewSyncBinding(perfHeroRegistry, PERF_HERO_VIEW_SYNC_SPEC);
