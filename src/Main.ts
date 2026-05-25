import { GameScene } from "./view/GameScene";

const { regClass } = Laya;

@regClass()
export class Main extends Laya.Script {
    private _gameScene: GameScene | null = null;

    onStart() {
        console.log("KickShrew Game starting...");

        // 0. 显示性能统计面板（FPS / DrawCall / 内存等）
        Laya.Stat.show(0, 0);

        // 1. 创建游戏场景
        this._gameScene = new GameScene();
        this._gameScene.init();

        // 2. 注册帧循环
        Laya.timer.frameLoop(1, this, () => {
            const delta = Laya.timer.delta / 1000; // ms → sec
            this._gameScene?.update(delta);
        });

        // 3. 注册触摸事件
        const stage = Laya.stage;
        if (stage) {
            stage.on(Laya.Event.MOUSE_DOWN, this, this._onTouch);
        }

        // 4. 启动游戏
        this._gameScene.start();
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
        this._gameScene?.stop();
        this._gameScene = null;
    }
}
