import * as pc from 'playcanvas';

/**
 * 相机动画函数
 * @param time 时间参数
 * @param camera 相机实体
 * @param targetEntity 目标实体
 * @param orbitRadius 轨道半径
 * @param horizontalRange 水平范围
 * @param verticalRange 垂直范围
 */
export function animateCamera(time: number, camera: pc.Entity, targetEntity: pc.Entity, orbitRadius: number, horizontalRange: number, verticalRange: number) {
    // 水平方向：幅度由horizontalRange决定，速度由time系数决定
    const horizontalAngle = horizontalRange * Math.sin(time * 0.6);

    // 垂直方向
    const verticalAngle = verticalRange * Math.cos(time * 0.6);

    // 计算位置
    const x = orbitRadius * Math.sin(horizontalAngle);
    const y = 2 + orbitRadius * Math.sin(verticalAngle);
    const z = orbitRadius * Math.cos(horizontalAngle);

    camera.setLocalPosition(x, y, z);
    camera.lookAt(targetEntity.getPosition());
}

/**
 * 处理相机动画效果
 * @param dt 时间增量
 * @param currentTime 当前时间
 * @param autoRotate 是否自动旋转
 * @param lastMouseActivityTime 上次鼠标活动时间
 * @param autoRotateDelay 自动旋转延迟
 * @param camera 相机实体
 * @param targetEntity 目标实体
 * @param scriptInstance 脚本实例
 * @returns 更新后的时间
 */
export function handleCameraTransition(
    dt: number,
    currentTime: number,
    autoRotate: boolean,
    lastMouseActivityTime: number,
    autoRotateDelay: number,
    camera: pc.Entity,
    targetEntity: pc.Entity,
    scriptInstance: any
): number {
    let time = currentTime;
    time += dt;

    // 检查是否应该恢复自动转动
    if (!autoRotate && time - lastMouseActivityTime > autoRotateDelay) {
        autoRotate = true;
    }

    // 根据状态决定是自动转动还是由脚本控制
    if (autoRotate) {
        // 自动转动摄像头
        animateCamera(time, camera, targetEntity, 6, Math.PI / 6, Math.PI / 12);
    } else {
        if (scriptInstance) {
            scriptInstance.skipUpdate = false;
        }
    }

    return time; // 返回更新后的时间
}