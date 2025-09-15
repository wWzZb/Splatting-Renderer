import * as pc from 'playcanvas';

/**
 * 设置相机
 * @param app PlayCanvas应用实例
 * @param initialPosition 相机初始位置
 * @param initialRotation 相机初始旋转角度
 * @returns 相机实体
 */
export function createCamera(app: pc.Application, initialPosition: pc.Vec3, initialRotation: pc.Vec3) {
    const camera = new pc.Entity();

    // 添加相机组件（内部配置不暴露）
    camera.addComponent('camera', {
        clearColor: new pc.Color(0.2, 0.2, 0.2),
        toneMapping: pc.TONEMAP_ACES,
        gammaCorrection: pc.GAMMA_SRGB
    });

    // 设置初始位置和旋转
    camera.setPosition(initialPosition);
    camera.setEulerAngles(initialRotation.x, initialRotation.y, initialRotation.z);

    // 添加脚本组件
    camera.addComponent('script');
    if (camera.script) {
        camera.script.create('cameraControls');
    }

    // 将相机添加到场景
    app.root.addChild(camera);

    return camera;
}