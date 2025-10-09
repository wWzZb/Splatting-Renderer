import page from 'page';

/**
 * 绑定返回按钮的点击事件
 */
function bindBackButton(defaultRoute?: string) {
    const backButton = document.getElementById('custom-action-btn');

    if (!backButton) {
        console.error('未找到ID为custom-action-btn的按钮元素');
        return;
    }

    // 为按钮添加点击事件监听器
    backButton.addEventListener('click', () => {
        // 优先使用传入的默认路由参数，如果没有则获取按钮上设置的目标路由，如果都没有则默认返回首页
        const targetRoute = defaultRoute || "/";

        // 执行路由跳转
        page(targetRoute);
    });
}

/**
 * 设置按钮的路由功能
 */
export function setupButtonRouting(buttonToRuter?: string) {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            bindBackButton();
        });
    } else {
        bindBackButton(buttonToRuter);
    }
}

