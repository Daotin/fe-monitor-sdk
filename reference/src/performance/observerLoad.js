import { lazyReportBatch } from '../report'
export default function observerLoad() {
	// 当页面显示时（包括首次加载或从浏览历史返回时），该事件会被触发。
	window.addEventListener('pageShow', function (event) {
		requestAnimationFrame(() => {
			// 统计load或者DOMContentLoaded的时间都可以
			// 1. load 事件：页面及所有资源（如图片、样式表等）加载完成后触发。
			// 2. DOMContentLoaded 事件：当初始的 HTML 文档被完全加载和解析完成后触发，不需要等待样式表、图片等资源加载完成。
			;['load'].forEach(type => {
				const reportData = {
					type: 'performance',
					subType: type,
					pageUrl: window.location.href,
					startTime: performance.now() - event.timeStamp,
				}
				// 发送数据
				lazyReportBatch(reportData)
			})
		}, true)
	})
}
