import * as pc from 'playcanvas';

/**
 * 创建资产配置对象
 * @param {string} modelPath - 模型文件路径
 * @param {string} envMapPath - 环境贴图文件路径
 * @returns {Object} 资产配置对象
 */
export function createAssets(modelPath: string, envMapPath: string) {
    return {
        controls: new pc.Asset('camera-controls', 'script', {
            url: 'controls/camera-controls.mjs'
        }),
        gsplat: new pc.Asset('gsplat', 'gsplat', {
            url: modelPath
        }),
        helipad: new pc.Asset(
            'helipad-env-atlas',
            'texture',
            { url: envMapPath },
            { mipmaps: false },
        ),
    };
}