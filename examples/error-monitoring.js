/**
 * 错误监控示例
 * 展示如何使用前端监控 SDK 的错误监控功能
 */

// 导入 Monitor 类
// 在实际项目中，你会使用：
// import Monitor from 'dt-monitor-sdk';
// 这里我们使用相对路径导入
import Monitor from '../src/index.js'

// 创建一个新的 Monitor 实例，启用错误监控插件
const monitor = new Monitor({
	appId: 'example-app',
	reportUrl: 'https://example.com/api/monitor',
	plugins: ['jsError', 'resourceError', 'httpError'], // 启用错误监控插件
	sampling: 1, // 100% 采样
	maxQueueSize: 3,
})

// 初始化监控
monitor.init()

console.log('错误监控已启用')

// 示例 1: JS 错误
function triggerJSError() {
	console.log('即将触发JS加载错误...')
	import('non-existent-module')
}

// 示例 2: Promise 错误
function triggerPromiseError() {
	// 未处理的 Promise 拒绝（将被 jsError 插件自动捕获）
	console.log('即将触发未处理的 Promise 拒绝...')
	new Promise((resolve, reject) => {
		reject(new Error('Promise 被拒绝'))
	})

	// 异步/等待错误
	setTimeout(async () => {
		try {
			console.log('即将触发 async/await 错误...')
			await Promise.reject(new Error('Async/Await 错误'))
		} catch (error) {
			console.error('捕获到 async/await 错误:', error)
			// 手动报告错误
			monitor.reportError(error, {
				component: 'ErrorExample',
				action: 'triggerPromiseError',
			})
		}
	}, 2000)
}

// 示例 3: 资源错误
function triggerResourceError() {
	console.log('即将触发资源加载错误...')

	// 创建一个不存在的图片元素（将被 resourceError 插件自动捕获）
	const img = document.createElement('img')
	img.src = 'https://example.com/non-existent-image.jpg'
	document.body.appendChild(img)

	// 创建一个不存在的脚本（将被 resourceError 插件自动捕获）
	setTimeout(() => {
		const script = document.createElement('script')
		script.src = 'https://example.com/non-existent-script.js'
		document.body.appendChild(script)
	}, 1000)
}

// 示例 4: HTTP 错误
function triggerHttpError() {
	console.log('即将触发 HTTP 请求错误...')

	// 发起一个会失败的 fetch 请求（将被 httpError 插件自动捕获）
	fetch('https://example.com/non-existent-api')
		.then(response => {
			console.log('HTTP 响应状态:', response.status)
			return response.json()
		})
		.catch(error => {
			console.error('捕获到 fetch 错误:', error)
		})

	// 发起一个会失败的 XHR 请求（将被 httpError 插件自动捕获）
	setTimeout(() => {
		const xhr = new XMLHttpRequest()
		xhr.open('GET', 'https://example.com/non-existent-api')
		xhr.onload = function () {
			console.log('XHR 响应状态:', xhr.status)
		}
		xhr.onerror = function (error) {
			console.error('捕获到 XHR 错误:', error)
		}
		xhr.send()
	}, 2000)
}

// 运行示例
document.addEventListener('DOMContentLoaded', () => {
	// 添加事件监听器
	document.getElementById('js-error-btn').addEventListener('click', triggerJSError)
	document.getElementById('promise-error-btn').addEventListener('click', triggerPromiseError)
	document.getElementById('resource-error-btn').addEventListener('click', triggerResourceError)
	document.getElementById('http-error-btn').addEventListener('click', triggerHttpError)
})
