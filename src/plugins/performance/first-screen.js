/**
 * 首屏加载时间计算插件
 * 通过监控页面元素加载情况，计算首屏内容完全呈现的时间
 */

class FirstScreenPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'firstScreen';
    this.isInitialized = false;
    
    // 首屏计算相关属性
    this.startTime = performance.now(); // 开始时间
    this.firstScreenTime = 0; // 首屏时间
    this.observerTimer = null; // 观察计时器
    this.mutationObserver = null; // DOM变化观察器
    this.domUpdateCounter = 0; // DOM更新计数器
    this.lastDomUpdateTime = 0; // 最后一次DOM更新时间
    this.stableTime = 0; // DOM稳定时间
    this.maxMutationCount = 10; // 最大DOM变化次数
    this.domStableTimeout = 1000; // DOM稳定超时时间(ms)
    this.maxWaitTime = 10000; // 最大等待时间(ms)
    this.checkInterval = 500; // 检查间隔(ms)
    this.hasReported = false; // 是否已上报
  }

  /**
   * 处理DOM变化
   * @param {MutationRecord[]} mutations - 变化记录列表
   */
  handleMutations = (mutations) => {
    // 记录DOM变化次数和时间
    this.domUpdateCounter++;
    this.lastDomUpdateTime = performance.now();
    
    // 检查变化的元素是否在首屏内
    let hasVisibleChange = false;
    
    for (const mutation of mutations) {
      // 只关注添加节点和属性变化
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        // 检查添加的节点是否在首屏内
        if (mutation.addedNodes && mutation.addedNodes.length) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && this.isInFirstScreen(node)) {
              hasVisibleChange = true;
              break;
            }
          }
        }
        
        // 检查属性变化的节点是否在首屏内
        if (!hasVisibleChange && mutation.target && mutation.target.nodeType === 1) {
          if (this.isInFirstScreen(mutation.target)) {
            hasVisibleChange = true;
          }
        }
      }
      
      if (hasVisibleChange) break;
    }
    
    // 如果有可见变化，更新首屏时间
    if (hasVisibleChange) {
      this.firstScreenTime = this.lastDomUpdateTime;
    }
  };

  /**
   * 检查元素是否在首屏内
   * @param {Element} element - DOM元素
   * @returns {boolean} - 是否在首屏内
   */
  isInFirstScreen(element) {
    // 忽略不可见元素
    if (!element || !element.getBoundingClientRect || this.isHidden(element)) {
      return false;
    }
    
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // 元素在视口内，且有一定大小
    return (
      rect.top < viewportHeight &&
      rect.left < viewportWidth &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * 检查元素是否隐藏
   * @param {Element} element - DOM元素
   * @returns {boolean} - 是否隐藏
   */
  isHidden(element) {
    const style = window.getComputedStyle(element);
    return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
  }

  /**
   * 检查DOM是否稳定
   */
  checkDomStable = () => {
    const now = performance.now();
    
    // 如果已经上报过，不再检查
    if (this.hasReported) {
      return;
    }
    
    // 如果DOM已经稳定一段时间，或者超过最大等待时间，上报首屏时间
    if (
      (this.lastDomUpdateTime > 0 && now - this.lastDomUpdateTime > this.domStableTimeout) ||
      now - this.startTime > this.maxWaitTime ||
      this.domUpdateCounter >= this.maxMutationCount
    ) {
      this.reportFirstScreenTime();
    }
  };

  /**
   * 上报首屏时间
   */
  reportFirstScreenTime() {
    if (this.hasReported) {
      return;
    }
    
    // 停止观察
    this.stopObserving();
    
    // 如果没有记录到首屏时间，使用最后一次DOM更新时间或当前时间
    if (this.firstScreenTime === 0) {
      this.firstScreenTime = this.lastDomUpdateTime || performance.now();
    }
    
    // 计算首屏时间（相对于导航开始）
    const firstScreenTimeRelative = this.firstScreenTime - this.startTime;
    
    // 上报首屏时间
    this.monitor.send({
      type: 'performance',
      subType: 'first-screen',
      startTime: this.startTime,
      firstScreenTime: this.firstScreenTime,
      duration: firstScreenTimeRelative,
      domUpdateCount: this.domUpdateCounter,
    });
    
    this.hasReported = true;
  }

  /**
   * 开始观察DOM变化
   */
  startObserving() {
    // 创建MutationObserver
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(this.handleMutations);
      
      // 观察整个文档的变化
      this.mutationObserver.observe(document.documentElement, {
        childList: true, // 观察子节点变化
        subtree: true, // 观察所有后代节点
        attributes: true, // 观察属性变化
        characterData: false, // 不观察文本变化
      });
    }
    
    // 创建定时检查器
    this.observerTimer = setInterval(this.checkDomStable, this.checkInterval);
  }

  /**
   * 停止观察DOM变化
   */
  stopObserving() {
    // 停止MutationObserver
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    
    // 清除定时器
    if (this.observerTimer) {
      clearInterval(this.observerTimer);
      this.observerTimer = null;
    }
  }

  /**
   * 初始化插件
   */
  init() {
    if (this.isInitialized) {
      return;
    }
    
    // 记录开始时间
    this.startTime = performance.now();
    
    // 等待DOM准备好后开始观察
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.startObserving();
    } else {
      window.addEventListener('DOMContentLoaded', () => {
        this.startObserving();
      });
    }
    
    // 页面加载完成后检查一次
    window.addEventListener('load', () => {
      // 如果还没有上报，等待一段时间后上报
      if (!this.hasReported) {
        setTimeout(() => {
          this.reportFirstScreenTime();
        }, this.domStableTimeout);
      }
    });
    
    this.isInitialized = true;
  }

  /**
   * 销毁插件，清理资源
   */
  destroy() {
    this.stopObserving();
    this.isInitialized = false;
  }
}

export default FirstScreenPlugin;
