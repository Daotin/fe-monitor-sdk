/**
 * 点击行为监控插件
 * 用于收集用户点击行为数据
 */

import { generateUniqueId, getCurrentPageUrl } from '../../utils/index.js'

class ClickPlugin {
	/**
	 * 构造函数
	 * @param {Object} monitor - Monitor 实例
	 */
	constructor(monitor) {
		this.monitor = monitor
		this.name = 'click'
		this.options = {
			// 默认配置
			ignoreClasses: ['monitor-ignore'], // 忽略带有这些类的元素
			maxElementContentLength: 50, // 收集元素内容的最大长度
			collectTextContent: true, // 是否收集元素的文本内容
		}
	}

	/**
	 * 处理点击事件
	 * @param {Event} event - 点击事件对象
	 */
	handleClick = event => {
		console.log('触发点击事件', event)
		const target = event.target

		// 如果目标元素带有忽略类，则不收集
		if (this.shouldIgnoreElement(target)) {
			return
		}

		// 获取元素路径
		const path = this.getElementPath(target)

		// 获取元素内容
		let textContent = ''
		if (this.options.collectTextContent) {
			textContent = this.getElementContent(target)
		}

		// 收集点击数据
		this.monitor.send({
			type: 'behavior',
			subType: 'click',
			target: target.tagName.toLowerCase(),
			path: path,
			pageUrl: getCurrentPageUrl(),
			content: textContent,
			position: {
				x: event.clientX,
				y: event.clientY,
			},
			elementInfo: {
				id: target.id || '',
				className: target.className || '',
				name: target.name || '',
				type: target.type || '',
				value: target.type === 'password' ? '******' : target.value || '',
				width: target.offsetWidth,
				height: target.offsetHeight,
			},
			timestamp: new Date().getTime(),
			startTime: event.timeStamp,
			uuid: generateUniqueId(),
		})
	}

	/**
	 * 判断是否应该忽略该元素
	 * @param {HTMLElement} element - 要检查的元素
	 * @returns {boolean} - 是否应该忽略
	 */
	shouldIgnoreElement(element) {
		// 检查元素是否包含忽略类
		if (element.classList) {
			for (const ignoreClass of this.options.ignoreClasses) {
				if (element.classList.contains(ignoreClass)) {
					return true
				}
			}
		}

		// 检查元素是否有 data-monitor-ignore 属性
		if (element.hasAttribute && element.hasAttribute('data-monitor-ignore')) {
			return true
		}

		return false
	}

	/**
	 * 获取元素的选择器路径
	 * @param {HTMLElement} element - 要获取路径的元素
	 * @returns {string} - 元素的选择器路径
	 */
	getElementPath(element) {
		if (!element || element === document.body) {
			return 'body'
		}

		let path = ''
		let currentElement = element
		const maxDepth = 5 // 限制路径深度以避免路径过长
		let depth = 0

		while (currentElement && currentElement !== document.body && depth < maxDepth) {
			let selector = currentElement.tagName.toLowerCase()

			// 添加 ID
			if (currentElement.id) {
				selector += `#${currentElement.id}`
			}
			// 添加类名（最多取前两个类）
			else if (currentElement.className && typeof currentElement.className === 'string') {
				const classes = currentElement.className.split(' ').filter(c => c)
				if (classes.length) {
					selector += `.${classes.slice(0, 2).join('.')}`
				}
			}

			// 添加到路径
			path = path ? `${selector} > ${path}` : selector

			// 移动到父元素
			currentElement = currentElement.parentElement
			depth++
		}

		return path
	}

	/**
	 * 获取元素的文本内容
	 * @param {HTMLElement} element - 要获取内容的元素
	 * @returns {string} - 元素的文本内容
	 */
	getElementContent(element) {
		let content = ''

		// 对于表单元素，获取其值
		if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
			// 对于密码输入框，不获取实际值
			if (element.type === 'password') {
				content = '******'
			} else {
				content = element.value || ''
			}
		}
		// 对于其他元素，获取文本内容
		else {
			content = element.textContent || element.innerText || ''
		}

		// 裁剪内容长度
		if (content && content.length > this.options.maxElementContentLength) {
			content = content.substring(0, this.options.maxElementContentLength) + '...'
		}

		// 去除多余空白字符
		return content.trim().replace(/\s+/g, ' ')
	}

	/**
	 * 初始化插件
	 * @param {Object} options - 插件配置选项
	 */
	init(options = {}) {
		// 合并配置
		this.options = { ...this.options, ...options }

		// 监听点击事件
		document.addEventListener('click', this.handleClick, true)

		// 监听触摸事件（移动端）
		document.addEventListener('touchstart', this.handleClick, true)
	}

	/**
	 * 销毁插件，清理事件监听
	 */
	destroy() {
		document.removeEventListener('click', this.handleClick, true)
		document.removeEventListener('touchstart', this.handleClick, true)
	}
}

export default ClickPlugin
