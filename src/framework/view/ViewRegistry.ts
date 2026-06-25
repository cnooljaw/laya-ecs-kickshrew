export interface Destroyable {
  destroy(): void;
}

export class ViewRegistry {
  private readonly resources: Destroyable[] = [];

  own<TResource extends Destroyable>(resource: TResource): TResource {
    this.resources.push(resource);
    return resource;
  }

  clear(): void {
    for (let i = this.resources.length - 1; i >= 0; i--) {
      this.resources[i].destroy();
    }
    this.resources.length = 0;
  }
}
