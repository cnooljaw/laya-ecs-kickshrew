import { registerComboNode, unregisterComboNode, IComboNode } from "../binding/ComboViewBinding";
import { registerHammerNode, unregisterHammerNode, IHammerNode } from "../binding/HammerViewBinding";
import { registerHitEffectNode, unregisterHitEffectNode, IHitEffectNode } from "../binding/HitViewBinding";
import { registerHoleNode, unregisterHoleNode, IHoleNode } from "../binding/HoleViewBinding";
import { registerPlayerHUD, unregisterPlayerHUD, IPlayerHUD } from "../binding/PlayerViewBinding";
import { registerSceneLayer, unregisterSceneLayer, ISceneLayer } from "../binding/SceneViewBinding";
import { registerShrewNode, unregisterShrewNode, IShrewNode } from "../binding/ShrewViewBinding";

type Destroyable = { destroy(): void };

export class ViewRegistry {
  private readonly _unregisters: Array<() => void> = [];
  private readonly _nodes: Destroyable[] = [];

  registerSceneLayer(eid: number, node: ISceneLayer & Destroyable): void {
    registerSceneLayer(eid, node);
    this._track(node, () => unregisterSceneLayer(eid));
  }

  registerHoleNode(eid: number, node: IHoleNode & Destroyable): void {
    registerHoleNode(eid, node);
    this._track(node, () => unregisterHoleNode(eid));
  }

  registerShrewNode(eid: number, node: IShrewNode & Destroyable): void {
    registerShrewNode(eid, node);
    this._track(node, () => unregisterShrewNode(eid));
  }

  registerHammerNode(eid: number, node: IHammerNode & Destroyable): void {
    registerHammerNode(eid, node);
    this._track(node, () => unregisterHammerNode(eid));
  }

  registerPlayerHUD(eid: number, node: IPlayerHUD & Destroyable): void {
    registerPlayerHUD(eid, node);
    this._track(node, () => unregisterPlayerHUD(eid));
  }

  registerComboNode(eid: number, node: IComboNode & Destroyable): void {
    registerComboNode(eid, node);
    this._track(node, () => unregisterComboNode(eid));
  }

  registerHitEffectNode(eid: number, node: IHitEffectNode & Destroyable): void {
    registerHitEffectNode(eid, node);
    this._track(node, () => unregisterHitEffectNode(eid));
  }

  clear(): void {
    for (let i = this._unregisters.length - 1; i >= 0; i--) {
      this._unregisters[i]();
    }
    this._unregisters.length = 0;

    for (let i = this._nodes.length - 1; i >= 0; i--) {
      this._nodes[i].destroy();
    }
    this._nodes.length = 0;
  }

  private _track(node: Destroyable, unregister: () => void): void {
    this._nodes.push(node);
    this._unregisters.push(unregister);
  }
}
