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
    this.monitor = monitor;
    this.name = 'frameworkError';
  }

  /**
   * 初始化 Vue 错误处理
   */
  setupVueErrorHandler() {
    // 检查全局 Vue 是否存在
    if (window.Vue) {
      const Vue = window.Vue;
      const monitor = this.monitor;
      
      // Vue 2.x
      if (Vue.config) {
        const originalErrorHandler = Vue.config.errorHandler;
        
        Vue.config.errorHandler = function(error, vm, info) {
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
          });
          
          // 调用原始错误处理器
          if (originalErrorHandler) {
            originalErrorHandler.call(this, error, vm, info);
          } else {
            console.error(error);
          }
        };
      }
      
      // Vue 3.x
      if (Vue.createApp) {
        const originalCreateApp = Vue.createApp;
        
        Vue.createApp = function(...args) {
          const app = originalCreateApp.apply(this, args);
          const originalErrorHandler = app.config.errorHandler;
          
          app.config.errorHandler = function(error, instance, info) {
            // 报告错误
            monitor.send({
              type: 'error',
              subType: 'vue',
              message: error.message,
              stack: error.stack,
              level: 'error',
              component: instance ? instance.type.name || 'anonymous' : 'unknown',
              info: info,
              startTime: performance.now(),
            });
            
            // 调用原始错误处理器
            if (originalErrorHandler) {
              originalErrorHandler.call(this, error, instance, info);
            } else {
              console.error(error);
            }
          };
          
          return app;
        };
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
        });
      };
      
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
      `);
    }
  }

  /**
   * 初始化插件
   */
  init() {
    // 设置 Vue 错误处理
    this.setupVueErrorHandler();
    
    // 设置 React 错误处理
    this.setupReactErrorHandler();
  }

  /**
   * 销毁插件
   */
  destroy() {
    // 清理全局方法
    if (window.__monitorReportReactError) {
      delete window.__monitorReportReactError;
    }
    
    // 注意：Vue 的错误处理器无法轻易恢复，因为我们无法保存所有可能的 Vue 实例
  }
}

export default FrameworkErrorPlugin;
