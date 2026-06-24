import type { ViewNodeRegistry } from "../binding/ViewSyncBinding";

export interface Destroyable {
  destroy(): void;
}

export class ViewRegistry {
  private readonly unregisters: Array<() => void> = [];
  private readonly resources: Destroyable[] = [];

  mount<TContract, TNode extends TContract & Destroyable>(
    eid: number,
    node: TNode,
    registry: ViewNodeRegistry<TContract>,
  ): TNode {
    registry.register(eid, node);
    this.unregisters.push(() => registry.unregister(eid));
    this.resources.push(node);
    return node;
  }

  own<TResource extends Destroyable>(resource: TResource): TResource {
    this.resources.push(resource);
    return resource;
  }

  clear(): void {
    for (let i = this.unregisters.length - 1; i >= 0; i--) {
      this.unregisters[i]();
    }
    this.unregisters.length = 0;

    for (let i = this.resources.length - 1; i >= 0; i--) {
      this.resources[i].destroy();
    }
    this.resources.length = 0;
  }
}
