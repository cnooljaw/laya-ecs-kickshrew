import type { BindingFn } from "../../binding/SyncView";
import { createRuleBinding, createViewNodeRegistry } from "../../binding/RuleViewBinding";
import type { IMonsterNode } from "../../sync/contracts/MonsterViewContract";
import { MONSTER_VIEW_RULES } from "./MonsterViewRules";

export const monsterRegistry = createViewNodeRegistry<IMonsterNode>();
export const monsterViewBinding: BindingFn = createRuleBinding(monsterRegistry, MONSTER_VIEW_RULES, "monsterDirty");
