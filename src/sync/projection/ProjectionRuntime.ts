import { defineQuery } from "bitecs";
import {
  noProjection,
  type ProjectionApply,
  type ProjectionDefinition,
  type ProjectionField,
} from "./ProjectionDefinition";

interface CompiledProjection<TNode> {
  readonly definition: ProjectionDefinition<TNode>;
  readonly query: ReturnType<typeof defineQuery>;
  readonly fields: readonly ProjectionField[];
  readonly rowOffsets: readonly number[];
  readonly allBits: number;
  readonly dirtyBits: Uint32Array;
  readonly fullSync: Uint8Array;
  readonly snapshots: Map<number, Float64Array>;
  readonly nodes: Map<number, TNode>;
}

export interface ProjectionRuntime {
  projections(): readonly ProjectionDefinition<any>[];
  mount<TNode>(projection: ProjectionDefinition<TNode>, eid: number, node: TNode): TNode;
  unmount<TNode>(projection: ProjectionDefinition<TNode>, eid: number): void;
  nodeFor<TNode>(projection: ProjectionDefinition<TNode>, eid: number): TNode | undefined;
  mark(world: any): void;
  sync(world: any): void;
  clear(): void;
}

export function createProjectionRuntime(
  definitions: readonly ProjectionDefinition<any>[],
): ProjectionRuntime {
  const projectionDefinitions = Array.from(definitions);
  const compiledList = projectionDefinitions.map(compileProjection);
  const compiledByDefinition = new Map<ProjectionDefinition<any>, CompiledProjection<any>>();
  const names = new Set<string>();

  for (const compiled of compiledList) {
    if (names.has(compiled.definition.name)) {
      throw new Error(`Projection name duplicated: ${compiled.definition.name}`);
    }
    names.add(compiled.definition.name);
    compiledByDefinition.set(compiled.definition, compiled);
  }

  function getCompiled<TNode>(
    projection: ProjectionDefinition<TNode>,
  ): CompiledProjection<TNode> {
    const compiled = compiledByDefinition.get(projection);
    if (!compiled) {
      throw new Error(`Projection not compiled: ${projection.name}`);
    }
    return compiled;
  }

  return {
    projections: () => projectionDefinitions,
    mount: (projection, eid, node) => {
      const compiled = getCompiled(projection);
      compiled.nodes.set(eid, node);
      compiled.fullSync[eid] = 1;
      return node;
    },
    unmount: (projection, eid) => {
      getCompiled(projection).nodes.delete(eid);
    },
    nodeFor: (projection, eid) => getCompiled(projection).nodes.get(eid),
    mark: world => {
      for (const compiled of compiledList) {
        markProjection(world, compiled);
      }
    },
    sync: world => {
      for (const compiled of compiledList) {
        syncProjection(world, compiled);
      }
    },
    clear: () => {
      for (const compiled of compiledList) {
        compiled.nodes.clear();
        compiled.snapshots.clear();
        compiled.dirtyBits.fill(0);
        compiled.fullSync.fill(0);
      }
      compiledList.length = 0;
      projectionDefinitions.length = 0;
      compiledByDefinition.clear();
      names.clear();
    },
  };
}

function compileProjection<TNode>(
  definition: ProjectionDefinition<TNode>,
): CompiledProjection<TNode> {
  const fields: ProjectionField[] = [];
  const rowOffsets: number[] = [];
  let allBits = 0;

  for (const row of definition.rows) {
    rowOffsets.push(fields.length);
    fields.push(...row.fields);
    allBits = (allBits | row.bit) >>> 0;
  }

  if (fields.length === 0) {
    throw new Error(`Projection ${definition.name} must watch at least one field`);
  }

  const capacity = fields[0].values.length;
  return {
    definition,
    query: defineQuery(Array.from(definition.components)),
    fields,
    rowOffsets,
    allBits,
    dirtyBits: new Uint32Array(capacity),
    fullSync: new Uint8Array(capacity),
    snapshots: new Map(),
    nodes: new Map(),
  };
}

function markProjection<TNode>(world: any, compiled: CompiledProjection<TNode>): void {
  const entities = compiled.query(world);

  for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
    const eid = entities[entityIndex];
    let snapshot = compiled.snapshots.get(eid);

    if (!snapshot) {
      snapshot = new Float64Array(compiled.fields.length);
      copyCurrentFields(compiled.fields, eid, snapshot);
      compiled.snapshots.set(eid, snapshot);
      compiled.dirtyBits[eid] = compiled.allBits;
      continue;
    }

    let dirtyBits = 0;
    for (let rowIndex = 0; rowIndex < compiled.definition.rows.length; rowIndex++) {
      const row = compiled.definition.rows[rowIndex];
      const offset = compiled.rowOffsets[rowIndex];
      let changed = false;

      for (let fieldIndex = 0; fieldIndex < row.fields.length; fieldIndex++) {
        const current = row.fields[fieldIndex].values[eid];
        const snapshotIndex = offset + fieldIndex;
        if (snapshot[snapshotIndex] !== current) {
          changed = true;
          snapshot[snapshotIndex] = current;
        }
      }

      if (changed) dirtyBits = (dirtyBits | row.bit) >>> 0;
    }

    compiled.dirtyBits[eid] = dirtyBits;
  }
}

function syncProjection<TNode>(world: any, compiled: CompiledProjection<TNode>): void {
  const entities = compiled.query(world);

  for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {
    const eid = entities[entityIndex];
    const dirtyBits = compiled.dirtyBits[eid];
    const forceFull = compiled.fullSync[eid] === 1;
    const node = compiled.nodes.get(eid);

    if (node && (dirtyBits !== 0 || forceFull)) {
      applyRows(compiled.definition, eid, node, dirtyBits, forceFull);
    }

    compiled.dirtyBits[eid] = 0;
    compiled.fullSync[eid] = 0;
  }
}

function applyRows<TNode>(
  definition: ProjectionDefinition<TNode>,
  eid: number,
  node: TNode,
  dirtyBits: number,
  forceFull: boolean,
): void {
  for (let rowIndex = 0; rowIndex < definition.rows.length; rowIndex++) {
    const row = definition.rows[rowIndex];
    if (!forceFull && (dirtyBits & row.bit) === 0) continue;
    if (row.apply === noProjection) continue;
    if (hasAppliedEarlier(definition, rowIndex, row.apply, dirtyBits, forceFull)) continue;
    row.apply({ eid, node });
  }
}

function hasAppliedEarlier<TNode>(
  definition: ProjectionDefinition<TNode>,
  currentIndex: number,
  apply: ProjectionApply<TNode>,
  dirtyBits: number,
  forceFull: boolean,
): boolean {
  for (let rowIndex = 0; rowIndex < currentIndex; rowIndex++) {
    const previous = definition.rows[rowIndex];
    if (previous.apply !== apply) continue;
    if (forceFull || (dirtyBits & previous.bit) !== 0) return true;
  }
  return false;
}

function copyCurrentFields(
  fields: readonly ProjectionField[],
  eid: number,
  snapshot: Float64Array,
): void {
  for (let index = 0; index < fields.length; index++) {
    snapshot[index] = fields[index].values[eid];
  }
}
