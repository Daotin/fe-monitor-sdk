/**
 * 框架错误监控插件
 * 用于捕获 Vue、React 等前端框架的错误
 */

class FrameworkErrorPlugin {
	/**
	 * 构造函数
	 * @param {Object} monitor - Monitor 实例
	 */
	constructor(monitor) {
		this.monitor = monitor
		this.name = 'frameworkError'
	}

	/**
	 * 初始化 Vue 错误处理
	 * @param {Object} options - Vue相关选项
	 */
	setupVueErrorHandler(options = {}) {
		const monitor = this.monitor

		// 如果没有传入Vue实例或应用实例，则尝试从全局获取

		if (!options.Vue) {
			console.warn('Vue实例未找到，无法设置Vue错误处理')
			return
		}

		if (!options.version) {
			console.warn('Vue版本version未找到，无法设置Vue错误处理')
			return
		}

		// 处理Vue 3.x应用实例
		if (options.version == 3) {
			console.log('设置Vue 3.x应用实例的错误处理器')
			const app = options.Vue
			app.config.errorHandler = function (error, instance, info) {
				console.log(error)
				// 报告错误
				monitor.send({
					type: 'error',
					subType: 'vue',
					message: error.message,
					stack: error.stack,
					level: 'error',
					component: instance?.type ? instance.type.name || instance.type.__name || 'anonymous' : 'unknown',
					info: info,
					startTime: performance.now(),
				})
			}

			return
		}

		// Vue 2.x
		if (options.version == 2) {
			console.log('设置Vue 2.x应用实例的错误处理器')
			const Vue = options.Vue
			const originalErrorHandler = Vue.config.errorHandler

			Vue.config.errorHandler = function (error, vm, info) {
				// 报告错误
				monitor.send({
					type: 'error',
					subType: 'vue',
					message: error.message,
					stack: error.stack,
					level: 'error',
					component: vm ? vm.$options.name || vm.$options._componentTag || 'anonymous' : 'unknown',
					info: info,
					startTime: performance.now(),
				})

				// 调用原始错误处理器
				if (originalErrorHandler) {
					originalErrorHandler.call(this, error, vm, info)
				} else {
					console.error(error)
				}
			}
		}
	}

	/**
	 * 初始化 React 错误处理
	 * 注意：React 需要使用 ErrorBoundary 组件捕获错误
	 * 这里提供一个辅助方法，用户需要在自己的代码中使用
	 */
	setupReactErrorHandler() {
		// 检查全局 React 是否存在
		if (window.React) {
			// 将 reportError 方法暴露给全局，以便 React 错误边界可以调用
			window.__monitorReportReactError = (error, errorInfo) => {
				this.monitor.send({
					type: 'error',
					subType: 'react',
					message: error.message,
					stack: error.stack,
					level: 'error',
					componentStack: errorInfo ? errorInfo.componentStack : null,
					startTime: performance.now(),
				})
			}

			// 提供使用说明
			console.info(`
        React 错误监控已启用。请在您的 React 应用中添加错误边界组件：
        
        class ErrorBoundary extends React.Component {
          constructor(props) {
            super(props);
            this.state = { hasError: false };
          }
          
          static getDerivedStateFromError(error) {
            return { hasError: true };
          }
          
          componentDidCatch(error, errorInfo) {
            // 报告错误
            if (window.__monitorReportReactError) {
              window.__monitorReportReactError(error, errorInfo);
            }
          }
          
          render() {
            if (this.state.hasError) {
              return <h1>出错了</h1>;
            }
            return this.props.children;
          }
        }
        
        然后在您的应用中使用：
        <ErrorBoundary>
          <YourComponent />
        </ErrorBoundary>
      `)
		}
	}

	/**
	 * 初始化插件
	 * @param {Object} options
	 *  Vue: vue实例
	 *  version: vue版本
	 */
	init(options = {}) {
		console.log(options)
		// 设置 Vue 错误处理
		this.setupVueErrorHandler(options)

		// 设置 React 错误处理
		// this.setupReactErrorHandler(options)
	}

	/**
	 * 销毁插件
	 */
	destroy() {
		// 清理全局方法
		if (window.__monitorReportReactError) {
			delete window.__monitorReportReactError
		}

		// 注意：Vue 的错误处理器无法轻易恢复，因为我们无法保存所有可能的 Vue 实例
	}
}

export default FrameworkErrorPlugin
