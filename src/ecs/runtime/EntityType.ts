export type EntityCardinality = "one" | "many";

export interface EntityType<TInput = void> {
  readonly name: string;
  readonly components: readonly any[];
  readonly cardinality: EntityCardinality;
  readonly initialize: (eid: number, input: TInput) => void;
}

export function defineEntityType<TInput = void>(
  definition: EntityType<TInput>,
): EntityType<TInput> {
  return definition;
}
