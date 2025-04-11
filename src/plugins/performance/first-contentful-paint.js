/**
 * 首次内容绘制 (FCP) 性能指标收集插件
 * 使用 PerformanceObserver API 监听 paint 事件
 */

class FirstContentfulPaintPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'firstContentfulPaint';
    this.observer = null;
  }

  /**
   * 处理 paint 条目
   * @param {PerformanceObserverEntryList} list - 性能观察条目列表
   */
  handleEntries = (list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        // 找到 FCP 条目后断开观察器
        if (this.observer) {
          this.observer.disconnect();
          this.observer = null;
        }

        // 提取性能数据
        const json = entry.toJSON();
        
        // 发送性能数据
        this.monitor.send({
          type: 'performance',
          subType: 'first-contentful-paint',
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          entryType: entry.entryType,
        });
      }
    }
  };

  /**
   * 初始化插件
   */
  init() {
    // 确保浏览器支持 PerformanceObserver
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('当前浏览器不支持 PerformanceObserver API，无法收集 FCP 指标');
      return;
    }

    try {
      // 创建性能观察器
      this.observer = new PerformanceObserver(this.handleEntries);
      
      // 开始观察 paint 类型的条目，buffered: true 确保能捕获到已经发生的事件
      this.observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      console.error('初始化 FCP 性能监控失败:', error);
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
  }
}

export default FirstContentfulPaintPlugin;
