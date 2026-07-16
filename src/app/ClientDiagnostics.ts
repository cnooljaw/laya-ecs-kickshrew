import { MemoryStatsPanel } from "../debug/MemoryStatsPanel";
import { RuntimeDiagnosticsPanel } from "../debug/RuntimeDiagnosticsPanel";
import { createFrameDiagnostics, type FrameDiagnostics } from "./FrameDiagnostics";
import type { GameScene } from "./GameScene";

const ENABLE_CLIENT_DIAGNOSTICS = false;

export interface ClientDiagnostics {
  readonly frameDiagnostics: FrameDiagnostics | undefined;
  attach(scene: GameScene): void;
  destroy(): void;
}

interface ClientDiagnosticsOptions {
  readonly enabled?: boolean;
}

/** Owns optional client diagnostics; this is the sole runtime switch. */
export function createClientDiagnostics(
  options: ClientDiagnosticsOptions = {},
): ClientDiagnostics {
  const enabled = options.enabled ?? ENABLE_CLIENT_DIAGNOSTICS;
  if (!enabled) return disabledDiagnostics;

  const frameDiagnostics = createFrameDiagnostics();
  const memoryStatsPanel = new MemoryStatsPanel();
  let runtimeDiagnosticsPanel: RuntimeDiagnosticsPanel | null = null;

  return {
    frameDiagnostics,
    attach: scene => {
      const Laya = getLaya();
      Laya?.Stat?.show?.(0, 0);
      memoryStatsPanel.show();
      runtimeDiagnosticsPanel = new RuntimeDiagnosticsPanel(
        () => scene.getRuntimeDebugInfo(),
      );
      runtimeDiagnosticsPanel.show();
    },
    destroy: () => {
      memoryStatsPanel.destroy();
      runtimeDiagnosticsPanel?.destroy();
      runtimeDiagnosticsPanel = null;
      getLaya()?.Stat?.hide?.();
    },
  };
}

const disabledDiagnostics: ClientDiagnostics = {
  frameDiagnostics: undefined,
  attach: () => {},
  destroy: () => {},
};

function getLaya(): any {
  return typeof window !== "undefined" ? (window as any).Laya : null;
}
