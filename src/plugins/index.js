/**
 * 插件注册表
 * 用于注册和管理监控 SDK 的插件
 */

// 导入错误监控插件
import { JSErrorPlugin, ResourceErrorPlugin, HttpErrorPlugin, FrameworkErrorPlugin } from './error/index.js';

// 插件注册表对象
const PluginRegistry = {
  // 错误监控插件
  jsError: JSErrorPlugin,
  resourceError: ResourceErrorPlugin,
  httpError: HttpErrorPlugin,
  frameworkError: FrameworkErrorPlugin,

  // 其他插件将在这里添加
};

/**
 * 根据名称获取插件构造函数
 * @param {string} name - 插件名称
 * @returns {Function|undefined} - 插件构造函数，如果未找到则返回 undefined
 */
export function getPlugin(name) {
  return PluginRegistry[name];
}

/**
 * 获取所有已注册的插件
 * @returns {Object} - 包含所有已注册插件的对象
 */
export function getAllPlugins() {
  return { ...PluginRegistry };
}

/**
 * 初始化所有插件
 * @param {Object} monitor - Monitor 实例
 * @returns {Object} - 包含所有已初始化插件实例的对象
 */
export function initPlugins(monitor) {
  const plugins = {};

  // 获取配置中启用的插件
  const enabledPlugins = monitor.config.plugins || [];

  // 初始化每个启用的插件
  enabledPlugins.forEach((pluginName) => {
    const PluginConstructor = PluginRegistry[pluginName];

    if (PluginConstructor) {
      try {
        // 创建插件实例
        const plugin = new PluginConstructor(monitor);

        // 初始化插件
        if (typeof plugin.init === 'function') {
          plugin.init();
        }

        // 保存插件实例
        plugins[pluginName] = plugin;
      } catch (error) {
        console.error(`初始化插件 ${pluginName} 失败:`, error);
      }
    } else {
      console.warn(`未找到插件: ${pluginName}`);
    }
  });

  return plugins;
}

export default PluginRegistry;
