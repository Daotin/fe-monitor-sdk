/**
 * 资源加载性能收集插件
 * 使用 PerformanceObserver API 监听资源加载性能
 */

class ResourceLoadPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'resourceLoad';
    this.observer = null;
    this.isInitialized = false;
  }

  /**
   * 处理资源加载条目
   * @param {PerformanceObserverEntryList} list - 性能观察条目列表
   */
  handleEntries = (list) => {
    const entries = list.getEntries();
    
    for (const entry of entries) {
      // 过滤掉非资源类型的条目
      if (entry.entryType !== 'resource') {
        continue;
      }
      
      // 提取资源性能数据
      const resourceData = {
        type: 'performance',
        subType: 'resource',
        name: entry.name, // 资源的 URL
        initiatorType: entry.initiatorType, // 资源类型（如 img, script, css 等）
        startTime: entry.startTime, // 开始加载时间
        duration: entry.duration, // 加载总时间
        // DNS 解析时间
        dnsTime: entry.domainLookupEnd - entry.domainLookupStart,
        // TCP 连接时间
        tcpTime: entry.connectEnd - entry.connectStart,
        // 请求时间
        requestTime: entry.responseStart - entry.requestStart,
        // 响应时间
        responseTime: entry.responseEnd - entry.responseStart,
        // 重定向时间
        redirectTime: entry.redirectEnd - entry.redirectStart,
        // 首字节时间 (TTFB)
        ttfb: entry.responseStart - entry.startTime,
        // 资源大小信息
        decodedBodySize: entry.decodedBodySize, // 解码后的资源大小
        encodedBodySize: entry.encodedBodySize, // 编码后的资源大小
        transferSize: entry.transferSize, // 传输大小（包括头部）
        // 是否使用缓存
        fromCache: entry.transferSize === 0 && entry.decodedBodySize > 0,
      };
      
      // 发送资源性能数据
      this.monitor.send(resourceData);
    }
  };

  /**
   * 初始化插件
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    // 确保浏览器支持 PerformanceObserver
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('当前浏览器不支持 PerformanceObserver API，无法收集资源加载性能指标');
      return;
    }

    try {
      // 创建性能观察器
      this.observer = new PerformanceObserver(this.handleEntries);
      
      // 开始观察 resource 类型的条目
      this.observer.observe({ type: 'resource', buffered: true });
      
      this.isInitialized = true;
    } catch (error) {
      console.error('初始化资源加载性能监控失败:', error);
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
    
    this.isInitialized = false;
  }
}

export default ResourceLoadPlugin;
