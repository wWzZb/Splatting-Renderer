import * as pc from 'playcanvas';

/**
* 创建GSplat实例
* @param app PlayCanvas应用实例
* @param {string} name - 实体名称
* @param {pc.Asset} asset - GSplat 模型资源
* @param {number} px - X 轴位置
* @param {number} py - Y 轴位置
* @param {number} pz - Z 轴位置
* @param {number} [scale=1] - 缩放系数，默认为 1
* @param {string|pc.Shader} [vertex] - 顶点着色器（可选）
* @param {string|pc.Shader} [fragment] - 片段着色器（可选）
* @returns {pc.Entity} 创建的实体对象
*/
export function createSplatInstance(app, name, asset, px, py, pz, scale = 1, vertex?, fragment?) {
    const entity = new pc.Entity(name);
    entity.addComponent('gsplat', {
        asset: asset,
        unified: false,
        highQualitySH: true
    });
    entity.setLocalPosition(px, py, pz);
    entity.setLocalEulerAngles(180, -85, 0);
    entity.setLocalScale(scale, scale, scale);
    app.root.addChild(entity);
    return entity;
}