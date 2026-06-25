import { getLaya } from "./LayaRuntime";

const spineTemplatePromises = new Map<string, Promise<any>>();

export function loadResource<T = any>(url: string, type?: any): Promise<T> {
  const Laya = getLaya();
  if (!Laya?.loader?.load) {
    return Promise.reject(new Error(`Laya loader is unavailable: ${url}`));
  }
  return Laya.loader.load(url, type);
}

export function loadSpineTemplate(url: string): Promise<any> {
  let promise = spineTemplatePromises.get(url);
  if (!promise) {
    promise = loadResource(url).catch((error: unknown) => {
      spineTemplatePromises.delete(url);
      throw error;
    });
    spineTemplatePromises.set(url, promise);
  }
  return promise;
}
