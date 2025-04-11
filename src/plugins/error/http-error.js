/**
 * HTTP 请求错误监控插件
 * 通过重写 XMLHttpRequest 和 fetch 来捕获 HTTP 请求错误
 */

class HttpErrorPlugin {
  /**
   * 构造函数
   * @param {Object} monitor - Monitor 实例
   */
  constructor(monitor) {
    this.monitor = monitor;
    this.name = 'httpError';
    
    // 保存原始方法
    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    this.originalXhrSend = XMLHttpRequest.prototype.send;
    this.originalFetch = window.fetch;
  }

  /**
   * 重写 XMLHttpRequest 方法
   */
  patchXMLHttpRequest() {
    const monitor = this.monitor;
    const originalOpen = this.originalXhrOpen;
    const originalSend = this.originalXhrSend;

    // 重写 open 方法
    XMLHttpRequest.prototype.open = function(...args) {
      const method = args[0];
      const url = args[1];
      
      // 保存请求信息到 xhr 对象
      this._monitorData = {
        method,
        url,
        startTime: Date.now(),
      };
      
      return originalOpen.apply(this, args);
    };

    // 重写 send 方法
    XMLHttpRequest.prototype.send = function(body) {
      if (this._monitorData) {
        // 保存请求体
        this._monitorData.body = body;
        
        // 监听 load 事件
        this.addEventListener('load', function() {
          const status = this.status;
          const duration = Date.now() - this._monitorData.startTime;
          
          // 只报告错误状态码
          if (status >= 400) {
            monitor.send({
              type: 'error',
              subType: 'http',
              method: this._monitorData.method,
              url: this._monitorData.url,
              status,
              duration,
              response: this.responseText && this.responseText.slice(0, 500), // 限制响应大小
              level: status >= 500 ? 'error' : 'warning',
              startTime: this._monitorData.startTime,
            });
          }
        });

        // 监听 error 事件
        this.addEventListener('error', function() {
          const duration = Date.now() - this._monitorData.startTime;
          
          monitor.send({
            type: 'error',
            subType: 'http',
            method: this._monitorData.method,
            url: this._monitorData.url,
            status: 0, // 网络错误通常没有状态码
            duration,
            level: 'error',
            startTime: this._monitorData.startTime,
            message: '网络请求失败',
          });
        });

        // 监听 timeout 事件
        this.addEventListener('timeout', function() {
          const duration = Date.now() - this._monitorData.startTime;
          
          monitor.send({
            type: 'error',
            subType: 'http',
            method: this._monitorData.method,
            url: this._monitorData.url,
            status: 0,
            duration,
            level: 'error',
            startTime: this._monitorData.startTime,
            message: '请求超时',
          });
        });
      }
      
      return originalSend.apply(this, arguments);
    };
  }

  /**
   * 重写 fetch 方法
   */
  patchFetch() {
    const monitor = this.monitor;
    const originalFetch = this.originalFetch;

    window.fetch = function(input, init) {
      const startTime = Date.now();
      let url = '';
      let method = 'GET';
      
      // 解析请求参数
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof Request) {
        url = input.url;
        method = input.method || 'GET';
      }
      
      if (init && init.method) {
        method = init.method;
      }

      // 调用原始 fetch 并处理结果
      return originalFetch.apply(this, arguments)
        .then(response => {
          const duration = Date.now() - startTime;
          const status = response.status;
          
          // 只报告错误状态码
          if (status >= 400) {
            // 克隆响应以避免消耗原始响应
            const clonedResponse = response.clone();
            
            // 尝试获取响应文本
            clonedResponse.text().then(text => {
              monitor.send({
                type: 'error',
                subType: 'http',
                method,
                url,
                status,
                duration,
                response: text.slice(0, 500), // 限制响应大小
                level: status >= 500 ? 'error' : 'warning',
                startTime,
              });
            }).catch(() => {
              // 如果无法获取响应文本，仍然报告错误
              monitor.send({
                type: 'error',
                subType: 'http',
                method,
                url,
                status,
                duration,
                level: status >= 500 ? 'error' : 'warning',
                startTime,
                message: '无法读取响应内容',
              });
            });
          }
          
          return response;
        })
        .catch(error => {
          const duration = Date.now() - startTime;
          
          monitor.send({
            type: 'error',
            subType: 'http',
            method,
            url,
            status: 0,
            duration,
            level: 'error',
            startTime,
            message: error.message || '网络请求失败',
          });
          
          // 重新抛出错误，不影响原有的错误处理
          throw error;
        });
    };
  }

  /**
   * 初始化插件
   */
  init() {
    this.patchXMLHttpRequest();
    this.patchFetch();
  }

  /**
   * 销毁插件，恢复原始方法
   */
  destroy() {
    // 恢复原始 XMLHttpRequest 方法
    XMLHttpRequest.prototype.open = this.originalXhrOpen;
    XMLHttpRequest.prototype.send = this.originalXhrSend;
    
    // 恢复原始 fetch 方法
    window.fetch = this.originalFetch;
  }
}

export default HttpErrorPlugin;
