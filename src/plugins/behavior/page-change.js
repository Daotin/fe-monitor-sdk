/**
 * 页面跳转监控插件
 * 用于收集页面路由变化数据
 */

import { generateUniqueId } from '../../utils/index.js'

class PageChangePlugin {
	/**
	 * 构造函数
	 * @param {Object} monitor - Monitor 实例
	 */
	constructor(monitor) {
		this.monitor = monitor
		this.name = 'pageChange'
		this.currentUrl = window.location.href
	}

	/**
	 * 处理 hash 变化事件
	 * @param {HashChangeEvent} event - hash 变化事件对象
	 */
	handleHashChange = event => {
		const from = event.oldURL || this.currentUrl
		const to = event.newURL || window.location.href

		this.reportPageChange('hashchange', from, to, event.timeStamp)
		this.currentUrl = to
	}

	/**
	 * 处理 popstate 事件（历史记录变化）
	 * @param {PopStateEvent} event - popstate 事件对象
	 */
	handlePopState = event => {
		const from = this.currentUrl
		const to = window.location.href

		// 如果 URL 没有变化，则不记录
		if (from === to) {
			return
		}

		this.reportPageChange('popstate', from, to, event.timeStamp)
		this.currentUrl = to
	}

	/**
	 * 监听 history API 的调用
	 */
	patchHistoryAPI() {
		const originalPushState = window.history.pushState
		const originalReplaceState = window.history.replaceState
		const plugin = this

		// 重写 pushState 方法
		window.history.pushState = function (...args) {
			const from = plugin.currentUrl

			// 调用原始方法
			const result = originalPushState.apply(this, args)

			const to = window.location.href
			// 如果 URL 没有变化，则不记录
			if (from !== to) {
				plugin.reportPageChange('pushState', from, to, performance.now())
				plugin.currentUrl = to
			}

			return result
		}

		// 重写 replaceState 方法
		window.history.replaceState = function (...args) {
			const from = plugin.currentUrl

			// 调用原始方法
			const result = originalReplaceState.apply(this, args)

			const to = window.location.href
			// 如果 URL 没有变化，则不记录
			if (from !== to) {
				plugin.reportPageChange('replaceState', from, to, performance.now())
				plugin.currentUrl = to
			}

			return result
		}
	}

	/**
	 * 报告页面变化事件
	 * @param {string} changeType - 变化类型（hashchange/popstate/pushState/replaceState）
	 * @param {string} from - 来源 URL
	 * @param {string} to - 目标 URL
	 * @param {number} timestamp - 事件时间戳
	 */
	reportPageChange(changeType, from, to, timestamp) {
		// 提取路径部分
		const fromPath = this.extractPath(from)
		const toPath = this.extractPath(to)

		this.monitor.send({
			type: 'behavior',
			subType: 'pageChange',
			changeType: changeType,
			from: from,
			to: to,
			fromPath: fromPath,
			toPath: toPath,
			timestamp: new Date().getTime(),
			startTime: timestamp,
			uuid: generateUniqueId(),
		})
	}

	/**
	 * 从 URL 中提取路径部分
	 * @param {string} url - 完整 URL
	 * @returns {string} - URL 的路径部分
	 */
	extractPath(url) {
		try {
			const urlObj = new URL(url)
			return urlObj.pathname + urlObj.search + urlObj.hash
		} catch (error) {
			console.error('解析 URL 失败:', error)
			return url
		}
	}

	/**
	 * 初始化插件
	 */
	init() {
		// 监听 hash 变化
		window.addEventListener('hashchange', this.handleHashChange)

		// 监听 popstate 事件
		window.addEventListener('popstate', this.handlePopState)

		// 重写 history API
		this.patchHistoryAPI()

		// 记录初始 URL
		this.currentUrl = window.location.href
	}

	/**
	 * 销毁插件，清理事件监听
	 */
	destroy() {
		window.removeEventListener('hashchange', this.handleHashChange)
		window.removeEventListener('popstate', this.handlePopState)

		// 注意：我们无法轻易恢复被重写的 history API
		// 在实际应用中，这通常不是问题，因为监控通常在页面的整个生命周期内有效
	}
}

export default PageChangePlugin
