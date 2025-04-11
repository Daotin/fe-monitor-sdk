/**
 * JS 错误监控插件
 * 捕获 JavaScript 运行时错误和未处理的 Promise 拒绝
 */

class JSErrorPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'jsError';
  }

  /**
   * 处理 JS 运行时错误
   * @param {string} message - 错误信息
   * @param {string} filename - 发生错误的文件
   * @param {number} lineno - 行号
   * @param {number} colno - 列号
   * @param {Error} error - 错误对象
   * @returns {boolean} - 返回 true 可以阻止浏览器默认的错误处理
   */
  handleError = (message, filename, lineno, colno, error) => {
    this.monitor.send({
      type: 'error',
      subType: 'js',
      message: message,
      filename: filename,
      lineno: lineno,
      colno: colno,
      stack: error ? error.stack : '未获取到堆栈信息',
      level: 'error',
      startTime: performance.now(),
    });

    // 返回 true 可以阻止浏览器默认的错误处理
    return true;
  };

  /**
   * 处理未捕获的 Promise 拒绝
   * @param {PromiseRejectionEvent} event - Promise 拒绝事件对象
   */
  handleUnhandledRejection = (event) => {
    let reason = event.reason;
    let message = 'Promise 拒绝';
    let stack = '未获取到堆栈信息';

    if (reason instanceof Error) {
      message = reason.message;
      stack = reason.stack;
    } else {
      message = String(reason);
    }

    this.monitor.send({
      type: 'error',
      subType: 'promise',
      message: message,
      stack: stack,
      level: 'error',
      startTime: event.timeStamp,
    });
  };

  /**
   * 初始化插件
   */
  init() {
    // 使用 window.onerror 捕获 JS 错误
    window.onerror = this.handleError;

    // 使用 addEventListener 捕获未处理的 Promise 拒绝
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  /**
   * 销毁插件，清理事件监听
   */
  destroy() {
    window.onerror = null;
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }
}

export default JSErrorPlugin;
