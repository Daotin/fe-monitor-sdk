/**
 * 错误监控模块入口文件
 * 导出所有错误监控插件
 */

import JSErrorPlugin from './js-error.js';
import ResourceErrorPlugin from './resource-error.js';
import HttpErrorPlugin from './http-error.js';
import FrameworkErrorPlugin from './framework-error.js';

// 导出所有错误监控插件
export { JSErrorPlugin, ResourceErrorPlugin, HttpErrorPlugin, FrameworkErrorPlugin };
