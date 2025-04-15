/**
 * 用户行为监控示例
 * 展示如何使用前端监控 SDK 的用户行为监控功能
 */

// 导入 Monitor 类
// 在实际项目中，你会使用：
// import Monitor from 'dt-monitor-sdk';
// 这里我们使用相对路径导入
import Monitor from '../src/index.js'

// 创建一个新的 Monitor 实例，启用用户行为监控插件
const monitor = new Monitor({
	appId: 'example-app',
	reportUrl: 'https://example.com/api/monitor',
	plugins: [
		// 'pv',
		'uv',
		// 'click',
		// 'pageChange'
	], // 启用用户行为监控插件
	sampling: 1, // 100% 采样
	maxQueueSize: 3, // 设置较小的队列大小，以便于观察数据发送
})

// 初始化监控
monitor.init()

console.log('用户行为监控已启用')

// 运行示例
document.addEventListener('DOMContentLoaded', () => {
	// 页面加载完成后，PV 和 UV 插件会自动记录数据
	console.log('页面已加载，PV 和 UV 数据应该已被记录')
})
