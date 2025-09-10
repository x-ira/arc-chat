class WebNotifier {
    constructor() {
        // 某些移动浏览器（如移动端 Edge/Chrome）可能不暴露 Notification，避免在构造时直接访问
        const hasNotification = typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined';
        this.permission = hasNotification && typeof Notification.permission === 'string' ? Notification.permission : 'default';
        this.defaultOptions = {
            icon: null,
            badge: null,
            body: '',
            tag: null,
            requireInteraction: false,
            silent: false,
            vibrate: null,
            dir: 'auto',
        };
    }
    /**
     * 检查浏览器是否支持通知
     * @returns {boolean}
     */
    isSupported() {
        return 'Notification' in window;
    }
    /**
     * 请求通知权限
     * @returns {Promise<string>} permission状态: 'granted', 'denied', 'default'
     */
    async requestPermission() {
        if (!this.isSupported()) {
            throw new Error('浏览器不支持通知功能');
        }
        if (this.permission === 'granted') {
            return 'granted';
        }
        try {
            this.permission = await Notification.requestPermission();
            return this.permission;
        } catch (error) {
            // 兼容旧版本浏览器
            return new Promise((resolve) => {
                Notification.requestPermission((permission) => {
                    this.permission = permission;
                    resolve(permission);
                });
            });
        }
    }
    /**
     * 显示通知
     * @param {string} title - 通知标题
     * @param {Object} options - 通知选项
     */
    async show_with(title, options = {}) {
        if (!this.isSupported()) {
            throw new Error('浏览器不支持通知功能');
        }
        // 如果没有权限，先请求权限
        if (this.permission !== 'granted') {
            await this.requestPermission();
        }
        if (this.permission !== 'granted') {
            throw new Error('用户拒绝了通知权限');
        }
        // 合并默认选项
        const finalOptions = { ...this.defaultOptions, ...options };
        const notification = new Notification(title, finalOptions);

        // 添加默认的点击处理
        if (options.onClick) {
            notification.onclick = options.onClick;
        }
        // 添加默认的关闭处理
        if (options.onClose) {
            notification.onclose = options.onClose;
        }
        // 添加错误处理
        if (options.onError) {
            notification.onerror = options.onError;
        }
        // 添加显示处理
        if (options.onShow) {
            notification.onshow = options.onShow;
        }
        return notification;
    }
    /**
     * 显示简单通知
     */
    async show(title, body) {
        // 检测是否为移动设备
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        const options = {
            body,
            // icon: '/bell.png',
            requireInteraction: !isMobile, // 移动端不要求交互
        };
        
        // 只在支持振动的设备上添加振动
        if ('vibrate' in navigator && isMobile) {
            options.vibrate = [200, 100, 200];
        }
        
        return this.show_with(title, options);
    }
    /**
     * 获取当前权限状态
     * @returns {string}
     */
    getPermissionStatus() {
        return this.permission;
    }
    /**
     * 设置默认选项
     * @param {Object} options - 默认选项
     */
    setDefaultOptions(options) {
        this.defaultOptions = { ...this.defaultOptions, ...options };
    }
}

const web_notifier = new WebNotifier();
window.notify = {
    isSupported: () => web_notifier.isSupported(),
    requestPermission: () => web_notifier.requestPermission(),
    show: (title, body) => web_notifier.show(title, body),
    advanced: web_notifier
};

export default WebNotifier;
