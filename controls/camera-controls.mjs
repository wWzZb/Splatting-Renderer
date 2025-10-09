import {
    Script,
    Vec3
} from 'playcanvas';



/**
 * 相机控制器 - 集成手动控制和自动动画功能
 */
class CameraControls extends Script {
    static scriptName = 'cameraControls';

    /**
     * @type {CameraComponent}
     * @private
     */
    // @ts-ignore
    _camera;

    /**
     * @type {Vec3}
     * @private
     */
    _target = new Vec3(0, -1, 0);

    /**
     * @type {number} - 相机到目标的距离
     * @private
     */
    _distance = 8; // 减小距离，将相机拉近

    /**
     * @type {number} - 默认相机距离（用于自动控制模式）
     * @private
     */
    _defaultDistance = 8; // 存储初始默认距离

    /**
     * @type {number} - 水平旋转角度（度）
     * @private
     */
    _yaw = 45;

    /**
     * @type {number} - 垂直旋转角度（度）
     * @private
     */
    _pitch = 30;

    /**
     * @type {number} - 最小缩放距离
     * @private
     */
    _minDistance = 3; // 设置最小缩放距离

    /**
     * @type {number} - 最大缩放距离
     * @private
     */
    _maxDistance = 15; // 设置最大缩放距离

    /**
     * @type {number} - 最小俯仰角度（度）
     * @private
     */
    _minPitch = -10; // 设置最小俯仰角度

    /**
     * @type {number} - 最大俯仰角度（度）
     * @private
     */
    _maxPitch = 60; // 设置最大俯仰角度

    /**
     * @type {number} - 最小偏航角度（度）
     * @private
     */
    _minYaw = -120; // 设置最小偏航角度

    /**
     * @type {number} - 最大偏航角度（度）
     * @private
     */
    _maxYaw = 120; // 设置最大偏航角度

    /**
     * @type {boolean}
     * @private
     */
    _isDragging = false;

    /**
     * @type {number}
     * @private
     */
    _lastX = 0;

    /**
     * @type {number}
     * @private
     */
    _lastY = 0;

    /**
     * @type {boolean} - 是否启用自动旋转
     * @private
     */
    _autoRotate = false;

    /**
     * @type {boolean} - 是否正在进行过渡动画
     * @private
     */
    _isTransitioning = false;

    /**
     * @type {number} - 过渡动画时间
     * @private
     */
    _transitionTime = 0;

    /**
     * @type {number} - 过渡动画持续时间（秒）
     * @private
     */
    _transitionDuration = 3.0;

    /**
     * @type {number} - 自动旋转动画时间
     * @private
     */
    _autoAnimationTime = 0;

    /**
     * @type {number} - 上次用户活动时间
     * @private
     */
    _lastMouseActivityTime = 0;

    /**
     * @type {number} - 自动旋转延迟时间（秒）
     * @private
     */
    _autoRotateDelay = 3;

    /**
     * @type {number} - 自动旋转速度系数
     * @private
     */
    _autoRotateSpeed = 0.8; // 提高速度系数

    /**
     * @type {boolean} - 是否需要同步状态
     * @private
     */
    _needsStateSync = false;

    /**
     * @type {number} - 水平摆动角度范围（度）
     * @private
     */
    _horizontalSwingRange = 30; // 默认30度

    /**
     * @type {number} - 垂直摆动角度范围（度）
     * @private
     */
    _verticalSwingRange = 15; // 默认15度

    /**
     * @type {number} - 基准俯仰角度（度）
     * @private
     */
    _basePitch = 15;

    constructor({ app, entity, ...args }) {
        super({ app, entity, ...args });
        if (!this.entity.camera) {
            console.error('CameraControls: camera component not found');
            return;
        }
        this._camera = this.entity.camera;

        // 从当前相机位置初始化控制器状态
        this._updateControllerFromCamera();

        // 使用PlayCanvas的事件系统
        const canvas = this.app.graphicsDevice.canvas;

        // 鼠标事件
        canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
        canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
        window.addEventListener('mouseup', this._onMouseUp.bind(this));
        canvas.addEventListener('wheel', this._onMouseWheel.bind(this));

        // 触摸事件
        canvas.addEventListener('touchstart', this._onTouchStart.bind(this));
        canvas.addEventListener('touchmove', this._onTouchMove.bind(this));
        canvas.addEventListener('touchend', this._onTouchEnd.bind(this));

        // 初始化时间
        this._autoAnimationTime = Date.now() / 1000;
        this._lastMouseActivityTime = Date.now() / 1000;

        // 调试信息
        console.log('CameraControls initialized with yaw=' + this._yaw + ', pitch=' + this._pitch + ', distance=' + this._distance);

        // 监听销毁事件
        this.on('destroy', this._destroy, this);
    }

    /**
     * 从相机当前位置更新控制器内部状态
     * @private
     */
    _updateControllerFromCamera() {
        const cameraPos = this.entity.getPosition();

        // 计算相机到目标点的向量
        const direction = new Vec3();
        direction.sub2(cameraPos, this._target);

        // 只保留角度计算，不再覆盖默认距离值
        // this._distance = direction.length(); // 这行代码会覆盖我们设置的默认距离

        if (direction.length() > 0.001) {
            // 归一化方向向量
            direction.normalize();

            // 计算偏航角 (水平旋转)
            this._yaw = Math.atan2(direction.x, direction.z) * 180 / Math.PI;

            // 计算俯仰角 (垂直旋转)
            this._pitch = Math.asin(direction.y) * 180 / Math.PI;

            console.log('Controller updated from camera position: yaw=' + this._yaw.toFixed(2) + ', pitch=' + this._pitch.toFixed(2) + ', distance=' + this._distance.toFixed(2));
        }

        // 使用默认距离更新相机位置，确保距离设置生效
        this._updateCameraFromController();
    }

    /**
     * 根据控制器状态更新相机位置
     * @private
     */
    _updateCameraFromController() {
        // 限制偏航和俯仰角度在指定范围内
        this._yaw = Math.max(this._minYaw, Math.min(this._maxYaw, this._yaw));
        this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch));

        // 限制距离在指定范围内
        this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._distance));

        // 将角度转换为弧度
        const radYaw = this._yaw * Math.PI / 180;
        const radPitch = this._pitch * Math.PI / 180;

        // 计算相机位置
        const x = this._target.x + this._distance * Math.cos(radPitch) * Math.sin(radYaw);
        const y = this._target.y + this._distance * Math.sin(radPitch);
        const z = this._target.z + this._distance * Math.cos(radPitch) * Math.cos(radYaw);

        // 设置相机位置并看向目标
        this.entity.setPosition(x, y, z);
        this.entity.lookAt(this._target);

        console.log('Camera updated from controller: pos(' + x.toFixed(2) + ', ' + y.toFixed(2) + ', ' + z.toFixed(2) + ')');
    }

    /**
     * 执行自动相机动画
     * @param {number} dt - 时间增量
     * @private
     */
    _performAutoRotate(dt) {
        if (this._isTransitioning) {
            // 执行过渡动画
            this._transitionTime += dt;
            const progress = Math.min(this._transitionTime / this._transitionDuration, 1.0);

            // 使用缓动函数使过渡更平滑
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            // 更新动画时间 - 使用更高的速度系数
            this._autoAnimationTime += dt * this._autoRotateSpeed;

            // 计算目标自动控制角度，并确保在限制范围内
            const baseYaw = 0;
            const maxYawRange = Math.min(this._horizontalSwingRange, (this._maxYaw - this._minYaw) / 2);
            const targetYaw = Math.max(this._minYaw, Math.min(this._maxYaw, baseYaw + maxYawRange * Math.sin(this._autoAnimationTime * 0.8)));

            const maxPitchRange = Math.min(this._verticalSwingRange, Math.min(this._maxPitch - this._basePitch, this._basePitch - this._minPitch));
            const targetPitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._basePitch + maxPitchRange * Math.cos(this._autoAnimationTime * 0.8)));

            // 计算目标距离 - 恢复到默认距离
            const targetDistance = Math.max(this._minDistance, Math.min(this._maxDistance, this._defaultDistance));

            // 插值计算当前角度和距离
            this._yaw = this._yaw + (targetYaw - this._yaw) * easeProgress;
            this._pitch = this._pitch + (targetPitch - this._pitch) * easeProgress;
            this._distance = this._distance + (targetDistance - this._distance) * easeProgress;

            // 确保角度在限制范围内
            this._yaw = Math.max(this._minYaw, Math.min(this._maxYaw, this._yaw));
            this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch));
            this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._distance));

            // 检查过渡是否完成
            if (progress >= 1.0) {
                this._isTransitioning = false;
                // 确保距离精确设置为默认值
                this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._defaultDistance));
                console.log('Transition to auto-rotate completed');
            }
        } else {
            // 正常自动旋转模式
            // 确保距离保持为默认值
            this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._defaultDistance));

            // 更新动画时间 - 使用更高的速度系数
            this._autoAnimationTime += dt * this._autoRotateSpeed;

            // 水平摆动 - 增加摆动频率，并确保在限制范围内
            const baseYaw = 0;
            const maxYawRange = Math.min(this._horizontalSwingRange, (this._maxYaw - this._minYaw) / 2);
            this._yaw = Math.max(this._minYaw, Math.min(this._maxYaw, baseYaw + maxYawRange * Math.sin(this._autoAnimationTime * 0.8)));

            // 垂直摆动 - 增加摆动频率，使用固定的基准俯仰角，并确保在限制范围内
            const maxPitchRange = Math.min(this._verticalSwingRange, Math.min(this._maxPitch - this._basePitch, this._basePitch - this._minPitch));
            this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._basePitch + maxPitchRange * Math.cos(this._autoAnimationTime * 0.8)));
        }

        // 更新相机位置
        this._updateCameraFromController();
    }

    /**
     * 鼠标按下事件
     * @private
     */
    _onMouseDown(e) {
        if (e.button === 0) { // 左键
            this._isDragging = true;
            this._lastX = e.clientX;
            this._lastY = e.clientY;
            this._autoRotate = false; // 停止自动旋转
            this._lastMouseActivityTime = Date.now() / 1000;
            console.log('Mouse down at position:', e.clientX, e.clientY);
        }
    }

    /**
     * 鼠标移动事件 - 直观的轨道控制逻辑
     * @private
     */
    // 在鼠标移动事件中修改左右滑动方向
    _onMouseMove(e) {
        if (this._isDragging) {
            const deltaX = e.clientX - this._lastX;
            const deltaY = e.clientY - this._lastY;

            // 修改：将偏航角增量取反，使左右滑动方向相反
            this._yaw -= deltaX * 0.15;  // 水平旋转灵敏度，不再限制范围
            this._pitch += deltaY * 0.15; // 垂直旋转灵敏度

            // 只限制俯仰角度，防止相机翻转
            this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch));

            // 更新最后的鼠标位置
            this._lastX = e.clientX;
            this._lastY = e.clientY;
            this._lastMouseActivityTime = Date.now() / 1000;

            // 根据更新后的控制器状态更新相机位置
            this._updateCameraFromController();
        }
    }

    /**
     * 鼠标释放事件
     * @private
     */
    _onMouseUp() {
        if (this._isDragging) {
            this._isDragging = false;
            this._lastMouseActivityTime = Date.now() / 1000;
            console.log('Mouse up detected');
        }
    }

    /**
     * 鼠标滚轮事件 - 直观的缩放控制
     * @private
     */
    _onMouseWheel(e) {
        e.preventDefault();

        // 直观的缩放逻辑：向前滚动滚轮 -> 放大 (距离减小)
        // 向后滚动滚轮 -> 缩小 (距离增大)
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._distance * zoomFactor));
        this._autoRotate = false; // 停止自动旋转
        this._lastMouseActivityTime = Date.now() / 1000;

        // 根据更新后的距离更新相机位置
        this._updateCameraFromController();
        console.log('Zoom event: deltaY=' + e.deltaY + ', new distance=' + this._distance);
    }

    /**
     * 触摸开始事件
     * @private
     */
    // 在类的私有属性部分添加双指缩放相关变量
    /**
     * @type {number} - 上次触摸时的两指距离
     * @private
     */
    _lastTouchDistance = 0;

    /**
     * @type {boolean} - 是否正在进行双指操作
     * @private
     */
    _isPinching = false;

    // 修改_onTouchStart方法，添加双指检测
    _onTouchStart(e) {
        e.preventDefault();
        // 双指操作检测
        if (e.touches.length === 2) {
            this._isPinching = true;
            // 计算两指之间的初始距离
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this._lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
            this._autoRotate = false; // 停止自动旋转
            this._lastMouseActivityTime = Date.now() / 1000;
            console.log('Pinch started with distance:', this._lastTouchDistance);
        } else if (e.touches.length === 1 && !this._isPinching) {
            // 单指拖拽
            this._isDragging = true;
            this._lastX = e.touches[0].clientX;
            this._lastY = e.touches[0].clientY;
            this._autoRotate = false; // 停止自动旋转
            this._lastMouseActivityTime = Date.now() / 1000;
            console.log('Touch start detected at position:', this._lastX, this._lastY);
        }
    }

    /**
     * 触摸移动事件 - 与鼠标相同的直观控制逻辑
     * @private
     */
    _onTouchMove(e) {
        e.preventDefault();

        // 处理双指缩放
        if (e.touches.length === 2) {
            this._isPinching = true;

            // 计算当前两指之间的距离
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);

            // 如果有上次的距离记录，计算缩放比例
            if (this._lastTouchDistance > 0) {
                const scaleFactor = currentDistance / this._lastTouchDistance;

                // 应用缩放，保持在最小和最大距离范围内
                this._distance = Math.max(this._minDistance,
                    Math.min(this._maxDistance,
                        this._distance / scaleFactor));

                this._autoRotate = false; // 停止自动旋转
                this._lastMouseActivityTime = Date.now() / 1000;

                // 更新相机位置
                this._updateCameraFromController();

                console.log('Pinch zoom factor:', scaleFactor, 'New distance:', this._distance);
            }

            // 更新上次的距离
            this._lastTouchDistance = currentDistance;
        }
        // 处理单指拖拽（仅在非双指操作时）
        else if (this._isDragging && e.touches.length === 1 && !this._isPinching) {
            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - this._lastX;
            const deltaY = currentY - this._lastY;

            // 修改：将偏航角增量取反，使左右滑动方向相反
            this._yaw -= deltaX * 0.15; // 偏航角不再限制范围
            this._pitch += deltaY * 0.15;

            // 只限制俯仰角度
            this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch));

            // 更新最后的触摸位置
            this._lastX = currentX;
            this._lastY = currentY;
            this._lastMouseActivityTime = Date.now() / 1000;

            // 更新相机位置
            this._updateCameraFromController();
        }
    }

    /**
     * 触摸结束事件
     * @private
     */
    _onTouchEnd() {
        if (this._isDragging || this._isPinching) {
            this._isDragging = false;
            this._isPinching = false;
            this._lastTouchDistance = 0;
            this._lastMouseActivityTime = Date.now() / 1000;
            console.log('Touch end detected, resetting touch state');
        }
    }

    /**
     * 从当前相机位置同步控制器状态
     */
    syncFromCamera() {
        this._needsStateSync = true;
    }

    /**
     * 销毁时清理事件监听器
     * @private
     */
    _destroy() {
        const canvas = this.app.graphicsDevice.canvas;
        canvas.removeEventListener('mousedown', this._onMouseDown);
        canvas.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);
        canvas.removeEventListener('wheel', this._onMouseWheel);
        canvas.removeEventListener('touchstart', this._onTouchStart);
        canvas.removeEventListener('touchmove', this._onTouchMove);
        canvas.removeEventListener('touchend', this._onTouchEnd);
    }

    /**
     * 更新 - 处理自动旋转和状态同步
     * @param {number} dt - 时间增量
     */
    update(dt) {
        const currentTime = Date.now() / 1000;

        // 检查是否需要同步状态
        if (this._needsStateSync) {
            this._updateControllerFromCamera();
            this._needsStateSync = false;
            console.log('Camera control state synchronized');
        }

        // 检查是否应该进入自动旋转模式
        if (!this._autoRotate && !this._isDragging && currentTime - this._lastMouseActivityTime > this._autoRotateDelay) {
            this._autoRotate = true;
            this._isTransitioning = true; // 启动过渡动画
            this._transitionTime = 0;
            console.log('Entering auto-rotate mode with transition');
        }

        // 执行自动旋转动画
        if (this._autoRotate) {
            this._performAutoRotate(dt);
        }
    }

    /**
     * 设置自动旋转延迟
     * @param {number} delay - 延迟时间（秒）
     */
    setAutoRotateDelay(delay) {
        this._autoRotateDelay = delay;
    }

    /**
     * 设置自动旋转速度
     * @param {number} speed - 旋转速度系数
     */
    setAutoRotateSpeed(speed) {
        this._autoRotateSpeed = speed;
    }

    /**
     * 手动切换自动旋转状态
     * @param {boolean} autoRotate - 是否自动旋转
     */
    setAutoRotate(autoRotate) {
        if (autoRotate && !this._autoRotate) {
            this._isTransitioning = true;
            this._transitionTime = 0;
            console.log('Switching to auto-rotate with transition');
        }
        this._autoRotate = autoRotate;
    }

    /**
     * 设置相机目标点
     * @param {Vec3} target - 目标点坐标
     */
    setTarget(target) {
        this._target.copy(target);
        this._updateCameraFromController();
    }
}

export default CameraControls;