/**
 * 白屏检测插件
 * 通过采样对比和轮询检测机制，检测页面是否处于白屏状态
 */

class WhiteScreenPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'whiteScreen';
    this.isInitialized = false;

    // 白屏检测相关属性
    this.checkInterval = 1000; // 检查间隔(ms)
    this.maxCheckCount = 5; // 最大检查次数
    this.checkCount = 0; // 当前检查次数
    this.whiteScreenThreshold = 0.95; // 白屏阈值，超过95%的采样点为空时判定为白屏
    this.checkTimer = null; // 检查定时器
    this.hasReported = false; // 是否已上报

    // 可配置的采样方案
    this.sampleScheme = {
      light: [
        // 5点
        [0.1, 0.1],
        [0.9, 0.1],
        [0.5, 0.5],
        [0.1, 0.9],
        [0.9, 0.9],
      ],
      normal: [
        // 9点（默认）
        [0.1, 0.1],
        [0.5, 0.1],
        [0.9, 0.1],
        [0.1, 0.5],
        [0.5, 0.5],
        [0.9, 0.5],
        [0.1, 0.9],
        [0.5, 0.9],
        [0.9, 0.9],
      ],
      strict: [
        // 13点
        [0.0, 0.1],
        [0.1, 0.1],
        [0.5, 0.1],
        [0.9, 0.1],
        [1.0, 0.1],
        [0.1, 0.5],
        [0.5, 0.5],
        [0.9, 0.5],
        [0.0, 0.9],
        [0.1, 0.9],
        [0.5, 0.9],
        [0.9, 0.9],
        [1.0, 0.9],
      ],
    };

    this.sampleMode = 'normal'; // 可选: 'light', 'normal', 'strict'
    this.sampleCount = this.sampleScheme[this.sampleMode].length; // 5, 9, 13
  }

  /**
   * 检测页面是否白屏
   * @returns {boolean} - 是否白屏
   */
  checkWhiteScreen() {
    // 如果页面不可见，不进行检测
    if (document.hidden) {
      return false;
    }

    // 获取页面尺寸
    const { innerWidth, innerHeight } = window;

    // 如果页面尺寸为0，不进行检测
    if (innerWidth === 0 || innerHeight === 0) {
      return false;
    }

    // 采样点坐标
    const points = this.sampleScheme[this.sampleMode].map(([x, y]) => [innerWidth * x, innerHeight * y]);

    // 空白点计数
    let emptyCount = 0;

    // 检查每个采样点
    for (const [x, y] of points) {
      const element = document.elementFromPoint(x, y);

      // 如果采样点没有元素，或者是body/html元素，认为是空白
      if (!element || element.tagName === 'HTML' || element.tagName === 'BODY') {
        emptyCount++;
      }
    }

    // 计算空白率
    const emptyRate = emptyCount / this.sampleCount;
    console.log(emptyRate, emptyCount);

    // 如果空白率超过阈值，判定为白屏
    return emptyRate >= this.whiteScreenThreshold;
  }

  /**
   * 定时检查白屏
   */
  startChecking = () => {
    // 如果已经上报过，不再检查
    if (this.hasReported) {
      return;
    }

    // 检查白屏
    const isWhiteScreen = this.checkWhiteScreen();

    console.log('isWhiteScreen', isWhiteScreen);

    // 增加检查次数
    this.checkCount++;

    // 如果检测到白屏，或者达到最大检查次数，上报结果
    if (isWhiteScreen || this.checkCount >= this.maxCheckCount) {
      this.reportWhiteScreen(isWhiteScreen);
    } else {
      // 继续检查
      this.checkTimer = setTimeout(this.startChecking, this.checkInterval);
    }
  };

  /**
   * 上报白屏检测结果
   * @param {boolean} isWhiteScreen - 是否白屏
   */
  reportWhiteScreen(isWhiteScreen) {
    if (this.hasReported) {
      return;
    }

    // 停止检查
    this.stopChecking();

    // 只有在检测到白屏时才上报
    if (isWhiteScreen) {
      // 上报白屏信息
      this.monitor.send({
        type: 'performance',
        subType: 'white-screen',
        isWhiteScreen: true,
        checkCount: this.checkCount,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        url: window.location.href,
        startTime: performance.now(),
        userAgent: navigator.userAgent,
      });
    }

    this.hasReported = true;
  }

  /**
   * 开始检查白屏
   */
  startChecking() {
    // 清除之前的定时器
    this.stopChecking();

    // 重置检查次数
    this.checkCount = 0;

    // 开始定时检查
    this.checkTimer = setTimeout(this.startChecking, this.checkInterval);
  }

  /**
   * 停止检查白屏
   */
  stopChecking() {
    if (this.checkTimer) {
      clearTimeout(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * 初始化插件
   */
  init() {
    if (this.isInitialized) {
      return;
    }

    // 等待页面加载完成后开始检查
    if (document.readyState === 'complete') {
      this.startChecking();
    } else {
      window.addEventListener('load', () => {
        // 页面加载完成后等待一段时间再检查，避免正常加载过程中的误判
        setTimeout(() => {
          this.startChecking();
        }, 2000); // 等待2秒后开始检查
      });
    }

    this.isInitialized = true;
  }

  /**
   * 销毁插件，清理资源
   */
  destroy() {
    this.stopChecking();
    this.isInitialized = false;
  }
}

export default WhiteScreenPlugin;
