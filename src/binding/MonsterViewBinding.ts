import type { BindingFn } from "./SyncView";
import { createViewSyncBinding, createViewNodeRegistry } from "./ViewSyncBinding";
import type { IMonsterNode } from "../sync/contracts/MonsterViewContract";
import { MONSTER_VIEW_SYNC_SPEC } from "../sync/viewSync/specs/MonsterViewSyncSpec";

export const monsterRegistry = createViewNodeRegistry<IMonsterNode>();
export const monsterViewBinding: BindingFn = createViewSyncBinding(monsterRegistry, MONSTER_VIEW_SYNC_SPEC, "monsterDirty");
