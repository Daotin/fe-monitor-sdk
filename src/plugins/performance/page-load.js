/**
 * 页面加载性能指标收集插件
 * 收集页面加载相关的性能指标，如 load、DOMContentLoaded 等
 */

class PageLoadPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'pageLoad';
    this.isInitialized = false;
  }

  /**
   * 处理页面显示事件
   * @param {Event} event - 页面显示事件对象
   */
  handlePageShow = (event) => {
    // 使用 requestAnimationFrame 确保在下一帧执行，避免阻塞页面渲染
    requestAnimationFrame(() => {
      // 收集页面加载性能指标
      const navigationTiming = this.getNavigationTiming();

      // 发送性能数据
      this.monitor.send({
        type: 'performance',
        subType: 'page-load',
        ...navigationTiming,
        // 如果是从缓存加载的页面，event.persisted 会为 true
        fromCache: event.persisted,
      });
    });
  };

  /**
   * 获取导航计时数据
   * @returns {Object} - 导航计时数据
   */
  getNavigationTiming() {
    // 使用 Performance API 获取导航计时数据
    const timing = performance.timing || {};
    const navigation = performance.navigation || {};

    // 如果支持 PerformanceNavigationTiming API，优先使用它
    let navigationEntry = null;
    if (typeof PerformanceNavigationTiming !== 'undefined') {
      const entries = performance.getEntriesByType('navigation');
      if (entries && entries.length > 0) {
        navigationEntry = entries[0];
      }
    }

    // 根据可用的 API 构建导航计时数据
    if (navigationEntry) {
      // 使用新的 PerformanceNavigationTiming API
      console.log('使用新的 PerformanceNavigationTiming API');
      return {
        // 页面加载总时间（单位：毫秒）
        loadTime: navigationEntry.loadEventEnd - navigationEntry.startTime,
        // DOM 解析时间
        domContentLoadedTime: navigationEntry.domContentLoadedEventEnd - navigationEntry.startTime,
        // 首字节时间 (TTFB)
        ttfb: navigationEntry.responseStart - navigationEntry.requestStart,
        // DNS 解析时间
        dnsTime: navigationEntry.domainLookupEnd - navigationEntry.domainLookupStart,
        // TCP 连接时间
        tcpTime: navigationEntry.connectEnd - navigationEntry.connectStart,
        // 重定向时间
        redirectTime: navigationEntry.redirectEnd - navigationEntry.redirectStart,
        // 请求响应时间
        requestTime: navigationEntry.responseEnd - navigationEntry.requestStart,
        // DOM 解析时间
        domParsingTime: navigationEntry.domInteractive - navigationEntry.responseEnd,
        // 资源加载时间
        resourceTime: navigationEntry.loadEventStart - navigationEntry.domContentLoadedEventEnd,
        // 导航类型
        navigationType: navigationEntry.type,
      };
    } else if (timing.navigationStart) {
      // 使用旧的 Performance Timing API
      return {
        // 页面加载总时间
        loadTime: timing.loadEventEnd - timing.navigationStart,
        // DOM 解析时间
        domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
        // 首字节时间 (TTFB)
        ttfb: timing.responseStart - timing.requestStart,
        // DNS 解析时间
        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
        // TCP 连接时间
        tcpTime: timing.connectEnd - timing.connectStart,
        // 重定向时间
        redirectTime: timing.redirectEnd - timing.redirectStart,
        // 请求响应时间
        requestTime: timing.responseEnd - timing.requestStart,
        // DOM 解析时间
        domParsingTime: timing.domInteractive - timing.responseEnd,
        // 资源加载时间
        resourceTime: timing.loadEventStart - timing.domContentLoadedEventEnd,
        // 导航类型
        navigationType: navigation.type,
      };
    }

    // 如果都不支持，返回空对象
    return {};
  }

  /**
   * 初始化插件
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    // 监听 pageshow 事件，该事件在页面显示时触发，包括从缓存加载的情况
    window.addEventListener('pageshow', this.handlePageShow);

    this.isInitialized = true;
  }

  /**
   * 销毁插件，清理资源
   */
  destroy() {
    if (this.isInitialized) {
      window.removeEventListener('pageshow', this.handlePageShow);
      this.isInitialized = false;
    }
  }
}

export default PageLoadPlugin;
