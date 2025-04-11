/**
 * 最大内容绘制 (LCP) 性能指标收集插件
 * 使用 PerformanceObserver API 监听 largest-contentful-paint 事件
 */

class LargestContentfulPaintPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'largestContentfulPaint';
    this.observer = null;
    this.lastLCP = null;
  }

  /**
   * 处理 LCP 条目
   * @param {PerformanceObserverEntryList} list - 性能观察条目列表
   */
  handleEntries = (list) => {
    // LCP 可能会触发多次，我们需要记录最后一次
    const entries = list.getEntries();
    console.log('entries', entries);
    const lastEntry = entries[entries.length - 1];

    if (lastEntry) {
      this.lastLCP = lastEntry;
      console.log('lastLCP', this.lastLCP);
    }
  };

  /**
   * 上报最终的 LCP 值
   */
  reportFinalLCP = () => {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.lastLCP) {
      // 发送性能数据
      this.monitor.send({
        type: 'performance',
        subType: 'largest-contentful-paint',
        name: this.lastLCP.name,
        startTime: this.lastLCP.startTime,
        duration: this.lastLCP.duration,
        size: this.lastLCP.size,
        entryType: this.lastLCP.entryType,
        element: this.lastLCP.element ? this.getElementPath(this.lastLCP.element) : null,
        outerHtml: this.lastLCP.element ? this.lastLCP.element.outerHTML : null,
      });
    }
  };

  /**
   * 获取元素的选择器路径
   * @param {Element} element - DOM 元素
   * @returns {string} - 元素的选择器路径
   */
  getElementPath(element) {
    if (!element || !element.tagName) return '';

    let path = element.tagName.toLowerCase();
    if (element.id) {
      path += `#${element.id}`;
    } else if (element.className && typeof element.className === 'string') {
      path += `.${element.className.split(' ').join('.')}`;
    }

    return path;
  }

  /**
   * 初始化插件
   */
  init() {
    // 确保浏览器支持 PerformanceObserver
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('当前浏览器不支持 PerformanceObserver API，无法收集 LCP 指标');
      return;
    }

    try {
      // 创建性能观察器
      this.observer = new PerformanceObserver(this.handleEntries);

      // 开始观察 largest-contentful-paint 类型的条目
      this.observer.observe({ type: 'largest-contentful-paint', buffered: true });

      // 在页面卸载前报告最终的 LCP 值
      // 当用户离开页面时，我们需要报告最后记录的 LCP 值
      ['visibilitychange', 'pagehide', 'beforeunload'].forEach((type) => {
        window.addEventListener(type, this.reportFinalLCP, { once: true });
      });
    } catch (error) {
      console.error('初始化 LCP 性能监控失败:', error);
    }
  }

  /**
   * 销毁插件，清理资源
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    ['visibilitychange', 'pagehide', 'beforeunload'].forEach((type) => {
      window.removeEventListener(type, this.reportFinalLCP);
    });
  }
}

export default LargestContentfulPaintPlugin;
