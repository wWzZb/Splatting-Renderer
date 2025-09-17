import * as pc from 'playcanvas';
// 导入所需的函数
import { setupSkybox } from './instance/sky.ts';
import { createSplatInstance } from './instance/gsplat.ts'
import { createCamera } from './instance/camera.ts'
import { createLight } from './instance/light.ts';
import { createAssets } from './instance/asset.ts'
//导入摄像头控制模块
import { handleCameraTransition } from './controls/camera-animation.ts'
// 导入状态管理
import { initializeConfigFromUrl, appConfig } from './stores.ts';
// 导入路由初始化函数
import { initRouter } from './router.ts';



// 初始化配置
initializeConfigFromUrl();

// 初始化路由系统
initRouter();

// 初始化PlayCanvas应用
const app = initApp(appConfig);



/**
 * 初始化PlayCanvas应用
 * @param gsplatUrl 高斯喷溅模型URL
 * @param skyboxUrl 天空盒URL
 * @param scale 模型缩放比例
 * @returns 应用实例
 */
function initApp(config: any): pc.Application {
    // 获取canvas元素
    const canvas = document.getElementById('application') as HTMLCanvasElement;
    if (!canvas) {
        throw new Error('Canvas element not found');
    }

    // 创建应用实例
    const app = new pc.Application(canvas);
    app.setCanvasResolution(pc.RESOLUTION_AUTO);
    app.setCanvasFillMode(pc.FILLMODE_NONE);

    updateAssetInfoDisplay(config);
    // 加载资产
    const assets = createAssets(
        config.gsplatUrl,  // 模型路径
        config.skyboxUrl   // 环境贴图路径
    );
    const assetListLoader = new pc.AssetListLoader(Object.values(assets), app.assets);
    // 确保资产加载完成
    assetListLoader.load((err, failed) => {
        if (err) {
            console.error(`Failed to load assets:`, err);
            if (failed && failed.length) {
                console.error(`Failed assets count: ${failed.length}`);
                failed.forEach(asset => {
                    console.error(asset);
                });
            }
        } else {
            console.log(`${Object.keys(assets).length} assets loaded`);
            app.start();

            // 设置天空盒
            setupSkybox(app, assets);
            // 设置相机
            let scriptInstance: any = null;
            const initialPosition = new pc.Vec3(0, 6, 9);
            const initialRotation = new pc.Vec3(-80, 0, 0);
            const camera = createCamera(app, initialPosition, initialRotation);
            // 将脚本添加到相机实体
            camera.addComponent('script');
            if (camera.script) {
                scriptInstance = camera.script.create('cameraControls');
            }
            app.root.addChild(camera);

            // 创建一个灯光
            const light = createLight(app);

            // 创建一个高斯喷溅实体
            const Cat = createSplatInstance(app, 'Toy Cat', assets.gsplat, 0, -1.5, 0, config.scale);

            // 判断控制状态逻辑
            let time = 0;
            let autoRotate = true; // 自动转动标志
            let lastMouseActivityTime = 0; // 上次鼠标活动时间
            const autoRotateDelay = 5; // 自动转动延迟时间(秒)

            // 监听鼠标点击事件
            canvas.addEventListener('mousedown', () => {
                autoRotate = false;
                lastMouseActivityTime = time;
            });

            // 监听鼠标滚轮事件
            canvas.addEventListener('wheel', () => {
                autoRotate = false;
                lastMouseActivityTime = time;
            });

            app.on('update', (dt) => {
                time = handleCameraTransition(dt, time, autoRotate, lastMouseActivityTime, autoRotateDelay, camera, Cat, scriptInstance);
            });
        }
    });

    return app;
}

/**
 * 更新资产信息显示
 * 将配置参数与index.html中的标签绑定
 * @param config 应用配置对象
 */
function updateAssetInfoDisplay(config: any): void {
    // 获取HTML中的元素
    const nameElement = document.getElementById('asset-name');//TODO
    const studentidElement = document.getElementById('asset-studentid');
    const descriptionElement = document.getElementById('asset-description');
    const authorElement = document.getElementById('asset-author');
    const dateElement = document.getElementById('asset-date');
    const organizationElement = document.getElementById('asset-organization');
    // 检查元素是否存在
    if (!descriptionElement || !authorElement || !dateElement || !organizationElement || !studentidElement || !nameElement) {
        console.warn('无法找到资产信息显示元素');
        return;
    }

    // 清空现有内容
    // dateElement.innerHTML = '';

    // 显示additionalInfo内容作为标签
    if (config.additionalInfo) {
        if (config.additionalInfo.description) {
            // 显示描述信息
            descriptionElement.textContent = `${config.additionalInfo.description || '无描述'}`;
        }

        if (config.additionalInfo.description) {
            // 显示作品名称
            nameElement.textContent = `${config.additionalInfo.name || '无描述'}`;
        }

        if (config.additionalInfo.author) {
            // 显示作者信息
            authorElement.textContent = `作者: ${config.additionalInfo.author || '未知'}`;
        }
        if (config.additionalInfo.studentId) {
            // 显示学号信息
            studentidElement.textContent = `学号: ${config.additionalInfo.studentId || '无信息'}`;
        }

        if (config.additionalInfo.date) {
            // 显示日期标签
            dateElement.textContent = `日期: ${config.additionalInfo.date || '未知'}`;
        }

        if (config.additionalInfo.organization) {
            //显示单位信息
            organizationElement.textContent = `单位: ${config.additionalInfo.organization || '未知'}`;
        }
    }
}