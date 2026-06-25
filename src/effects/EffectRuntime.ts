import type { EffectDefinition } from "./EffectDefinition";

type EffectHandler<TPayload> = (payload: TPayload) => void;

interface PendingEffect {
  definition: EffectDefinition<any>;
  payload: any;
}

export interface EffectRuntime {
  on<TPayload>(
    definition: EffectDefinition<TPayload>,
    handler: EffectHandler<TPayload>,
  ): void;
  emit<TPayload>(
    definition: EffectDefinition<TPayload>,
    payload: TPayload,
  ): void;
  flush(): void;
  clear(): void;
}

export function createEffectRuntime(): EffectRuntime {
  const handlers = new Map<EffectDefinition<any>, Set<EffectHandler<any>>>();
  let pending: PendingEffect[] = [];

  return {
    on: (definition, handler) => {
      let registered = handlers.get(definition);
      if (!registered) {
        registered = new Set();
        handlers.set(definition, registered);
      }
      registered.add(handler);
    },
    emit: (definition, payload) => {
      pending.push({ definition, payload });
    },
    flush: () => {
      if (pending.length === 0) return;
      const current = pending;
      pending = [];
      for (let index = 0; index < current.length; index++) {
        const effect = current[index];
        const registered = handlers.get(effect.definition);
        if (!registered) continue;
        for (const handler of registered) {
          handler(effect.payload);
        }
      }
    },
    clear: () => {
      pending.length = 0;
      handlers.clear();
    },
  };
}
