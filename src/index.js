/**
 * 前端监控 SDK 的主入口文件
 */

import Monitor from './core/index.js';
import DataReporter from './transport/index.js';
import * as Utils from './utils/index.js';
import { getPlugin, getAllPlugins } from './plugins/index.js';

const VERSION = '0.1.0';

export { Monitor, DataReporter, Utils, getPlugin, getAllPlugins, VERSION };
export default Monitor;
