import { lazyReportBatch } from '../report'
import { generateUniqueId } from '../utils'

// 收集UV数据
export default function uv() {
	// 获取或生成用户唯一标识符
	let userId = localStorage.getItem('user_unique_id')

	// 只有当用户是首次访问（没有存储的标识符）时，才记录UV
	if (!userId) {
		userId = generateUniqueId()
		localStorage.setItem('user_unique_id', userId)

		// 只有当用户是新用户时才报告UV
		const reportData = {
			type: 'behavior',
			subType: 'uv',
			startTime: performance.now(),
			pageUrl: window.location.href,
			referror: document.referrer,
			uuid: userId,
			timestamp: new Date().getTime(),
		}

		lazyReportBatch(reportData)
	}

	// 可以继续调用PV统计，或者在其他地方单独调用
}
