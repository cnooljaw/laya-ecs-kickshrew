/**
 * NodePool — 通用节点对象池
 * 复用 Laya Sprite 节点，避免频繁创建/销毁
 */
export class NodePool {
  private _pool: Map<string, any[]> = new Map();

  get(tag: string): any | null {
    const list = this._pool.get(tag);
    if (list && list.length > 0) {
      return list.pop();
    }
    return null;
  }

  put(tag: string, node: any): void {
    if (!this._pool.has(tag)) {
      this._pool.set(tag, []);
    }
    this._pool.get(tag)!.push(node);
  }

  clear(tag?: string): void {
    if (tag) {
      this._pool.delete(tag);
    } else {
      this._pool.clear();
    }
  }

  size(tag: string): number {
    return this._pool.get(tag)?.length || 0;
  }
}

export const nodePool = new NodePool();
