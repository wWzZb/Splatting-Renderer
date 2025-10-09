import * as pc from 'playcanvas';

/**
 * 设置天空盒
 * @param app PlayCanvas应用实例
 * @param assets 资源对象
 * @param skyType 天空类型，默认为pc.SKYTYPE_INFINITE
 * @param scale 天空盒缩放系数，默认为[5, 5, 5]
 */
export function setupSkybox(app: pc.Application, assets: any, skyType: string = pc.SKYTYPE_INFINITE, scale: [number, number, number] = [5, 5, 5]) {
    // 确保helipad资源已加载
    if (!assets.helipad || !assets.helipad.resource) {
        console.error('Helipad resource not loaded');
        return;
    }
    //如果要使用hdr，开启以下代码
    // 生成天空盒立方体贴图
    // const skybox = pc.EnvLighting.generateSkyboxCubemap(assets.helipad.resource as pc.Texture);
    // app.scene.skybox = skybox;

    //如果要加载png，开启以下代码
    app.scene.envAtlas = assets.helipad.resource;
    app.scene.skyboxMip = 2
    //设置天空旋转
    app.scene.skyboxRotation = new pc.Quat().setFromEulerAngles(20, 80, 0);
    // 设置天空类型为无限
    app.scene.sky.type = pc.SKYTYPE_INFINITE;

    // 设置天空盒缩放
    app.scene.sky.node.setLocalScale(scale[0], scale[1], scale[2]);
}