/**
 * AssetLoader — 批量预加载 atlas 资源
 *
 * 使用 Laya Loader 批量加载所有 atlas + 对应纹理图，
 * 加载完成后通过回调通知游戏可以启动。
 * 所有加载路径来自 AtlasConfig。
 *
 * 注意: 此文件依赖 Laya 运行时，不在 vitest 中测试。
 * AtlasConfig 的路径映射逻辑由 AtlasConfig 自身的纯函数保证正确性。
 */
import { getAllAtlasPaths } from "./AtlasConfig";

export class AssetLoader {
  /** 加载进度 0~1 */
  progress: number = 0;

  /** 是否已完成加载 */
  loaded: boolean = false;

  /**
   * 预加载所有游戏资源
   * @param onProgress 进度回调 (0~1)
   * @param onComplete 完成回调
   */
  preload(onProgress?: (progress: number) => void, onComplete?: () => void): void {
    const atlasPaths = getAllAtlasPaths();

    const Laya = (window as any).Laya;
    if (!Laya) {
      console.error("Laya engine not found. AssetLoader requires Laya runtime.");
      return;
    }

    // 构建 Laya 加载列表: 每个 atlas 使用 ATLAS 类型，Laya 会自动加载同名的 .png 纹理
    const loadList: Array<{ url: string; type: string }> = [];
    for (const atlasPath of atlasPaths) {
      loadList.push({
        url: `resources/${atlasPath}.atlas`,
        type: Laya.Loader.ATLAS,
      });
    }

    Laya.loader.load(
      loadList,
      Laya.Handler.create(this, () => {
        this.loaded = true;
        this.progress = 1;
        onProgress?.(1);
        onComplete?.();
      }),
      Laya.Handler.create(this, (progress: number) => {
        this.progress = progress;
        onProgress?.(progress);
      })
    );
  }
}
