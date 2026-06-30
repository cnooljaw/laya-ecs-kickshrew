import type { EntityRuntime } from "../ecs/EntityRuntime";
import type { EffectRuntime } from "../sync/EffectRuntime";
import type { ProjectionDefinition } from "../sync/ProjectionDefinition";
import type { ProjectionRuntime } from "../sync/ProjectionRuntime";
import type { Destroyable, ViewRegistry } from "../view/ViewRegistry";
import type {
  CreateAndMountManyOptions,
  CreateViewOptions,
  MountableView,
  MountOneOptions,
  MountPoolOptions,
  MountSingletonOptions,
} from "./ViewMounting";

export interface FeatureSetupContext {
  readonly entities: EntityRuntime;
  readonly effects: Pick<EffectRuntime, "on" | "emit">;
  createView<TNode extends MountableView>(options: CreateViewOptions<TNode>): TNode;
  mountOne<TNode extends MountableView>(options: MountOneOptions<TNode>): TNode;
  mountPool<TNode extends MountableView>(options: MountPoolOptions<TNode>): TNode[];
  mountSingleton<TNode extends MountableView>(options: MountSingletonOptions<TNode>): TNode;
  createAndMountMany<TInput, TNode extends MountableView>(
    options: CreateAndMountManyOptions<TInput, TNode>,
  ): TNode[];
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

  function mountPool<TNode extends MountableView>(
    options: MountPoolOptions<TNode>,
  ): TNode[] {
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
    mountPool,
    mountSingleton: options => mountOne({
      eid: deps.entityRuntime.one(options.entity),
      projection: options.projection,
      parent: options.parent,
      create: options.create,
    }),
    createAndMountMany: options => {
      const eids = deps.entityRuntime.createMany(options.entity, options.inputs);
      return mountPool({
        eids,
        projection: options.projection,
        parent: options.parent,
        create: options.create,
      });
    },
    own: resource => deps.viewRegistry.own(resource),
  };
}
