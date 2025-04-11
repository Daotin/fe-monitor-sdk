/**
 * 性能监控示例
 * 展示如何使用前端监控 SDK 的性能监控功能
 */

// 导入 Monitor 类
// 在实际项目中，你会使用：
// import Monitor from 'fe-monitor-sdk';
// 这里我们使用相对路径导入
import Monitor from '../src/index.js';

// 创建一个新的 Monitor 实例，启用性能监控插件
const monitor = new Monitor({
  appId: 'example-app',
  reportUrl: 'https://example.com/api/monitor',
  plugins: [
    // 性能监控插件
    // 'pageLoad',
    // 'resourceLoad',
    'firstPaint',
    // 'firstContentfulPaint',
    // 'largestContentfulPaint',
  ],
  sampling: 1, // 100% 采样
  maxQueueSize: 3,
});

// 初始化监控
monitor.init();

console.log('性能监控已启用');

// 示例：手动上报自定义性能指标
function reportCustomPerformanceMetric() {
  console.log('上报自定义性能指标...');

  // 计算一个自定义的性能指标，例如某个函数的执行时间
  const startTime = performance.now();

  // 模拟一些耗时操作
  for (let i = 0; i < 1000000; i++) {
    Math.sqrt(i);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // 手动上报性能指标
  monitor.send({
    type: 'performance',
    subType: 'custom',
    name: 'heavy-calculation',
    startTime: startTime,
    duration: duration,
    // 可以添加其他自定义字段
    iterations: 1000000,
  });

  console.log(`自定义性能指标已上报，耗时: ${duration.toFixed(2)}ms`);
}

// 添加按钮来触发自定义性能指标上报
function addReportButton() {
  const button = document.createElement('button');
  button.textContent = '上报自定义性能指标';
  button.addEventListener('click', reportCustomPerformanceMetric);
  document.body.appendChild(button);
}

// 当 DOM 加载完成后添加按钮
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addReportButton);
} else {
  addReportButton();
}

// 导出 monitor 实例，以便可以在控制台中访问
window.monitor = monitor;
