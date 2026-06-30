import type { EntityRuntime } from "../ecs/EntityRuntime";
import type { EffectRuntime } from "../sync/EffectRuntime";
import type { ProjectionDefinition } from "../sync/ProjectionDefinition";
import type { ProjectionRuntime } from "../sync/ProjectionRuntime";
import type { Destroyable, ViewRegistry } from "../view/ViewRegistry";
import type {
  CreateViewOptions,
  MountableView,
  MountOneOptions,
  MountPoolOptions,
} from "./ViewMounting";

export interface FeatureSetupContext {
  readonly entities: EntityRuntime;
  readonly effects: Pick<EffectRuntime, "on" | "emit">;
  createView<TNode extends MountableView>(options: CreateViewOptions<TNode>): TNode;
  mountOne<TNode extends MountableView>(options: MountOneOptions<TNode>): TNode;
  mountPool<TNode extends MountableView>(options: MountPoolOptions<TNode>): TNode[];
  own<TResource extends Destroyable>(resource: TResource): TResource;
}

interface FeatureSetupContextDeps {
  root: any;
  entityRuntime: EntityRuntime;
  projectionRuntime: ProjectionRuntime;
  viewRegistry: ViewRegistry;
  effectRuntime: EffectRuntime;
}

export function createFeatureSetupContext(
  deps: FeatureSetupContextDeps,
): FeatureSetupContext {
  function mountOne<TNode extends MountableView>(
    options: MountOneOptions<TNode>,
  ): TNode {
    const node = options.create();
    node.create(options.parent ?? deps.root);
    deps.projectionRuntime.mount(options.projection, options.eid, node);
    return deps.viewRegistry.own(node);
  }

  return {
    entities: deps.entityRuntime,
    effects: deps.effectRuntime,
    createView: options => {
      const node = options.create();
      node.create(options.parent ?? deps.root);
      return deps.viewRegistry.own(node);
    },
    mountOne,
    mountPool: options => {
      const nodes: MountableView[] = [];
      for (let index = 0; index < options.eids.length; index++) {
        const eid = options.eids[index];
        nodes.push(mountOne({
          eid,
          projection: options.projection,
          parent: options.parent,
          create: () => options.create(eid, index),
        }));
      }
      return nodes as ReturnType<typeof options.create>[];
    },
    own: resource => deps.viewRegistry.own(resource),
  };
}
