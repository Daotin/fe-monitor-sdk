/**
 * 用户行为栈插件
 * 用于记录用户的操作历史，帮助复现错误
 */

import { generateUniqueId, getCurrentPageUrl, debounce } from '../../utils/index.js'

class BehaviorStackPlugin {
	/**
	 * 构造函数
	 * @param {Object} monitor - Monitor 实例
	 */
	constructor(monitor) {
		this.monitor = monitor
		this.name = 'behaviorStack'

		// 默认配置
		this.options = {
			maxStackSize: 30, // 行为栈最大长度
			includeTypes: ['click', 'pageChange', 'http', 'error', 'custom'], // 要记录的行为类型
			debounceTime: 300, // 防抖时间(毫秒)
			reportWithError: true, // 是否在错误发生时上报行为栈
			reportInterval: 0, // 定时上报间隔(毫秒)，0表示不定时上报
			maskSensitiveData: true, // 是否遮罩敏感数据
			sensitiveKeys: ['password', 'token', 'credit', 'card'], // 敏感数据关键词
		}

		// 行为栈
		this.stack = []

		// 事件监听器
		this.behaviorListener = this.handleBehavior.bind(this)
		this.errorListener = this.handleError.bind(this)

		// 上报定时器
		this.reportTimer = null

		// 防抖处理的行为记录函数
		this.debouncedRecordBehavior = null
	}

	/**
	 * 合并配置
	 * @param {Object} userOptions - 用户提供的配置
	 */
	mergeOptions(userOptions) {
		if (userOptions && typeof userOptions === 'object') {
			this.options = {
				...this.options,
				...userOptions,
				// 合并敏感关键词
				sensitiveKeys: [...this.options.sensitiveKeys, ...(userOptions.sensitiveKeys || [])],
			}
		}

		// 创建防抖处理的行为记录函数
		this.debouncedRecordBehavior = debounce(this.recordBehavior.bind(this), this.options.debounceTime)

		console.log('用户行为栈插件配置:', this.options)
	}

	/**
	 * 处理行为事件
	 * @param {Object} data - 行为数据
	 */
	handleBehavior(data) {
		// 检查是否应该记录该类型的行为
		if (!this.shouldRecordBehavior(data)) {
			return
		}

		console.log('on监听事件')

		// 对某些高频事件进行防抖处理
		if (data.type === 'scroll' || data.type === 'mousemove') {
			this.debouncedRecordBehavior(data)
		} else {
			this.recordBehavior(data)
		}
	}

	/**
	 * 检查是否应该记录该行为
	 * @param {Object} data - 行为数据
	 * @returns {boolean} - 是否应该记录
	 */
	shouldRecordBehavior(data) {
		// 检查行为类型是否在包含列表中
		return (
			this.options.includeTypes.includes('*') ||
			this.options.includeTypes.includes(data.type) ||
			(data.subType && this.options.includeTypes.includes(data.subType))
		)
	}

	/**
	 * 记录行为到栈中
	 * @param {Object} data - 行为数据
	 */
	recordBehavior(data) {
		// 处理敏感数据
		const processedData = this.options.maskSensitiveData ? this.maskSensitiveData(data) : data

		// 创建行为记录
		const behavior = {
			id: generateUniqueId(),
			timestamp: Date.now(),
			pageUrl: getCurrentPageUrl(),
			type: data.type,
			subType: data.subType,
			data: processedData,
		}

		// 添加到栈顶
		this.stack.push(behavior)

		// 如果超过最大长度，移除最早的行为
		if (this.stack.length > this.options.maxStackSize) {
			this.stack.shift()
		}

		console.log(`记录用户行为: ${behavior.type}${behavior.subType ? '/' + behavior.subType : ''}`)
	}

	/**
	 * 遮罩敏感数据
	 * @param {Object} data - 原始数据
	 * @returns {Object} - 处理后的数据
	 */
	maskSensitiveData(data) {
		if (!data || typeof data !== 'object') {
			return data
		}

		// 创建数据副本
		const maskedData = JSON.parse(JSON.stringify(data))

		// 递归处理对象
		const maskObject = obj => {
			if (!obj || typeof obj !== 'object') {
				return
			}

			Object.keys(obj).forEach(key => {
				// 检查键名是否包含敏感关键词
				const isSensitive = this.options.sensitiveKeys.some(sensitiveKey =>
					key.toLowerCase().includes(sensitiveKey.toLowerCase()),
				)

				if (isSensitive && typeof obj[key] === 'string') {
					// 遮罩敏感字符串
					obj[key] = '******'
				} else if (typeof obj[key] === 'object' && obj[key] !== null) {
					// 递归处理嵌套对象
					maskObject(obj[key])
				}
			})
		}

		maskObject(maskedData)
		return maskedData
	}

	/**
	 * 处理错误事件
	 * @param {Object} errorData - 错误数据
	 */
	handleError(errorData) {
		console.log('⭐errorData==>', errorData)
		if (this.options.reportWithError && this.stack.length > 0) {
			this.reportBehaviorStack(errorData)
		}
	}

	/**
	 * 上报行为栈
	 * @param {Object} errorData - 关联的错误数据(可选)
	 */
	reportBehaviorStack(errorData = null) {
		if (this.stack.length === 0) {
			return
		}

		const stackData = {
			type: 'behavior',
			subType: 'stack',
			stackId: generateUniqueId(),
			errorId: errorData ? errorData.id || generateUniqueId() : null,
			actions: [...this.stack], // 创建栈的副本
			count: this.stack.length,
			timestamp: Date.now(),
		}

		console.log(`上报用户行为栈: ${stackData.count}个行为记录`)

		// 发送行为栈数据
		this.monitor.send(stackData)
	}

	/**
	 * 开始定时上报
	 */
	startReportingCycle() {
		if (this.options.reportInterval <= 0 || this.reportTimer) {
			return
		}

		this.reportTimer = setInterval(() => {
			if (this.stack.length > 0) {
				this.reportBehaviorStack()
			}
		}, this.options.reportInterval)
	}

	/**
	 * 停止定时上报
	 */
	stopReportingCycle() {
		if (this.reportTimer) {
			clearInterval(this.reportTimer)
			this.reportTimer = null
		}
	}

	/**
	 * 初始化插件
	 * @param {Object} options - 插件配置选项
	 */
	init(options) {
		// 合并配置
		this.mergeOptions(options)

		// 监听行为事件
		this.monitor.on('behavior', this.behaviorListener)
		this.monitor.on('error', this.errorListener)

		// 如果配置了定时上报，启动定时器
		if (this.options.reportInterval > 0) {
			this.startReportingCycle()
		}

		console.log('用户行为栈插件已初始化')
	}

	/**
	 * 销毁插件，清理资源
	 */
	destroy() {
		// 停止定时上报
		this.stopReportingCycle()

		// 移除事件监听
		this.monitor.off('behavior', this.behaviorListener)
		this.monitor.off('error', this.errorListener)

		// 清空行为栈
		this.stack = []

		console.log('用户行为栈插件已销毁')
	}

	/**
	 * 手动获取当前行为栈
	 * @returns {Array} - 当前行为栈
	 */
	getStack() {
		return [...this.stack]
	}

	/**
	 * 手动清空行为栈
	 */
	clearStack() {
		this.stack = []
		console.log('行为栈已清空')
	}
}

export default BehaviorStackPlugin
