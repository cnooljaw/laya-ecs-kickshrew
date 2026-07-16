import { MemoryStatsPanel } from "../debug/MemoryStatsPanel";
import { RuntimeDiagnosticsPanel } from "../debug/RuntimeDiagnosticsPanel";
import { GameScene } from "./GameScene";

const { regClass } = Laya;

@regClass()
export class Main extends Laya.Script {
    private _gameScene: GameScene | null = null;
    private _memoryStatsPanel: MemoryStatsPanel | null = null;
    private _runtimeDiagnosticsPanel: RuntimeDiagnosticsPanel | null = null;

    onStart() {
        console.log("KickShrew Game starting...");

        // 0. 显示性能统计面板（FPS / DrawCall / 内存等）
        Laya.Stat.show(0, 0);
        this._memoryStatsPanel = new MemoryStatsPanel();
        this._memoryStatsPanel.show();

        // 1. 创建游戏场景
        this._gameScene = new GameScene();
        this._gameScene.init();
        this._runtimeDiagnosticsPanel = new RuntimeDiagnosticsPanel(
            () => this._gameScene?.getRuntimeDebugInfo() ?? null,
        );
        this._runtimeDiagnosticsPanel.show();

        // 2. 注册帧循环
        Laya.timer.frameLoop(1, this, this._onFrameLoop);

        // 3. 注册触摸事件
        const stage = Laya.stage;
        if (stage) {
            stage.on(Laya.Event.MOUSE_DOWN, this, this._onTouch);
        }

        // 4. 启动游戏
        this._gameScene.start();
    }

    private _onFrameLoop(): void {
        const delta = Laya.timer.delta / 1000; // ms → sec
        this._gameScene?.update(delta);
    }

    private _onTouch(): void {
        if (!this._gameScene) return;
        const stage = Laya.stage;
        if (!stage) return;

        // stage.mouseX/Y 在 SCALE_FIXED_AUTO 模式下已经是设计坐标系坐标，
        // 直接传给 GameScene，无需做归一化再反归一化（会导致缩放偏移）
        this._gameScene.onTouch(stage.mouseX, stage.mouseY);
    }

    onDestroy(): void {
        Laya.timer.clear(this, this._onFrameLoop);
        Laya.stage?.off(Laya.Event.MOUSE_DOWN, this, this._onTouch);
        this._memoryStatsPanel?.destroy();
        this._memoryStatsPanel = null;
        this._runtimeDiagnosticsPanel?.destroy();
        this._runtimeDiagnosticsPanel = null;
        this._gameScene?.destroy();
        this._gameScene = null;
    }
}
