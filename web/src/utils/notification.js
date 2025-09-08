class WebNotifier {
    constructor() {
        this.permission = Notification.permission;
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
        return this.show_with(title, { body,
            // icon: '/bell.png',
            requireInteraction: true,
            vibrate: [200, 100, 200],
            // onClick: () => console.log('点击'),
            // onClose: () => console.log('关闭')
        });
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
    // 检查支持
    isSupported: () => web_notifier.isSupported(),
    // 请求权限
    requestPermission: () => web_notifier.requestPermission(),
    // 显示简单通知
    show: (title, body) => web_notifier.show(title, body),
    // 高级用法
    advanced: web_notifier
};

export default WebNotifier;
