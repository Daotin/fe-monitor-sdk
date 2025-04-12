/**
 * 插件注册表
 * 用于注册和管理监控 SDK 的插件
 */

// 导入错误监控插件
import { JSErrorPlugin, ResourceErrorPlugin, HttpErrorPlugin, FrameworkErrorPlugin } from './error/index.js'

// 导入性能监控插件
import {
	PageLoadPlugin,
	ResourceLoadPlugin,
	FirstPaintPlugin,
	FirstContentfulPaintPlugin,
	LargestContentfulPaintPlugin,
	FirstScreenPlugin,
	WhiteScreenPlugin,
	LongTaskPlugin,
} from './performance/index.js'

// 导入用户行为监控插件
import {
	ClickPlugin,
	PageChangePlugin,
	PVPlugin,
	UVPlugin,
	RRWebPlugin,
	BehaviorStackPlugin,
} from './behavior/index.js'

// 插件注册表对象
const PluginRegistry = {
	// 错误监控插件
	jsError: JSErrorPlugin,
	resourceError: ResourceErrorPlugin,
	httpError: HttpErrorPlugin,
	frameworkError: FrameworkErrorPlugin,

	// 性能监控插件
	pageLoad: PageLoadPlugin,
	resourceLoad: ResourceLoadPlugin,
	firstPaint: FirstPaintPlugin,
	firstContentfulPaint: FirstContentfulPaintPlugin,
	largestContentfulPaint: LargestContentfulPaintPlugin,
	firstScreen: FirstScreenPlugin,
	whiteScreen: WhiteScreenPlugin,
	longTask: LongTaskPlugin,

	// 用户行为监控插件
	click: ClickPlugin,
	pageChange: PageChangePlugin,
	pv: PVPlugin,
	uv: UVPlugin,
	rrweb: RRWebPlugin,
	behaviorStack: BehaviorStackPlugin,

	// 其他插件将在这里添加
}

/**
 * 根据名称获取插件构造函数
 * @param {string} name - 插件名称
 * @returns {Function|undefined} - 插件构造函数，如果未找到则返回 undefined
 */
export function getPlugin(name) {
	return PluginRegistry[name]
}

/**
 * 获取所有已注册的插件
 * @returns {Object} - 包含所有已注册插件的对象
 */
export function getAllPlugins() {
	return { ...PluginRegistry }
}

/**
 * 初始化所有插件
 * @param {Object} monitor - Monitor 实例
 * @returns {Object} - 包含所有已初始化插件实例的对象
 */
export function initPlugins(monitor) {
	const plugins = {}

	// 获取配置中启用的插件
	const enabledPlugins = monitor.config.plugins || []

	// 初始化每个启用的插件
	enabledPlugins.forEach(pluginName => {
		const PluginConstructor = PluginRegistry[pluginName]

		if (PluginConstructor) {
			try {
				// 创建插件实例
				const plugin = new PluginConstructor(monitor)

				// 获取插件配置
				const pluginConfig = monitor.config.pluginsConfig && monitor.config.pluginsConfig[pluginName]

				// 初始化插件，传入插件配置
				if (typeof plugin.init === 'function') {
					plugin.init(pluginConfig)
				}

				// 保存插件实例
				plugins[pluginName] = plugin
			} catch (error) {
				console.error(`初始化插件 ${pluginName} 失败:`, error)
			}
		} else {
			console.warn(`未找到插件: ${pluginName}`)
		}
	})

	return plugins
}

export default PluginRegistry
