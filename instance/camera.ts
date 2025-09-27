import * as pc from 'playcanvas';

/**
 * 设置相机
 * @param app PlayCanvas应用实例
 * @param initialPosition 相机初始位置
 * @param initialRotation 相机初始旋转角度
 * @returns 相机实体和控制器
 */
export function createCamera(app: pc.Application, initialPosition: pc.Vec3, initialRotation: pc.Vec3): { camera: pc.Entity, cameraControls: any } {
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
    let cameraControls: any = null;
    if (camera.script) {
        camera.script.create('cameraControls');
        // 设置相机缩放范围
        cameraControls = camera.script.get('cameraControls') as any;
    }

    // 将相机添加到场景
    app.root.addChild(camera);

    return { camera, cameraControls };
}