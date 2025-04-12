/**
 * 页面浏览量（Page View）监控插件
 * 用于收集页面浏览量数据
 */

import { generateUniqueId, getCurrentPageUrl } from '../../utils/index.js'

class PVPlugin {
	/**
	 * 构造函数
	 * @param {Object} monitor - Monitor 实例
	 */
	constructor(monitor) {
		this.monitor = monitor
		this.name = 'pv'
		this.pageUrl = ''
		this.referrer = ''
	}

	/**
	 * 记录页面浏览量
	 */
	recordPV = () => {
		// 获取当前页面URL和来源页面
		this.pageUrl = getCurrentPageUrl()
		this.referrer = document.referrer

		// 发送PV数据
		this.monitor.send({
			type: 'behavior',
			subType: 'pv',
			pageUrl: this.pageUrl,
			referrer: this.referrer,
			uuid: generateUniqueId(),
			startTime: performance.now(),
		})
	}

	/**
	 * 初始化插件
	 */
	init() {
		// 页面加载完成后记录PV
		if (document.readyState === 'complete') {
			this.recordPV()
		} else {
			window.addEventListener('load', this.recordPV)
		}

		// 监听页面显示事件，处理从浏览器缓存加载的情况
		// 在网页的 文档被加载并显示到浏览器窗口中时触发，即无论是首次加载页面，还是从浏览器的缓存中重新加载页面（比如使用前进/后退按钮导航）时，都会触发这个事件。
		window.addEventListener('pageshow', event => {
			// 如果是从缓存加载的页面，重新记录PV
			if (event.persisted) {
				this.recordPV()
			}
		})
	}

	/**
	 * 销毁插件，清理事件监听
	 */
	destroy() {
		window.removeEventListener('load', this.recordPV)
		window.removeEventListener('pageshow', this.recordPV)
	}
}

export default PVPlugin
