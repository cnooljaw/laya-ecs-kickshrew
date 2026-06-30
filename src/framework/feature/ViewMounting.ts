import type { EntityDefinition } from "../ecs/EntityDefinition";
import type { ProjectionDefinition } from "../sync/ProjectionDefinition";
import type { Destroyable } from "../view/ViewRegistry";

export interface MountableView extends Destroyable {
  create(parent: any): void;
}

export interface CreateViewOptions<TNode extends MountableView> {
  readonly parent?: any;
  readonly create: () => TNode;
}

export interface MountOneOptions<TNode extends MountableView>
  extends CreateViewOptions<TNode> {
  readonly eid: number;
  readonly projection: ProjectionDefinition<TNode>;
}

export interface MountPoolOptions<TNode extends MountableView> {
  readonly eids: readonly number[];
  readonly projection: ProjectionDefinition<TNode>;
  readonly parent?: any;
  readonly create: (eid: number, index: number) => TNode;
}

export interface MountSingletonOptions<TNode extends MountableView>
  extends CreateViewOptions<TNode> {
  readonly entity: EntityDefinition<void>;
  readonly projection: ProjectionDefinition<TNode>;
}

export interface CreateAndMountManyOptions<TInput, TNode extends MountableView> {
  readonly entity: EntityDefinition<TInput>;
  readonly inputs: readonly TInput[];
  readonly projection: ProjectionDefinition<TNode>;
  readonly parent?: any;
  readonly create: (eid: number, index: number) => TNode;
}
