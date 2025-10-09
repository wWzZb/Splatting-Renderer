
import { assets } from './instance/config'//导入状态配置
import { getAssetIdForPath } from './router'//导入路由控制
/**
 * 应用配置 - 默认使用第一个配置
 */
export let appConfig = { ...assets[1] };
/**
 * 根据资产ID更新应用配置
 * @param assetId 资产ID
 */
export function updateAppConfig(assetId: number): void {
  if (assets[assetId]) {
    //更新appConfig
    appConfig = { ...assets[assetId] };
  }
}

// 在初始化路由之前，先根据URL参数设置配置
export function initializeConfigFromUrl() {
  // 从URL参数中获取资产ID
  const urlParams = new URLSearchParams(window.location.search);
  const assetIdParam = urlParams.get('assetId');

  if (assetIdParam) {
    // 如果URL中有资产ID参数，使用该参数
    const assetId = parseInt(assetIdParam, 10);
    updateAppConfig(assetId);
  } else {
    // 根据路径确定资产
    const path = window.location.pathname;
    const assetId = getAssetIdForPath(path);
    updateAppConfig(assetId);
  }
}