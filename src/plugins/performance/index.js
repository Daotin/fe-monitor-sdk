/**
 * 性能监控模块入口文件
 * 导出所有性能监控插件
 */

import PageLoadPlugin from './page-load.js';
import ResourceLoadPlugin from './resource-load.js';
import FirstPaintPlugin from './first-paint.js';
import FirstContentfulPaintPlugin from './first-contentful-paint.js';
import LargestContentfulPaintPlugin from './largest-contentful-paint.js';

// 导出所有性能监控插件
export {
  PageLoadPlugin,
  ResourceLoadPlugin,
  FirstPaintPlugin,
  FirstContentfulPaintPlugin,
  LargestContentfulPaintPlugin
};
