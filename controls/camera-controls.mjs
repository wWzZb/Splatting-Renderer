/*
  经典 PlayCanvas 脚本（资产方式加载）。
  - 不使用 ESM import；依赖全局 pc
  - 通过 pc.createScript('cameraControls') 注册
  - 保留原有功能与方法签名（setTarget、setAutoRotateDelay、setAutoRotateSpeed、setAutoRotate、syncFromCamera）
  - 追加 setTargetEntity(entity) 以兼容现有调用
*/

/* global pc */

// 定义脚本类型
var CameraControls = pc.createScript('cameraControls');

// 属性（实例字段）
CameraControls.prototype._camera = null;
CameraControls.prototype._target = new pc.Vec3(0, -1, 0);
CameraControls.prototype._distance = 8;
CameraControls.prototype._defaultDistance = 8;
CameraControls.prototype._yaw = 45;
CameraControls.prototype._pitch = 30;
CameraControls.prototype._minDistance = 3;
CameraControls.prototype._maxDistance = 15;
CameraControls.prototype._minPitch = -10;
CameraControls.prototype._maxPitch = 60;
CameraControls.prototype._minYaw = -120;
CameraControls.prototype._maxYaw = 120;
CameraControls.prototype._isDragging = false;
CameraControls.prototype._lastX = 0;
CameraControls.prototype._lastY = 0;
CameraControls.prototype._autoRotate = false;
CameraControls.prototype._isTransitioning = false;
CameraControls.prototype._transitionTime = 0;
CameraControls.prototype._transitionDuration = 3.0;
CameraControls.prototype._autoAnimationTime = 0;
CameraControls.prototype._lastMouseActivityTime = 0;
CameraControls.prototype._autoRotateDelay = 3;
CameraControls.prototype._autoRotateSpeed = 0.8;
CameraControls.prototype._needsStateSync = false;
CameraControls.prototype._horizontalSwingRange = 30;
CameraControls.prototype._verticalSwingRange = 15;
CameraControls.prototype._basePitch = 15;
CameraControls.prototype._lastTouchDistance = 0;
CameraControls.prototype._isPinching = false;
CameraControls.prototype._targetEntity = null;

// 初始化（原 constructor）
CameraControls.prototype.initialize = function () {
    if (!this.entity.camera) {
        console.error('CameraControls: camera component not found');
        return;
    }
    this._camera = this.entity.camera;

    this._updateControllerFromCamera();

    var canvas = this.app.graphicsDevice.canvas;
    // 事件监听
    this._onMouseDownBound = this._onMouseDown.bind(this);
    this._onMouseMoveBound = this._onMouseMove.bind(this);
    this._onMouseUpBound = this._onMouseUp.bind(this);
    this._onMouseWheelBound = this._onMouseWheel.bind(this);
    this._onTouchStartBound = this._onTouchStart.bind(this);
    this._onTouchMoveBound = this._onTouchMove.bind(this);
    this._onTouchEndBound = this._onTouchEnd.bind(this);

    canvas.addEventListener('mousedown', this._onMouseDownBound);
    canvas.addEventListener('mousemove', this._onMouseMoveBound);
    window.addEventListener('mouseup', this._onMouseUpBound);
    canvas.addEventListener('wheel', this._onMouseWheelBound, { passive: false });
    canvas.addEventListener('touchstart', this._onTouchStartBound, { passive: false });
    canvas.addEventListener('touchmove', this._onTouchMoveBound, { passive: false });
    canvas.addEventListener('touchend', this._onTouchEndBound, { passive: false });

    this._autoAnimationTime = Date.now() / 1000;
    this._lastMouseActivityTime = Date.now() / 1000;
};

// 销毁
CameraControls.prototype.onDestroy = function () {
    var canvas = this.app.graphicsDevice.canvas;
    if (canvas) {
        canvas.removeEventListener('mousedown', this._onMouseDownBound);
        canvas.removeEventListener('mousemove', this._onMouseMoveBound);
        window.removeEventListener('mouseup', this._onMouseUpBound);
        canvas.removeEventListener('wheel', this._onMouseWheelBound);
        canvas.removeEventListener('touchstart', this._onTouchStartBound);
        canvas.removeEventListener('touchmove', this._onTouchMoveBound);
        canvas.removeEventListener('touchend', this._onTouchEndBound);
    }
};

// 每帧更新
CameraControls.prototype.update = function (dt) {
    var currentTime = Date.now() / 1000;

    // 若绑定了目标实体，则每帧同步目标点
    if (this._targetEntity && this._targetEntity.getPosition) {
        this._target.copy(this._targetEntity.getPosition());
    }

    if (this._needsStateSync) {
        this._updateControllerFromCamera();
        this._needsStateSync = false;
    }

    if (!this._autoRotate && !this._isDragging && currentTime - this._lastMouseActivityTime > this._autoRotateDelay) {
        this._autoRotate = true;
        this._isTransitioning = true;
        this._transitionTime = 0;
    }

    if (this._autoRotate) {
        this._performAutoRotate(dt);
    }
};

// 公共方法
CameraControls.prototype.setAutoRotateDelay = function (delay) {
    this._autoRotateDelay = delay;
};

CameraControls.prototype.setAutoRotateSpeed = function (speed) {
    this._autoRotateSpeed = speed;
};

CameraControls.prototype.setAutoRotate = function (autoRotate) {
    if (autoRotate && !this._autoRotate) {
        this._isTransitioning = true;
        this._transitionTime = 0;
    }
    this._autoRotate = autoRotate;
};

CameraControls.prototype.setTarget = function (target) {
    this._target.copy(target);
    this._updateCameraFromController();
};

CameraControls.prototype.setTargetEntity = function (entity) {
    this._targetEntity = entity || null;
    if (this._targetEntity && this._targetEntity.getPosition) {
        this._target.copy(this._targetEntity.getPosition());
        this._updateCameraFromController();
    }
};

CameraControls.prototype.syncFromCamera = function () {
    this._needsStateSync = true;
};

// 私有：从相机位置初始化控制器状态
CameraControls.prototype._updateControllerFromCamera = function () {
    var cameraPos = this.entity.getPosition();
    var direction = new pc.Vec3();
    direction.sub2(cameraPos, this._target);
    if (direction.length() > 0.001) {
        direction.normalize();
        this._yaw = Math.atan2(direction.x, direction.z) * 180 / Math.PI;
        this._pitch = Math.asin(direction.y) * 180 / Math.PI;
    }
    this._updateCameraFromController();
};

// 私有：根据控制器状态更新相机
CameraControls.prototype._updateCameraFromController = function () {
    this._yaw = Math.max(this._minYaw, Math.min(this._maxYaw, this._yaw));
    this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch));
    this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._distance));

    var radYaw = this._yaw * Math.PI / 180;
    var radPitch = this._pitch * Math.PI / 180;
    var x = this._target.x + this._distance * Math.cos(radPitch) * Math.sin(radYaw);
    var y = this._target.y + this._distance * Math.sin(radPitch);
    var z = this._target.z + this._distance * Math.cos(radPitch) * Math.cos(radYaw);
    this.entity.setPosition(x, y, z);
    this.entity.lookAt(this._target);
};

// 私有：自动旋转
CameraControls.prototype._performAutoRotate = function (dt) {
    if (this._isTransitioning) {
        this._transitionTime += dt;
        var progress = Math.min(this._transitionTime / this._transitionDuration, 1.0);
        var easeProgress = 1 - Math.pow(1 - progress, 3);
        this._autoAnimationTime += dt * this._autoRotateSpeed;

        var baseYaw = 0;
        var maxYawRange = Math.min(this._horizontalSwingRange, (this._maxYaw - this._minYaw) / 2);
        var targetYaw = Math.max(this._minYaw, Math.min(this._maxYaw, baseYaw + maxYawRange * Math.sin(this._autoAnimationTime * 0.8)));

        var maxPitchRange = Math.min(this._verticalSwingRange, Math.min(this._maxPitch - this._basePitch, this._basePitch - this._minPitch));
        var targetPitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._basePitch + maxPitchRange * Math.cos(this._autoAnimationTime * 0.8)));

        var targetDistance = Math.max(this._minDistance, Math.min(this._maxDistance, this._defaultDistance));

        this._yaw = this._yaw + (targetYaw - this._yaw) * easeProgress;
        this._pitch = this._pitch + (targetPitch - this._pitch) * easeProgress;
        this._distance = this._distance + (targetDistance - this._distance) * easeProgress;

        this._yaw = Math.max(this._minYaw, Math.min(this._maxYaw, this._yaw));
        this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch));
        this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._distance));

        if (progress >= 1.0) {
            this._isTransitioning = false;
            this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._defaultDistance));
        }
    } else {
        this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._defaultDistance));
        this._autoAnimationTime += dt * this._autoRotateSpeed;

        var baseYaw2 = 0;
        var maxYawRange2 = Math.min(this._horizontalSwingRange, (this._maxYaw - this._minYaw) / 2);
        this._yaw = Math.max(this._minYaw, Math.min(this._maxYaw, baseYaw2 + maxYawRange2 * Math.sin(this._autoAnimationTime * 0.8)));

        var maxPitchRange2 = Math.min(this._verticalSwingRange, Math.min(this._maxPitch - this._basePitch, this._basePitch - this._minPitch));
        this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._basePitch + maxPitchRange2 * Math.cos(this._autoAnimationTime * 0.8)));
    }

    this._updateCameraFromController();
};

// 交互事件
CameraControls.prototype._onMouseDown = function (e) {
    if (e.button === 0) {
        this._isDragging = true;
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        this._autoRotate = false;
        this._lastMouseActivityTime = Date.now() / 1000;
    }
};

CameraControls.prototype._onMouseMove = function (e) {
    if (this._isDragging) {
        var deltaX = e.clientX - this._lastX;
        var deltaY = e.clientY - this._lastY;
        this._yaw -= deltaX * 0.15;
        this._pitch += deltaY * 0.15;
        this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch));
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        this._lastMouseActivityTime = Date.now() / 1000;
        this._updateCameraFromController();
    }
};

CameraControls.prototype._onMouseUp = function () {
    if (this._isDragging) {
        this._isDragging = false;
        this._lastMouseActivityTime = Date.now() / 1000;
    }
};

CameraControls.prototype._onMouseWheel = function (e) {
    e.preventDefault();
    var zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._distance * zoomFactor));
    this._autoRotate = false;
    this._lastMouseActivityTime = Date.now() / 1000;
    this._updateCameraFromController();
};

CameraControls.prototype._onTouchStart = function (e) {
    e.preventDefault();
    if (e.touches.length === 2) {
        this._isPinching = true;
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        this._lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
        this._autoRotate = false;
        this._lastMouseActivityTime = Date.now() / 1000;
    } else if (e.touches.length === 1 && !this._isPinching) {
        this._isDragging = true;
        this._lastX = e.touches[0].clientX;
        this._lastY = e.touches[0].clientY;
        this._autoRotate = false;
        this._lastMouseActivityTime = Date.now() / 1000;
    }
};

CameraControls.prototype._onTouchMove = function (e) {
    e.preventDefault();
    if (e.touches.length === 2) {
        this._isPinching = true;
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var currentDistance = Math.sqrt(dx * dx + dy * dy);
        if (this._lastTouchDistance > 0) {
            var scaleFactor = currentDistance / this._lastTouchDistance;
            this._distance = Math.max(this._minDistance, Math.min(this._maxDistance, this._distance / scaleFactor));
            this._autoRotate = false;
            this._lastMouseActivityTime = Date.now() / 1000;
            this._updateCameraFromController();
        }
        this._lastTouchDistance = currentDistance;
    } else if (this._isDragging && e.touches.length === 1 && !this._isPinching) {
        var currentX = e.touches[0].clientX;
        var currentY = e.touches[0].clientY;
        var deltaX = currentX - this._lastX;
        var deltaY = currentY - this._lastY;
        this._yaw -= deltaX * 0.15;
        this._pitch += deltaY * 0.15;
        this._pitch = Math.max(this._minPitch, Math.min(this._maxPitch, this._pitch));
        this._lastX = currentX;
        this._lastY = currentY;
        this._lastMouseActivityTime = Date.now() / 1000;
        this._updateCameraFromController();
    }
};

CameraControls.prototype._onTouchEnd = function () {
    if (this._isDragging || this._isPinching) {
        this._isDragging = false;
        this._isPinching = false;
        this._lastTouchDistance = 0;
        this._lastMouseActivityTime = Date.now() / 1000;
    }
};

// 兼容默认导出（若被误作为模块导入，不影响资产加载）
try { module && (module.exports = CameraControls); } catch (e) { /* ignore in browser */ }
