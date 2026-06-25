import type { EntityRuntime } from "../ecs/runtime/EntityRuntime";
import type { EffectRuntime } from "../effects/EffectRuntime";
import type { ProjectionDefinition } from "../sync/projection/ProjectionDefinition";
import type { ProjectionRuntime } from "../sync/projection/ProjectionRuntime";
import type { Destroyable, ViewRegistry } from "../view/ViewRegistry";

export interface MountableView extends Destroyable {
  create(parent: any): void;
}

export interface FeatureRuntimeContext {
  readonly world: any;
  readonly entities: EntityRuntime;
  readonly effects: Pick<EffectRuntime, "on" | "emit">;
  readonly views: {
    create<TNode extends MountableView>(options: {
      parent?: any;
      create: () => TNode;
    }): TNode;
    mount<TNode extends MountableView>(options: {
      eid: number;
      projection: ProjectionDefinition<TNode>;
      parent?: any;
      create: () => TNode;
    }): TNode;
    mountMany<TNode extends MountableView>(options: {
      eids: readonly number[];
      projection: ProjectionDefinition<TNode>;
      parent?: any;
      create: (eid: number, index: number) => TNode;
    }): TNode[];
  };
  readonly resources: {
    own<TResource extends Destroyable>(resource: TResource): TResource;
  };
}

interface FeatureRuntimeContextDeps {
  world: any;
  root: any;
  entityRuntime: EntityRuntime;
  projectionRuntime: ProjectionRuntime;
  viewRegistry: ViewRegistry;
  effectRuntime: EffectRuntime;
}

export function createFeatureRuntimeContext(
  deps: FeatureRuntimeContextDeps,
): FeatureRuntimeContext {
  function mount<TNode extends MountableView>(options: {
    eid: number;
    projection: ProjectionDefinition<TNode>;
    parent?: any;
    create: () => TNode;
  }): TNode {
    const node = options.create();
    node.create(options.parent ?? deps.root);
    deps.projectionRuntime.mount(options.projection, options.eid, node);
    return deps.viewRegistry.own(node);
  }

  return {
    world: deps.world,
    entities: deps.entityRuntime,
    effects: deps.effectRuntime,
    views: {
      create: options => {
        const node = options.create();
        node.create(options.parent ?? deps.root);
        return deps.viewRegistry.own(node);
      },
      mount,
      mountMany: options => {
        const nodes: MountableView[] = [];
        for (let index = 0; index < options.eids.length; index++) {
          const eid = options.eids[index];
          nodes.push(mount({
            eid,
            projection: options.projection,
            parent: options.parent,
            create: () => options.create(eid, index),
          }));
        }
        return nodes as ReturnType<typeof options.create>[];
      },
    },
    resources: {
      own: resource => deps.viewRegistry.own(resource),
    },
  };
}
