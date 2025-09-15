import page from 'page';
import { routeToAssetId } from './instance/config'



/**
 * 初始化路由系统
 */
export function initRouter() {
    // 根据路由映射表自动注册路由
    for (const [path, assetId] of Object.entries(routeToAssetId)) {
        page(path, () => {
            handleRouteChange(path, assetId);
        });
    }

    // 404 路由
    page('*', () => {
        console.error('未找到该路由');
        // 重定向到首页
        page.redirect('/');
    });

    // 启动路由
    page();
    setupButtonRouting()
}

/**
 * 处理路由变化
 * @param path 目标路径
 * @param assetId 对应的资产ID
 */
function handleRouteChange(path: string, assetId: number) {
    // 从URL参数中获取当前资产ID
    const urlParams = new URLSearchParams(window.location.search);
    const currentAssetId = urlParams.get('assetId') || '1';

    // 只有当资产ID不同时才刷新页面
    if (currentAssetId !== assetId.toString()) {
        // 构建新的URL，包含资产ID参数
        let newUrl = path;
        if (assetId !== 1) {
            newUrl += `?assetId=${assetId}`;
        }

        // 使用replaceState更新URL，然后刷新页面
        window.history.replaceState({}, '', newUrl);
        window.location.reload();
    }
}

/**
 * 获取所有路由路径
 * @returns 路由路径数组
 */
export function getAllRoutes(): string[] {
    return Object.keys(routeToAssetId);
}

/**
 * 根据路由路径获取对应的资产ID
 * @param path 路由路径
 * @returns 对应的资产ID
 */
export function getAssetIdForPath(path: string): number {
    return routeToAssetId[path] || 1; // 默认返回第一个资产
}


/**
 * 设置按钮的路由功能
 */
function setupButtonRouting() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            bindBackButton();
        });
    } else {
        bindBackButton();
    }
}

/**
 * 绑定返回按钮的点击事件
 */
function bindBackButton() {
    const backButton = document.getElementById('custom-action-btn');

    if (!backButton) {
        console.error('未找到ID为custom-action-btn的按钮元素');
        return;
    }

    // 为按钮添加点击事件监听器
    backButton.addEventListener('click', () => {
        // 获取按钮上设置的目标路由，如果没有则默认返回首页
        const targetRoute = backButton.getAttribute('data-route') || '/';

        // 执行路由跳转
        page(targetRoute);
    });
}

/**
 * 手动导航到指定路由
 * @param routePath 目标路由路径
 */
export function navigateToRoute(routePath: string): void {
    if (typeof routePath !== 'string' || !routePath.trim()) {
        console.error('无效的路由路径');
        return;
    }

    page(routePath);
}