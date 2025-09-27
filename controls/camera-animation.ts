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
 * 相机过渡状态接口
 */
export interface CameraTransitionState {
    isTransitioning: boolean;
    transitionStartTime: number;
    transitionDuration: number;
    startPosition: pc.Vec3;
    startRotation: pc.Vec3;
    targetPosition: pc.Vec3;
    targetRotation: pc.Vec3;
    autoAnimationTime: number;
}

/**
 * 计算自动动画的目标位置和旋转
 */
function calculateAutoAnimationTarget(time: number, targetEntity: pc.Entity, orbitRadius: number, horizontalRange: number, verticalRange: number): { position: pc.Vec3, rotation: pc.Vec3 } {
    const horizontalAngle = horizontalRange * Math.sin(time * 0.6);
    const verticalAngle = verticalRange * Math.cos(time * 0.6);

    const x = orbitRadius * Math.sin(horizontalAngle);
    const y = 2 + orbitRadius * Math.sin(verticalAngle);
    const z = orbitRadius * Math.cos(horizontalAngle);

    const position = new pc.Vec3(x, y, z);
    const targetPos = targetEntity.getPosition();
    
    // 使用与原始animateCamera相同的lookAt逻辑
    // 创建一个临时相机来计算正确的旋转
    const tempCamera = new pc.Entity();
    tempCamera.setPosition(position);
    tempCamera.lookAt(targetPos);
    const rotation = tempCamera.getEulerAngles();

    return { position, rotation };
}


/**
 * 更新相机过渡
 */
function updateCameraTransition(
    transitionState: CameraTransitionState,
    camera: pc.Entity,
    dt: number
): boolean {
    if (!transitionState.isTransitioning) {
        return false;
    }

    const currentTime = performance.now() / 1000;
    const elapsed = currentTime - transitionState.transitionStartTime;
    const progress = Math.min(elapsed / transitionState.transitionDuration, 1.0);

    // 使用缓动函数（easeInOutCubic）
    const easedProgress = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    // 插值位置
    const currentPos = transitionState.startPosition.clone();
    currentPos.lerp(transitionState.startPosition, transitionState.targetPosition, easedProgress);
    
    // 插值旋转
    const currentRot = transitionState.startRotation.clone();
    currentRot.lerp(transitionState.startRotation, transitionState.targetRotation, easedProgress);

    // 应用插值结果
    camera.setPosition(currentPos);
    camera.setEulerAngles(currentRot);

    // 检查过渡是否完成
    if (progress >= 1.0) {
        transitionState.isTransitioning = false;
        return true; // 过渡完成
    }

    return false; // 过渡进行中
}

/**
 * 处理相机动画效果（带平滑过渡）
 * @param dt 时间增量
 * @param currentTime 当前时间
 * @param autoRotate 是否自动旋转
 * @param lastMouseActivityTime 上次鼠标活动时间
 * @param autoRotateDelay 自动旋转延迟
 * @param camera 相机实体
 * @param targetEntity 目标实体
 * @param scriptInstance 脚本实例
 * @param transitionState 过渡状态
 * @returns 更新后的时间、过渡状态和自动旋转状态
 */
export function handleCameraTransition(
    dt: number,
    currentTime: number,
    autoRotate: boolean,
    lastMouseActivityTime: number,
    autoRotateDelay: number,
    camera: pc.Entity,
    targetEntity: pc.Entity,
    scriptInstance: any,
    transitionState?: CameraTransitionState
): { time: number, transitionState: CameraTransitionState, autoRotate: boolean } {
    // 初始化过渡状态
    if (!transitionState) {
        transitionState = {
            isTransitioning: false,
            transitionStartTime: 0,
            transitionDuration: 2.0,
            startPosition: new pc.Vec3(),
            startRotation: new pc.Vec3(),
            targetPosition: new pc.Vec3(),
            targetRotation: new pc.Vec3(),
            autoAnimationTime: 0
        };
    }

    let time = currentTime;
    time += dt;

    // 检查是否应该恢复自动转动
    const shouldAutoRotate = !autoRotate && time - lastMouseActivityTime > autoRotateDelay;
    
    // 开始过渡到自动动画
    if (shouldAutoRotate) {
        const currentTarget = calculateAutoAnimationTarget(time, targetEntity, 6, Math.PI / 6, Math.PI / 12);
        
        // 设置过渡状态
        transitionState.isTransitioning = true;
        transitionState.transitionStartTime = performance.now() / 1000;
        transitionState.transitionDuration = 2.0;
        transitionState.startPosition.copy(camera.getPosition());
        transitionState.startRotation.copy(camera.getEulerAngles());
        transitionState.targetPosition.copy(currentTarget.position);
        transitionState.targetRotation.copy(currentTarget.rotation);
        
        transitionState.autoAnimationTime = time;
        autoRotate = true;
    }
    

    // 更新过渡
    if (transitionState.isTransitioning) {
        const transitionComplete = updateCameraTransition(transitionState, camera, dt);
        if (transitionComplete) {
            transitionState.isTransitioning = false;
        }
        return { time, transitionState, autoRotate };
    }

    // 执行相机动画
    if (autoRotate) {
        if (transitionState.autoAnimationTime > 0) {
            animateCamera(transitionState.autoAnimationTime, camera, targetEntity, 6, Math.PI / 6, Math.PI / 12);
            transitionState.autoAnimationTime += dt;
        } else {
            animateCamera(time, camera, targetEntity, 6, Math.PI / 6, Math.PI / 12);
        }
    } else {
        if (scriptInstance) {
            
        }
        transitionState.autoAnimationTime = 0;
    }

    return { time, transitionState, autoRotate };
}