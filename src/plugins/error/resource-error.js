/**
 * 资源错误监控插件
 * 捕获资源（图片、脚本、CSS 等）加载失败的错误
 */

class ResourceErrorPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'resourceError';
  }

  /**
   * 处理资源加载错误
   * @param {ErrorEvent} event - 错误事件对象
   */
  handleResourceError = (event) => {
    const target = event.target;
    
    // 检查是否是资源加载错误（具有 src 或 href 属性的元素）
    if (target && (target.src || target.href)) {
      const url = target.src || target.href;
      
      this.monitor.send({
        type: 'error',
        subType: 'resource',
        url: url,
        tagName: target.tagName.toLowerCase(),
        html: target.outerHTML,
        level: 'warning', // 资源错误通常级别较低
        paths: event.path || event.composedPath && event.composedPath(), // 获取事件路径
        startTime: performance.now(),
      });
    }
  };

  /**
   * 初始化插件
   */
  init() {
    // 使用捕获阶段监听 error 事件，以捕获资源加载错误
    window.addEventListener('error', this.handleResourceError, true);
  }

  /**
   * 销毁插件，清理事件监听
   */
  destroy() {
    window.removeEventListener('error', this.handleResourceError, true);
  }
}

export default ResourceErrorPlugin;
