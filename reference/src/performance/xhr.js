import { lazyReportBatch } from '../report'
export const originalProto = XMLHttpRequest.prototype
export const originalSend = originalProto.send
export const originalOpen = originalProto.open

function overwriteOpenAndSend() {
	// 重写 open 方法为了获取请求的 url 和 method
	originalProto.open = function newOpen(...args) {
		this.url = args[1]
		this.method = args[0]
		originalOpen.apply(this, args)
	}
	// 重写 send 方法为了获取请求的开始时间和结束时间，和请求的状态
	originalProto.send = function newSend(...args) {
		this.startTime = Date.now()
		const onLoaded = () => {
			this.endTime = Date.now()
			this.duration = this.endTime - this.startTime
			const { url, method, startTime, endTime, duration, status } = this
			const reportData = {
				status,
				duration,
				startTime,
				endTime,
				url,
				method: method.toUpperCase(),
				type: 'performance',
				success: status >= 200 && status < 300,
				subType: 'xhr',
			}
			// todo 发送数据
			lazyReportBatch(reportData)
			this.removeEventListener('loadend', onLoaded, true)
		}
		this.addEventListener('loadend', onLoaded, true)
		originalSend.apply(this, args)
	}
}
export default function xhr() {
	overwriteOpenAndSend()
}
