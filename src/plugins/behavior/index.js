/**
 * 用户行为监控模块入口文件
 * 导出所有用户行为监控插件
 */

import ClickPlugin from './click.js'
import PageChangePlugin from './page-change.js'
import PVPlugin from './pv.js'
import UVPlugin from './uv.js'
// import RRWebPlugin from './rrweb.js'
import BehaviorStackPlugin from './behavior-stack.js'

// 导出所有用户行为监控插件
export {
	ClickPlugin,
	PageChangePlugin,
	PVPlugin,
	UVPlugin,
	// RRWebPlugin,
	BehaviorStackPlugin,
}
