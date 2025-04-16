/**
 * rrweb录屏插件
 * 用于在错误发生时记录用户操作的录屏
 */

// 导入 rrweb 模块
import * as rrweb from 'rrweb'
import { generateUniqueId } from '../../utils/index.js'

class RRWebPlugin {
	/**
	 * 构造函数
	 * @param {Object} monitor - Monitor 实例
	 */
	constructor(monitor) {
		this.monitor = monitor
		this.name = 'rrweb'

		// 默认配置
		this.options = {
			// 自定义配置项
			recordMode: 'error', // 'error'(仅错误时上报) | 'always'(始终上报)
			maxRecordingTime: 10 * 1000, // 最大录制时长(毫秒)，默认10秒
			maxEvents: 100, // 最大事件数量
			errorTriggerTypes: ['error'], // 触发录屏上报的错误类型
			errorTriggerLevels: ['error'], // 触发录屏上报的错误级别

			// rrweb官方配置项
			blockClass: 'rr-block', // 不录制的元素类名
			ignoreClass: 'rr-ignore', // 不录制内容的元素类名
			maskAllInputs: true, // 是否遮罩所有输入框内容
			maskInputOptions: {
				password: true, // 是否遮罩密码输入
			},
			inlineStylesheet: true, // 是否内联样式表
			recordCanvas: false, // 是否录制Canvas内容(可能会增加数据量)
			sampling: {
				mousemove: 50, // 每50ms采样一次鼠标移动
				scroll: 150, // 每150ms采样一次滚动
				input: 'last', // 输入事件采样策略
			},
			checkoutEveryNms: 10 * 1000, // 每10秒生成一个全量快照，与maxRecordingTime保持一致
		}

		// 录屏事件存储
		this.events = []

		// 录制状态
		this.isRecording = false
		this.stopFn = null
		this.recordingStartTime = 0

		// 错误监听器
		this.errorListener = this.handleError.bind(this)
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
				// maskInputOptions: 遮罩输入选项
				maskInputOptions: {
					...this.options.maskInputOptions,
					...(userOptions.maskInputOptions || {}),
				},
				// sampling: 采样选项
				sampling: {
					...this.options.sampling,
					...(userOptions.sampling || {}),
				},
			}
		}

		console.log('RRWeb录屏插件配置:', this.options)
	}

	/**
	 * 开始录制
	 */
	startRecording() {
		if (this.isRecording) {
			return
		}

		console.log('开始RRWeb录屏')

		// 清空事件数组
		this.events = []

		// 记录开始时间
		this.recordingStartTime = Date.now()

		// 开始录制
		this.stopFn = rrweb.record({
			emit: event => {
				// 添加事件到数组
				this.events.push(event)

				// 如果超过最大事件数，移除最早的事件
				if (this.events.length > this.options.maxEvents) {
					this.events.shift()
				}
			},
			// 传递rrweb官方支持的配置项
			blockClass: this.options.blockClass,
			ignoreClass: this.options.ignoreClass,
			inlineStylesheet: this.options.inlineStylesheet,
			maskAllInputs: this.options.maskAllInputs,
			maskInputOptions: this.options.maskInputOptions,
			sampling: this.options.sampling,
			recordCanvas: this.options.recordCanvas,
			checkoutEveryNms: this.options.checkoutEveryNms,
		})

		this.isRecording = true

		// 如果设置了最大录制时长，定时停止录制
		if (this.options.maxRecordingTime > 0) {
			this.recordingTimeout = setTimeout(() => {
				this.stopRecording()
				this.startRecording() // 重新开始录制，形成循环缓冲区
			}, this.options.maxRecordingTime)
		}
	}

	/**
	 * 停止录制
	 */
	stopRecording() {
		if (!this.isRecording) {
			return
		}

		console.log('停止RRWeb录屏')

		// 清除超时定时器
		if (this.recordingTimeout) {
			clearTimeout(this.recordingTimeout)
			this.recordingTimeout = null
		}

		// 停止录制
		if (this.stopFn) {
			this.stopFn()
			this.stopFn = null
		}

		this.isRecording = false
	}

	/**
	 * 处理错误事件
	 * @param {Object} errorData - 错误数据
	 */
	handleError(errorData) {
		// 检查是否应该触发录屏上报
		if (!this.shouldTriggerRecording(errorData)) {
			return
		}

		console.log('检测到错误，准备上报录屏数据')

		// 停止当前录制
		this.stopRecording()

		// 如果有录制的事件，上报它们
		if (this.events.length > 0) {
			this.reportRecording(errorData)
		}

		// 如果模式是'error'，重新开始录制
		if (this.options.recordMode === 'error') {
			this.startRecording()
		}
	}

	/**
	 * 检查是否应该触发录屏上报
	 * @param {Object} errorData - 错误数据
	 * @returns {boolean} - 是否应该触发录屏上报
	 */
	shouldTriggerRecording(errorData) {
		// 如果没有配置触发条件，默认触发
		if (!this.options.errorTriggerTypes || !this.options.errorTriggerLevels) {
			return true
		}

		// 检查错误类型
		const matchType =
			this.options.errorTriggerTypes.includes('*') ||
			this.options.errorTriggerTypes.includes(errorData.type) ||
			this.options.errorTriggerTypes.includes(errorData.subType)

		// 检查错误级别
		const matchLevel =
			this.options.errorTriggerLevels.includes('*') || this.options.errorTriggerLevels.includes(errorData.level)

		return matchType && matchLevel
	}

	/**
	 * 上报录屏数据
	 * @param {Object} errorData - 关联的错误数据
	 */
	reportRecording(errorData) {
		const recordingData = {
			type: 'behavior',
			subType: 'rrweb',
			recordingId: generateUniqueId(),
			errorId: errorData.id || generateUniqueId(),
			events: this.events,
			startTime: this.recordingStartTime,
			endTime: Date.now(),
			duration: Date.now() - this.recordingStartTime,
			eventsCount: this.events.length,
		}

		console.log(`上报录屏数据: ${recordingData.eventsCount}个事件，持续${recordingData.duration}ms`)

		// 发送录屏数据
		this.monitor.send(recordingData)
	}

	/**
	 * 初始化插件
	 * @param {Object} options - 插件配置选项
	 */
	init(options) {
		// 合并配置
		this.mergeOptions(options)

		// 监听错误事件
		this.monitor.on('error', this.errorListener)

		// 根据配置决定是否立即开始录制
		if (this.options.recordMode === 'always' || this.options.recordMode === 'error') {
			this.startRecording()
		}

		console.log('RRWeb录屏插件已初始化')
	}

	/**
	 * 销毁插件，清理资源
	 */
	destroy() {
		// 停止录制
		this.stopRecording()

		// 移除错误监听
		this.monitor.off('error', this.errorListener)

		console.log('RRWeb录屏插件已销毁')
	}
}

export default RRWebPlugin
