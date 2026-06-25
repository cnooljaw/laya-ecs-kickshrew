export interface EffectDefinition<TPayload> {
  readonly name: string;
  readonly __payload?: TPayload;
}

export function defineEffect<TPayload>(name: string): EffectDefinition<TPayload> {
  return { name };
}
