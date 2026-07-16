import { createClientDiagnostics, type ClientDiagnostics } from "./ClientDiagnostics";
import { GameScene } from "./GameScene";

const { regClass } = Laya;

@regClass()
export class Main extends Laya.Script {
    private _gameScene: GameScene | null = null;
    private _diagnostics: ClientDiagnostics | null = null;

    onStart() {
        console.log("KickShrew Game starting...");

        // 0. 创建可选的客户端诊断 owner。
        this._diagnostics = createClientDiagnostics();

        // 1. 创建游戏场景
        this._gameScene = new GameScene({
            frameDiagnostics: this._diagnostics.frameDiagnostics,
        });
        this._gameScene.init();
        this._diagnostics.attach(this._gameScene);

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
        this._diagnostics?.destroy();
        this._diagnostics = null;
        this._gameScene?.destroy();
        this._gameScene = null;
    }
}
