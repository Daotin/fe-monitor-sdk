/**
 * 独立访客量（Unique Visitor）监控插件
 * 用于收集独立访客量数据
 */

import { generateUniqueId, getCurrentPageUrl } from '../../utils/index.js'

class UVPlugin {
	/**
	 * 构造函数
	 * @param {Object} monitor - Monitor 实例
	 */
	constructor(monitor) {
		this.monitor = monitor
		this.name = 'uv'
		this.storageKey = 'monitor_user_id'
		this.expirationKey = 'monitor_user_expiration'
		this.expirationTime = 24 * 60 * 60 * 1000 // 24小时过期时间，可根据需求调整
	}

	/**
	 * 获取或生成用户唯一标识
	 * @returns {string} 用户唯一标识
	 */
	getUserId() {
		// 尝试从 localStorage 获取现有的用户ID
		let userId = localStorage.getItem(this.storageKey)
		let expiration = localStorage.getItem(this.expirationKey)
		const now = new Date().getTime()

		// 如果没有用户ID或者已过期，生成新的ID
		if (!userId || !expiration || now > parseInt(expiration)) {
			userId = generateUniqueId()
			expiration = now + this.expirationTime

			// 存储新的用户ID和过期时间
			try {
				localStorage.setItem(this.storageKey, userId)
				localStorage.setItem(this.expirationKey, expiration.toString())
				return { userId, isNew: true }
			} catch (error) {
				console.error('存储用户ID失败:', error)
				return { userId, isNew: true }
			}
		}

		return { userId, isNew: false }
	}

	/**
	 * 记录独立访客量
	 */
	recordUV() {
		const { userId, isNew } = this.getUserId()

		// 只有当用户是新用户时才记录UV
		if (isNew) {
			this.monitor.send({
				type: 'behavior',
				subType: 'uv',
				pageUrl: getCurrentPageUrl(),
				referrer: document.referrer,
				userId: userId,
				timestamp: new Date().getTime(),
				startTime: performance.now(),
			})
		}

		return userId
	}

	/**
	 * 初始化插件
	 */
	init() {
		// 页面加载后记录UV
		if (document.readyState === 'complete') {
			this.recordUV()
		} else {
			window.addEventListener('load', () => this.recordUV())
		}
	}

	/**
	 * 销毁插件
	 */
	destroy() {
		window.removeEventListener('load', () => this.recordUV())
	}
}

export default UVPlugin
