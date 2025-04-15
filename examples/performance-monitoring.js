/**
 * 性能监控示例
 * 展示如何使用前端监控 SDK 的性能监控功能
 */

// 导入 Monitor 类
// 在实际项目中，你会使用：
// import Monitor from 'dt-monitor-sdk';
// 这里我们使用相对路径导入
import Monitor from '../src/index.js'

// 创建一个新的 Monitor 实例，启用性能监控插件
const monitor = new Monitor({
	appId: 'example-app',
	reportUrl: 'https://example.com/api/monitor',
	plugins: [
		// 性能监控插件
		// 'pageLoad',
		// 'resourceLoad',
		// 'firstPaint',
		// 'firstContentfulPaint',
		// 'largestContentfulPaint',
		// 'firstScreen', // 首屏加载时间计算
		// 'whiteScreen', // 白屏检测
		'longTask', // 长任务监控
	],
	sampling: 1, // 100% 采样
	maxQueueSize: 10,
})

// 初始化监控
monitor.init()

console.log('性能监控已启用')

// 示例：手动上报自定义性能指标
function reportCustomPerformanceMetric() {
	console.log('上报自定义性能指标...')

	// 计算一个自定义的性能指标，例如某个函数的执行时间
	const startTime = performance.now()

	// 模拟一些耗时操作
	for (let i = 0; i < 1000000; i++) {
		Math.sqrt(i)
	}

	const endTime = performance.now()
	const duration = endTime - startTime

	// 手动上报性能指标
	monitor.send({
		type: 'performance',
		subType: 'custom',
		name: 'heavy-calculation',
		startTime: startTime,
		duration: duration,
		// 可以添加其他自定义字段
		iterations: 1000000,
	})

	console.log(`自定义性能指标已上报，耗时: ${duration.toFixed(2)}ms`)
}

// 示例：触发长任务
function triggerLongTask() {
	console.log('即将触发长任务...')

	// 模拟一个长任务（超过 50ms 的任务）
	const startTime = performance.now()

	// 执行一个耗时操作，阻塞主线程
	const blockTime = 100 // 阻塞 100ms
	const endTime = startTime + blockTime

	// 使用循环来阻塞主线程
	while (performance.now() < endTime) {
		// 空循环，消耗CPU
	}

	const actualDuration = performance.now() - startTime
	console.log(`长任务已触发，实际耗时: ${actualDuration.toFixed(2)}ms`)

	// 长任务将由 LongTaskPlugin 自动捕获和上报
}

// 添加按钮来触发自定义性能指标上报和长任务
function addButtons() {
	// 添加自定义性能指标按钮
	const reportButton = document.createElement('button')
	reportButton.textContent = '上报自定义性能指标'
	reportButton.addEventListener('click', reportCustomPerformanceMetric)
	reportButton.style.marginRight = '10px'
	document.body.appendChild(reportButton)

	// 添加触发长任务按钮
	const longTaskButton = document.createElement('button')
	longTaskButton.textContent = '触发长任务'
	longTaskButton.addEventListener('click', triggerLongTask)
	document.body.appendChild(longTaskButton)
}

// 当 DOM 加载完成后添加按钮
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', addButtons)
} else {
	addButtons()
}

// 导出 monitor 实例，以便可以在控制台中访问
window.monitor = monitor
