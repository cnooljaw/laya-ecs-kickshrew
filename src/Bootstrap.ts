import { Main } from "./Main";
import { DESIGN_RESOLUTION } from "./config/GameTuning";

// ES module 入口：Laya 运行库已通过 <script> 全局加载，window.Laya 可用
// <script type="module"> 是延迟执行的，Laya 运行库先完成加载

// laya.ui2 在 _init 时访问 PlayerConfig.UI.alwaysIncludeDefaultSkin，需预先初始化
if (!(Laya as any).PlayerConfig) (Laya as any).PlayerConfig = {};
if (!(Laya as any).PlayerConfig.UI) (Laya as any).PlayerConfig.UI = {};

Laya.init(DESIGN_RESOLUTION.width, DESIGN_RESOLUTION.height).then(() => {
    Laya.stage.scaleMode = Laya.Stage.SCALE_FIXED_AUTO;
    Laya.stage.bgColor = "#222222";

    const main = new Main();
    main.onStart();

    console.log("KickShrew game running (tsc debug mode)!");
}).catch((err: unknown) => {
    console.error("Init failed:", err);
});
