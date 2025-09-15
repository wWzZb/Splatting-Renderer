## 核心功能模块
### 高斯泼溅模型渲染
高斯泼溅模型是本项目的核心展示内容，通过PlayCanvas的gsplat组件实现高效渲染。

实现方式：

- 使用 createSplatInstance 函数创建高斯泼溅实体
- 支持自定义模型位置、旋转和缩放
- 提供高质量渲染选项（ highQualitySH: true ）


### 相机控制系统
相机系统是本项目的关键交互模块，支持自动旋转和手动控制两种模式。

主要功能：

- 自动旋转 ：展示模式下，相机围绕模型自动旋转，展示模型的各个角度
- 手动控制 ：用户可通过鼠标、键盘控制相机视角
- 模式切换 ：当用户交互时自动切换到手动模式，停止交互5秒后自动恢复自动旋转
实现机制：

- 使用 handleCameraTransition 函数管理相机状态转换
- 通过 animateCamera 函数实现相机环绕动画

### 全景底图背景
项目支持使用HDR格式的全景图作为场景背景，增强视觉效果。

实现方式：

- 通过 setupSkybox 函数设置全景天空盒
- 支持不同场景使用不同的天空盒配置
- 可通过修改 assets.json 中的 skyboxUrl 属性更换背景

### 资产信息展示
应用提供了详细的资产信息展示面板，显示模型的描述、作者、创作日期等元数据。

展示内容：

- 模型描述
- 作者信息
- 所属单位
- 创建日期
- 分类和标签
实现方式：

- 通过 updateAssetInfoDisplay 函数将配置信息绑定到HTML元素
- TODO 响应式设计，确保在不同设备上都有良好的显示效果

### 路由系统
项目实现了基于URL的资产切换机制，方便用户通过不同路径访问不同模型。

主要功能：

- 根据URL路径自动加载对应模型
- 支持通过URL参数指定资产ID
- 实现404路由处理和重定向
实现方式：

- 使用page.js库实现客户端路由
- 通过 initRouter 函数初始化路由系统
- 路由配置存储在 routes.json 文件中

## 关键API与函数
### 应用初始化
initApp(config)

- 功能 ：初始化PlayCanvas应用实例
- 参数 ： config - 包含模型URL、天空盒URL和缩放比例的配置对象
- 返回值 ：PlayCanvas应用实例
- 核心流程 ：创建应用、加载资产、设置场景、初始化相机和灯光、配置交互控制
### 实体创建函数
createCamera(app, initialPosition, initialRotation)

- 功能 ：创建并配置相机实体
- 参数 ：应用实例、初始位置、初始旋转角度
- 返回值 ：相机实体
createSplatInstance(app, name, asset, px, py, pz, scale)

- 功能 ：创建高斯泼溅模型实体
- 参数 ：应用实例、实体名称、模型资源、位置坐标、缩放比例
- 返回值 ：高斯泼溅实体
createLight(app, eulerAngles)

- 功能 ：创建并配置场景灯光
- 参数 ：应用实例、灯光角度
- 返回值 ：灯光实体
setupSkybox(app, assets, skyType, scale)

- 功能 ：设置场景天空盒
- 参数 ：应用实例、资源对象、天空类型、缩放比例
### 相机控制函数
handleCameraTransition(dt, currentTime, autoRotate, lastMouseActivityTime, autoRotateDelay, camera, targetEntity, scriptInstance)

- 功能 ：处理相机状态转换和自动旋转逻辑
- 参数 ：时间增量、当前时间、自动旋转标志、上次鼠标活动时间、自动旋转延迟、相机实体、目标实体、脚本实例
- 返回值 ：更新后的时间
animateCamera(time, camera, targetEntity, orbitRadius, horizontalRange, verticalRange)

- 功能 ：实现相机环绕目标实体的动画效果
- 参数 ：时间参数、相机实体、目标实体、轨道半径、水平范围、垂直范围
### 状态与路由管理
initializeConfigFromUrl()

- 功能 ：从URL参数初始化应用配置
- 实现 ：解析URL参数，获取资产ID并更新应用配置
initRouter()

- 功能 ：初始化路由系统
- 实现 ：根据路由映射表注册路由，处理路由变化和404情况


## 配置与部署
### 配置文件
项目主要通过JSON文件进行配置：

- assets.json ：定义所有可展示的资产，包括模型路径、天空盒路径、缩放比例和元数据信息
- routes.json ：定义URL路径与资产ID的映射关系

## 项目结构
```
├── config/           # 配置文件目录
│   ├── assets.json   # 资产配置信息
│   └── routes.json   # 路由映射配置
├── controls/         # 控制模块
│   ├── camera-animation.ts  # 相机动画控制
│   └── camera-controls.mjs  # 相机交互控制
├── instance/         # 实体创建模块
│   ├── asset.ts      # 资产加载
│   ├── camera.ts     # 相机创建
│   ├── config.ts     # 配置管理
│   ├── gsplat.ts     # 高斯泼溅模型创建
│   ├── light.ts      # 灯光创建
│   └── sky.ts        # 天空盒设置
├── cube/             # 全景底图资源
├── splatting/        # 高斯泼溅模型资源
├── main.ts           # 应用入口
├── router.ts         # 路由系统
├── stores.ts         # 状态管理
└── index.html        # 主页面
```
