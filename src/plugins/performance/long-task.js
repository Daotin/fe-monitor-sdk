/**
 * 长任务监控插件
 * 使用 PerformanceObserver API 监控执行时间超过 50ms 的任务
 */

class LongTaskPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'longTask';
    this.observer = null;
    this.isInitialized = false;

    // 长任务相关配置
    this.longTaskThreshold = 50; // 长任务阈值，默认为 50ms
    this.reportAllTasks = false; // 是否上报所有长任务，默认只上报超过阈值的任务
    this.maxReportCount = 100; // 最大上报次数，防止上报过多
    this.reportCount = 0; // 当前上报次数
    this.aggregationTime = 5000; // 聚合时间窗口，单位毫秒
    this.aggregatedTasks = []; // 聚合的长任务
    this.aggregationTimer = null; // 聚合定时器
  }

  /**
   * 处理长任务条目
   * @param {PerformanceObserverEntryList} list - 性能观察条目列表
   */
  handleEntries = (list) => {
    const entries = list.getEntries();

    for (const entry of entries) {
      // 只处理 longtask 类型的条目
      if (entry.entryType !== 'longtask') {
        continue;
      }

      // 如果设置了只上报超过阈值的任务，则过滤掉不符合条件的任务
      if (!this.reportAllTasks && entry.duration < this.longTaskThreshold) {
        continue;
      }

      console.log('long entry', entry);

      // 提取长任务信息
      const taskInfo = {
        type: 'performance',
        subType: 'long-task',
        name: entry.name,
        startTime: entry.startTime,
        duration: entry.duration,
        entryType: entry.entryType,
        // 获取长任务的归因信息
        attribution: this.getAttribution(entry),
        // 获取当前执行的脚本URL
        scriptUrl: this.getCurrentScriptUrl(),
        // 获取当前执行的函数名
        functionName: this.getCurrentFunctionName(),
      };

      // 将长任务添加到聚合列表
      this.aggregatedTasks.push(taskInfo);

      // 如果没有设置聚合定时器，则设置一个
      if (!this.aggregationTimer) {
        this.aggregationTimer = setTimeout(() => {
          this.reportAggregatedTasks();
        }, this.aggregationTime);
      }
    }
  };

  /**
   * 获取长任务的归因信息
   * @param {PerformanceEntry} entry - 性能条目
   * @returns {Object} - 归因信息
   */
  getAttribution(entry) {
    // attribution 属性包含了长任务的归因信息
    if (entry.attribution && entry.attribution.length > 0) {
      const attribution = entry.attribution[0];
      return {
        name: attribution.name,
        entryType: attribution.entryType,
        startTime: attribution.startTime,
        duration: attribution.duration,
        containerType: attribution.containerType,
        containerName: attribution.containerName,
        containerId: attribution.containerId,
        containerSrc: attribution.containerSrc,
      };
    }

    return null;
  }

  /**
   * 获取当前执行的脚本URL
   * @returns {string} - 当前脚本URL
   */
  getCurrentScriptUrl() {
    try {
      // 尝试获取当前执行的脚本
      const currentScript = document.currentScript;
      return currentScript ? currentScript.src : '';
    } catch (error) {
      return '';
    }
  }

  /**
   * 获取当前执行的函数名
   * @returns {string} - 当前函数名
   */
  getCurrentFunctionName() {
    try {
      // 尝试获取当前执行的函数名
      // 这是一个简单的实现，可能不适用于所有情况
      const error = new Error();
      const stackLines = error.stack.split('\n');

      // 跳过前两行（Error 和当前函数）
      if (stackLines.length > 2) {
        const callerLine = stackLines[2].trim();
        const functionNameMatch = callerLine.match(/at\s+([^\s]+)\s+/);

        if (functionNameMatch && functionNameMatch[1]) {
          return functionNameMatch[1];
        }
      }

      return '';
    } catch (error) {
      return '';
    }
  }

  /**
   * 上报聚合的长任务
   */
  reportAggregatedTasks() {
    // 清除聚合定时器
    if (this.aggregationTimer) {
      clearTimeout(this.aggregationTimer);
      this.aggregationTimer = null;
    }

    // 如果没有聚合的任务，则不上报
    if (this.aggregatedTasks.length === 0) {
      return;
    }

    // 计算聚合统计信息
    const stats = this.calculateStats(this.aggregatedTasks);

    // 上报聚合统计信息
    this.monitor.send({
      type: 'performance',
      subType: 'long-task-summary',
      count: this.aggregatedTasks.length,
      totalDuration: stats.totalDuration,
      averageDuration: stats.averageDuration,
      maxDuration: stats.maxDuration,
      minDuration: stats.minDuration,
      timeRange: [stats.startTime, stats.endTime],
      tasks: this.aggregatedTasks.slice(0, 10), // 只包含前10个任务详情
    });

    // 增加上报次数
    this.reportCount++;

    // 清空聚合列表
    this.aggregatedTasks = [];

    // 如果达到最大上报次数，则停止观察
    if (this.reportCount >= this.maxReportCount) {
      this.stopObserving();
    }
  }

  /**
   * 计算聚合统计信息
   * @param {Array} tasks - 长任务列表
   * @returns {Object} - 统计信息
   */
  calculateStats(tasks) {
    if (tasks.length === 0) {
      return {
        totalDuration: 0,
        averageDuration: 0,
        maxDuration: 0,
        minDuration: 0,
        startTime: 0,
        endTime: 0,
      };
    }

    let totalDuration = 0;
    let maxDuration = -Infinity;
    let minDuration = Infinity;
    let startTime = Infinity;
    let endTime = -Infinity;

    for (const task of tasks) {
      totalDuration += task.duration;
      maxDuration = Math.max(maxDuration, task.duration);
      minDuration = Math.min(minDuration, task.duration);
      startTime = Math.min(startTime, task.startTime);
      endTime = Math.max(endTime, task.startTime + task.duration);
    }

    return {
      totalDuration,
      averageDuration: totalDuration / tasks.length,
      maxDuration,
      minDuration,
      startTime,
      endTime,
    };
  }

  /**
   * 开始观察长任务
   */
  startObserving() {
    // 确保浏览器支持 PerformanceObserver 和 longtask
    if (typeof PerformanceObserver === 'undefined') {
      console.warn('当前浏览器不支持 PerformanceObserver API，无法监控长任务');
      return;
    }

    try {
      // 创建性能观察器
      this.observer = new PerformanceObserver(this.handleEntries);

      // 开始观察 longtask 类型的条目
      this.observer.observe({ entryTypes: ['longtask'] });

      console.log('长任务监控已启动');
    } catch (error) {
      console.error('初始化长任务监控失败:', error);
    }
  }

  /**
   * 停止观察长任务
   */
  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // 上报剩余的聚合任务
    if (this.aggregatedTasks.length > 0) {
      this.reportAggregatedTasks();
    }

    // 清除聚合定时器
    if (this.aggregationTimer) {
      clearTimeout(this.aggregationTimer);
      this.aggregationTimer = null;
    }
  }

  /**
   * 初始化插件
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    // 开始观察长任务
    this.startObserving();

    // 页面卸载前上报剩余的聚合任务
    window.addEventListener('beforeunload', () => {
      this.reportAggregatedTasks();
    });

    this.isInitialized = true;
  }

  /**
   * 销毁插件，清理资源
   */
  destroy() {
    this.stopObserving();

    window.removeEventListener('beforeunload', this.reportAggregatedTasks);

    this.isInitialized = false;
  }
}

export default LongTaskPlugin;
