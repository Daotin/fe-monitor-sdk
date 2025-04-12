# 前端监控 SDK

一个轻量级、模块化的前端监控 SDK，用于跟踪错误、性能和用户行为。

## 功能特点

- 核心监控框架，采用插件化架构
- 错误监控
  - JS 错误捕获
  - 资源加载错误
  - API 请求错误
  - 框架特定错误
- 性能监控
  - Web Vitals 指标（FP、FCP、LCP 等）
  - 资源加载性能
  - 首屏加载时间
  - 白屏检测
  - 长任务监控
- 用户行为监控
  - 页面访问（PV）
  - 独立访客（UV）
  - 点击行为
  - 页面切换
  - 用户行为栈记录
  - rrweb 页面录屏
- 灵活的数据上报策略，支持多种上报方式和失败重试
- 支持数据采样
- 高度可定制的配置选项

## 安装

```bash
npm install fe-monitor-sdk
```

或使用 yarn：

```bash
yarn add fe-monitor-sdk
```

## 基本用法

### ES Module 方式

```javascript
import Monitor from 'fe-monitor-sdk'

const monitor = new Monitor({
	appId: 'your-app-id',
	reportUrl: 'https://your-server.com/report',
	plugins: ['jsError', 'resourceError', 'pv', 'rrweb', 'behaviorStack'],
	sampling: 1, // 100% 采样率
	pluginsConfig: {
		// rrweb 插件配置
		rrweb: {
			recordMode: 'error', // 仅在错误发生时上报录屏
			maxRecordingTime: 10000, // 最大录制时长(毫秒)
			maskAllInputs: true, // 遮罩所有输入框内容
		},
		// 行为栈插件配置
		behaviorStack: {
			maxStackSize: 30, // 行为栈最大长度
			reportWithError: true, // 在错误发生时上报行为栈
		},
	},
})

monitor.init()

// 手动上报错误
try {
	// 可能抛出异常的代码
} catch (error) {
	monitor.reportError(error, {
		context: 'login-flow',
		userId: 'user-123',
	})
}

// 自定义事件跟踪
monitor.reportEvent('button_click', {
	buttonId: 'submit-btn',
	page: 'checkout',
})

// 设置用户信息
monitor.setUser('user-123', {
	role: 'admin',
	plan: 'premium',
})
```

### Script 标签方式 (UMD)

```html
<script src="https://cdn.example.com/fe-monitor-sdk.min.js"></script>
<script>
	var monitor = new MonitorSDK({
		appId: 'your-app-id',
		reportUrl: 'https://your-server.com/report',
		plugins: ['jsError', 'pv', 'rrweb'],
		pluginsConfig: {
			rrweb: {
				recordMode: 'error',
			},
		},
	})

	monitor.init()
</script>
```

## 配置选项

### 核心配置

| 选项             | 类型   | 默认值 | 描述                                 |
| ---------------- | ------ | ------ | ------------------------------------ |
| `appId`          | string | (必填) | 应用标识符                           |
| `reportUrl`      | string | (必填) | 数据上报的 URL                       |
| `userId`         | string | null   | 当前用户标识符                       |
| `sampling`       | number | 1      | 采样率 (0-1)                         |
| `plugins`        | array  | []     | 要启用的插件列表                     |
| `maxQueueSize`   | number | 10     | 自动发送前的最大队列大小             |
| `reportInterval` | number | 0      | 定时上报间隔(毫秒)，0 表示不定时上报 |
| `pluginsConfig`  | object | {}     | 各插件的配置对象                     |

### 插件配置

#### rrweb 录屏插件配置

```javascript
pluginsConfig: {
  rrweb: {
    recordMode: 'error', // 'error'(仅错误时上报) | 'always'(始终上报)
    maxRecordingTime: 10000, // 最大录制时长(毫秒)
    maxEvents: 100, // 最大事件数量
    errorTriggerTypes: ['error'], // 触发录屏上报的错误类型
    errorTriggerLevels: ['error'], // 触发录屏上报的错误级别
    blockClass: 'rr-block', // 不录制的元素类名
    ignoreClass: 'rr-ignore', // 不录制内容的元素类名
    maskAllInputs: true, // 是否遮罩所有输入框内容
  }
}
```

#### 行为栈插件配置

```javascript
pluginsConfig: {
  behaviorStack: {
    maxStackSize: 30, // 行为栈最大长度
    includeTypes: ['click', 'pageChange', 'http', 'error', 'custom'], // 要记录的行为类型
    debounceTime: 300, // 防抖时间(毫秒)
    reportWithError: true, // 是否在错误发生时上报行为栈
    reportInterval: 0, // 定时上报间隔(毫秒)，0表示不定时上报
    maskSensitiveData: true, // 是否遮罩敏感数据
    sensitiveKeys: ['password', 'token', 'credit', 'card'], // 敏感数据关键词
  }
}
```

## API 参考

### 核心方法

- `monitor.init()` - 初始化监控 SDK
- `monitor.reportError(error, extraInfo)` - 上报错误
- `monitor.reportEvent(eventName, eventData)` - 上报自定义事件
- `monitor.setUser(userId, userInfo)` - 设置用户信息
- `monitor.on(eventType, listener)` - 监听特定类型的事件
- `monitor.off(eventType, listener)` - 移除事件监听器
- `monitor.flushQueue()` - 立即发送队列中的数据
- `monitor.destroy()` - 清理并销毁监控实例

### 事件类型

可以使用 `monitor.on()` 方法监听以下事件类型：

- `error` - 错误事件
- `performance` - 性能事件
- `behavior` - 用户行为事件
- `custom_event` - 自定义事件

## 可用插件列表

### 错误监控插件

- `jsError` - JavaScript 错误
- `resourceError` - 资源加载错误
- `httpError` - HTTP 请求错误
- `frameworkError` - 框架特定错误

### 性能监控插件

- `pageLoad` - 页面加载性能
- `resourceLoad` - 资源加载性能
- `firstPaint` - 首次绘制
- `firstContentfulPaint` - 首次内容绘制
- `largestContentfulPaint` - 最大内容绘制
- `firstScreen` - 首屏加载时间
- `whiteScreen` - 白屏检测
- `longTask` - 长任务监控

### 用户行为监控插件

- `click` - 点击行为
- `pageChange` - 页面切换
- `pv` - 页面访问
- `uv` - 独立访客
- `rrweb` - 页面录屏
- `behaviorStack` - 用户行为栈

## 数据上报格式

上报数据的基本格式如下：

```javascript
{
  "projectKey": "string", // 项目标识
  "dataType": "error | performance | behavior | pv | recording | behaviorStack", // 数据类型
  "payload": {
    // 根据 dataType 不同，包含具体的数据结构
  }
}
```

## 更多使用示例

### 错误监控示例

```javascript
import Monitor from 'fe-monitor-sdk'

// 创建一个新的 Monitor 实例，启用错误监控插件
const monitor = new Monitor({
	appId: 'example-app',
	reportUrl: 'https://example.com/api/monitor',
	plugins: ['jsError', 'resourceError', 'httpError'], // 启用错误监控插件
	sampling: 1, // 100% 采样
})

// 初始化监控
monitor.init()

// 示例: 手动触发 JS 错误
function triggerJSError() {
	try {
		// 故意引发错误
		const obj = null
		obj.nonExistentMethod()
	} catch (error) {
		// 错误会被 jsError 插件自动捕获，也可以手动上报
		monitor.reportError(error, {
			context: '手动触发的错误',
			importance: 'high',
		})
	}
}
```

### 性能监控示例

```javascript
import Monitor from 'fe-monitor-sdk'

// 创建一个新的 Monitor 实例，启用性能监控插件
const monitor = new Monitor({
	appId: 'example-app',
	reportUrl: 'https://example.com/api/monitor',
	plugins: [
		'pageLoad',
		'resourceLoad',
		'firstPaint',
		'firstContentfulPaint',
		'largestContentfulPaint',
		'firstScreen',
		'longTask',
	],
})

// 初始化监控
monitor.init()

// 监听性能事件
monitor.on('performance', data => {
	console.log('捕获到性能数据:', data)
})
```

### 自定义事件监听

```javascript
import Monitor from 'fe-monitor-sdk'

const monitor = new Monitor({
	appId: 'example-app',
	reportUrl: 'https://example.com/api/monitor',
	plugins: ['jsError', 'rrweb', 'behaviorStack'],
})

monitor.init()

// 监听错误事件
monitor.on('error', errorData => {
	console.log('捕获到错误:', errorData)
	// 可以在这里执行自定义逻辑
})

// 监听行为事件
monitor.on('behavior', behaviorData => {
	console.log('捕获到用户行为:', behaviorData)
})

// 监听特定子类型的事件
monitor.on('error:jsError', jsErrorData => {
	console.log('捕获到 JS 错误:', jsErrorData)
})
```

## 项目结构

```
fe-monitor-sdk/
├── src/                  # 源代码目录
│   ├── core/             # 核心功能
│   │   ├── monitor.js    # Monitor 核心类
│   │   └── index.js      # 核心模块导出
│   ├── plugins/          # 插件目录
│   │   ├── error/        # 错误监控插件
│   │   ├── performance/  # 性能监控插件
│   │   ├── behavior/     # 用户行为监控插件
│   │   └── index.js      # 插件注册/导出
│   ├── transport/        # 数据传输模块
│   │   ├── reporter.js   # 数据上报实现
│   │   └── index.js      # 传输模块导出
│   ├── utils/            # 工具函数
│   └── index.js          # SDK 入口文件
├── dist/                 # 构建输出目录
├── examples/             # 示例代码
├── docs/                 # 文档
├── rollup.config.js      # Rollup 构建配置
└── package.json          # 项目配置
```

## 从源码构建

```bash
# 安装依赖
npm install

# 构建 SDK
npm run build
```

构建后的文件将输出到 `dist` 目录，包含以下格式：

- ESM 格式: `dist/index.esm.js`
- UMD 格式: `dist/index.umd.js`
- IIFE 格式: `dist/index.iife.js`
- 压缩版本: `dist/index.esm.min.js`，`dist/index.umd.min.js` 和 `dist/index.iife.min.js`
- Gzip 压缩版本: `dist/index.esm.min.js.gz`,`dist/index.umd.min.js.gz` 和 `dist/index.iife.min.js.gz`（压缩率约为 88%）

## 浏览器兼容性

该 SDK 支持所有现代浏览器，包括：

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 16+

对于旧版浏览器，可能需要添加相应的 polyfill。

## 贡献指南

欢迎对本项目进行贡献！以下是参与开发的步骤：

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建一个 Pull Request

### 开发指南

- 添加新插件时，请在 `src/plugins` 目录下创建相应的文件夹和文件
- 所有插件应该实现 `init` 和 `destroy` 方法
- 添加新插件后，请在 `src/plugins/index.js` 中注册该插件
- 添加新功能时，请同时更新文档和添加相应的测试

## 许可证

MIT
