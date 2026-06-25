export interface ProjectionField {
  readonly path: string;
  readonly values: ArrayLike<number>;
}

export interface ProjectionContext<TNode> {
  readonly eid: number;
  readonly node: TNode;
}

export type ProjectionApply<TNode> = (context: ProjectionContext<TNode>) => void;

export interface ProjectionSource<
  TComponent extends Record<string, ArrayLike<number>>,
> {
  readonly name: string;
  readonly component: TComponent;
}

export interface ProjectionRow<TNode> {
  readonly bit: number;
  readonly label: string;
  readonly fields: readonly ProjectionField[];
  readonly apply: ProjectionApply<TNode>;
}

export interface ProjectionDefinition<TNode> {
  readonly name: string;
  readonly components: readonly any[];
  readonly rows: readonly ProjectionRow<TNode>[];
}

interface ProjectionRowDraft<TNode> {
  readonly label: string;
  readonly fields: readonly ProjectionField[];
  readonly apply: ProjectionApply<TNode>;
}

interface ProjectionOptions<TNode> {
  readonly name: string;
  readonly components: readonly any[];
  readonly rows: readonly ProjectionRowDraft<TNode>[];
}

export function projectionSource<
  TComponent extends Record<string, ArrayLike<number>>,
>(
  name: string,
  component: TComponent,
): ProjectionSource<TComponent> {
  return { name, component };
}

export function watch<
  TNode,
  TComponent extends Record<string, ArrayLike<number>>,
  TField extends Extract<keyof TComponent, string>,
>(
  source: ProjectionSource<TComponent>,
  fields: readonly TField[],
  label: string,
  apply: ProjectionApply<TNode>,
): ProjectionRowDraft<TNode> {
  return {
    label,
    fields: fields.map((fieldName) => ({
      path: `${source.name}.${fieldName}`,
      values: source.component[fieldName],
    })),
    apply,
  };
}

export function defineProjection<TNode>(
  options: ProjectionOptions<TNode>,
): ProjectionDefinition<TNode> {
  if (options.rows.length > 32) {
    throw new Error(`Projection ${options.name} supports at most 32 dirty rows`);
  }

  const rows = options.rows.map((row, index) => {
    if (row.fields.length === 0) {
      throw new Error(`Projection ${options.name} row ${index} must watch at least one field`);
    }
    return {
      ...row,
      bit: 2 ** index,
    };
  });

  return {
    name: options.name,
    components: options.components,
    rows,
  };
}

export const noProjection: ProjectionApply<any> = () => {};
