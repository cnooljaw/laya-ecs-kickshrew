import { registerComboNode, unregisterComboNode } from "../binding/ComboViewBinding";
import { registerHammerNode, unregisterHammerNode } from "../binding/HammerViewBinding";
import { registerHitEffectNode, unregisterHitEffectNode } from "../binding/HitViewBinding";
import { registerHoleNode, unregisterHoleNode } from "../binding/HoleViewBinding";
import { registerPlayerHUD, unregisterPlayerHUD } from "../binding/PlayerViewBinding";
import { registerPerfHeroNode, unregisterPerfHeroNode } from "../binding/PerfHeroViewBinding";
import { registerSceneLayer, unregisterSceneLayer } from "../binding/SceneViewBinding";
import { registerShrewNode, unregisterShrewNode } from "../binding/ShrewViewBinding";
import type { ViewNodeRegistry } from "../binding/RuleViewBinding";
import type { IComboNode } from "../sync/contracts/ComboViewContract";
import type { IHammerNode } from "../sync/contracts/HammerViewContract";
import type { IHitEffectNode } from "../sync/contracts/HitViewContract";
import type { IHoleNode } from "../sync/contracts/HoleViewContract";
import type { IPerfHeroNode } from "../sync/contracts/PerfHeroViewContract";
import type { IPlayerHUD } from "../sync/contracts/PlayerViewContract";
import type { ISceneLayer } from "../sync/contracts/SceneViewContract";
import type { IShrewNode } from "../sync/contracts/ShrewViewContract";

type Destroyable = { destroy(): void };

export class ViewRegistry {
  private readonly _unregisters: Array<() => void> = [];
  private readonly _nodes: Destroyable[] = [];

  registerNode<TNode>(eid: number, node: TNode & Destroyable, registry: ViewNodeRegistry<TNode>): void {
    registry.register(eid, node);
    this._track(node, () => registry.unregister(eid));
  }

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

  registerPerfHeroNode(eid: number, node: IPerfHeroNode & Destroyable): void {
    registerPerfHeroNode(eid, node);
    this._track(node, () => unregisterPerfHeroNode(eid));
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
