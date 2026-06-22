import type { BindingFn } from "./SyncView";
import { createRuleBinding, createViewNodeRegistry } from "./RuleViewBinding";
import type { IMonsterNode } from "../sync/contracts/MonsterViewContract";
import { MONSTER_SYNC_RULES } from "../sync/rules/MonsterSyncRules";

export const monsterRegistry = createViewNodeRegistry<IMonsterNode>();
export const monsterViewBinding: BindingFn = createRuleBinding(monsterRegistry, MONSTER_SYNC_RULES, "monsterDirty");
