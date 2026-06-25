export type EntityCardinality = "one" | "many";

export interface EntityDefinition<TInput = void> {
  readonly name: string;
  readonly components: readonly any[];
  readonly cardinality: EntityCardinality;
  readonly initialize: (eid: number, input: TInput) => void;
}

export function defineEntity<TInput = void>(
  definition: EntityDefinition<TInput>,
): EntityDefinition<TInput> {
  return definition;
}
