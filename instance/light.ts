import * as pc from 'playcanvas';

/**
 * 创建灯光
 * @param app PlayCanvas应用实例
 * @param eulerAngles 灯光的欧拉角，默认为(45, 45, 0)
 * @returns 灯光实体
 */
export function createLight(app: pc.Application, eulerAngles: pc.Vec3 = new pc.Vec3(45, 45, 0)) {
    const light = new pc.Entity();
    light.addComponent('light');
    light.setEulerAngles(eulerAngles.x, eulerAngles.y, eulerAngles.z);
    app.root.addChild(light);
    return light;
}