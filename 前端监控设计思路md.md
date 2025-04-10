> - [一文摸清前端监控实践要点](https://juejin.cn/column/7097156230489047047)
> - [从 0 到 1 搭建前端监控平台，面试必备的亮点项目](https://github.com/xy-sea/blog/blob/main/markdown/%E4%BB%8E0%E5%88%B01%E6%90%AD%E5%BB%BA%E5%89%8D%E7%AB%AF%E7%9B%91%E6%8E%A7%E5%B9%B3%E5%8F%B0%EF%BC%8C%E9%9D%A2%E8%AF%95%E5%BF%85%E5%A4%87%E7%9A%84%E4%BA%AE%E7%82%B9%E9%A1%B9%E7%9B%AE.md)

## 为什么要做前端监控平台？

痛点：

很多时候，无法复现的 bug，是最花时间定位的，但是因为不知道用户的操作路径，有的时候很难复现。

这个时候，就需要前端监控了，记录项目的错误，并将错误还原出来，这是监控平台要解决的痛点之一

除此之外，监控平台还可以：

- 错误预警：有些没有发现的错误，可以及早暴露及早解决，而不让用户发现
- 错误分析：通过分析错误，解决一类的问题，避免相同的错误再次发生
- 性能分析：采集页面关键数据，为页面优化提供方向
- 提供决策：通过采集的 pv，uv，性能等数据，为后续需求方向等提供决策支撑

## 方案选择

> 为什么不直接用 sentry 私有化部署，而选择自研前端监控？

相比 sentry，自研监控平台的优势在于：

1. 可以将公司的 SDK 统一成一个，包括但不限于：监控 SDK、埋点 SDK、录屏 SDK、广告 SDK 等
2. 监控自定义的个性化指标：如 long task、memory 页面内存、首屏加载时间等。过多的长任务会造成页面丢帧、卡顿；过大的内存可能会造成低端机器的卡死、崩溃
3. 统计资源缓存率，来判断项目的缓存策略是否合理，提升缓存率可以减少服务器压力，也可以提升页面的打开速度
4. 提供了 **采样对比+ 轮询修正机制** 的白屏检测方案，用于检测页面是否一直处于白屏状态，让开发者知道页面什么时候白了，具体实现见：[前端白屏的检测方案，解决你的线上之忧](https://juejin.cn/post/7176206226903007292)

**自研核心思路：**

- 通过采集错误信息+sourcemap 错误还原
- 通过“rrweb 录屏”错误的操作过程，进一步明确错误的来源
- 因为录制时长有限，所以结合“采集用户行为”来分析用户的操作，帮助复现 bug

通过 `定位源码`、`播放录屏`、`记录用户行为` 三板斧，解决了复现 bug 的痛点。

### 包括哪些部分？

自研 SDK 包括：

![](https://cdn.nlark.com/yuque/0/2025/png/149700/1743658379135-f8f60573-829b-4bda-b395-30165e4206fb.png)

## 数据采集

### 错误数据采集

包括：

- js 错误采集，比如语法错误，运行时错误，逻辑错误
- 静态资源加载错误
- Vue react 框架错误
- 接口错误
- 框架错误

1、js 错误：

> try/catch: 只能捕获代码常规的运行错误，语法错误和异步错误不能捕获到

- window.onerror 可以捕获常规错误、异步错误。

> window.onerror 缺点：但是不能捕获 语法错误，不能捕获 图片，script，css 等资源加载的错误

- window.addEventListener('error') 可以捕获。

> 缺点：不能捕获 Promise，async await 等异步方法内部的报错，不能捕获 new Image 错误（比较少用）

- 使用 window.addEventListener('unhandledrejection')

2、资源错误

window.addEventListener('error')

3、Vue react 框架错误

> Vue 项目中，window.onerror 和 error 事件不能捕获到常规的代码错误

- 对于 vue：
  - 通过 `Vue.config.errorHander` 来捕获常规代码错误
  - 其他的错误同上处理
- 对于 React：
  - 从 react16 开始，官方提供了 ErrorBoundary 错误边界的功能，被该组件包裹的子组件，render 函数报错时会触发离当前组件最近父组件的 ErrorBoundary
  - 生产环境，一旦被 ErrorBoundary 捕获的错误，也不会触发全局的 window.onerror 和 error 事件

4、 跨域错误

问题：error 事件只会监测到一个 script error 的异常，无法获取脚本里面详细的错误信息

解决：

- 前端 script 加 crossorigin，后端配置 Access-Control-Allow-Origin 请求头
- 如果不能修改服务端的请求头，可以考虑通过使用 try/catch 包裹调用方法，将错误抛出

5、 接口错误

```javascript
/**
 * 重写指定的方法
 * @param { object } source 重写的对象
 * @param { string } name 重写的属性
 * @param { function } fn 拦截的函数
 */
function replaceAop(source, name, fn) {
  if (source === undefined) return;
  if (name in source) {
    var original = source[name];
    var wrapped = fn(original);
    if (typeof wrapped === 'function') {
      source[name] = wrapped;
    }
  }
}
```

- 利用 AOP 切片编程重写 xhr 的 open，send 方法：获取接口信息，包括请求状态（status 和 responseText，错误的状态和信息），开始时间，请求时长
- 利用 AOP 切片编程重写 fetch

### 性能数据采集

谈到性能数据采集，就会提及加载过程模型图：

![](https://cdn.nlark.com/yuque/0/2025/png/149700/1743658070139-3db15066-e822-4ce5-8759-8929d5f3b8c4.png)

以 Vue 等 SPA 页面来说，页面的加载过程大致是这样的：

![](https://cdn.nlark.com/yuque/0/2025/png/149700/1743658105602-8918382f-c300-43f5-a3ff-8e3c9a684432.png)

这个阶段主要包括：

- 初始准备阶段：dns 解析，tcp 链接等等，
- 请求发送接收阶段，包括请求开始发送，收到响应
- 页面渲染阶段：包括 DomContentLoad，以及 FP FCP LCP 等指标

1、 主要采集数据： FP FCP LCP ...

如何采集？

- Performance API 提供浏览器内置的 性能测量 API，适用于更细粒度的前端优化。

可以通过 `window.performance.timing` 来获取加载过程模型中各个阶段的耗时数据：

```javascript
// window.performance.timing 各字段说明
{
  navigationStart, // 同一个浏览器上下文中，上一个文档结束时的时间戳。如果没有上一个文档，这个值会和 fetchStart 相同。
    unloadEventStart, // 上一个文档 unload 事件触发时的时间戳。如果没有上一个文档，为 0。
    unloadEventEnd, // 上一个文档 unload 事件结束时的时间戳。如果没有上一个文档，为 0。
    redirectStart, // 表示第一个 http 重定向开始时的时间戳。如果没有重定向或者有一个非同源的重定向，为 0。
    redirectEnd, // 表示最后一个 http 重定向结束时的时间戳。如果没有重定向或者有一个非同源的重定向，为 0。
    fetchStart, // 表示浏览器准备好使用 http 请求来获取文档的时间戳。这个时间点会在检查任何缓存之前。
    domainLookupStart, // 域名查询开始的时间戳。如果使用了持久连接或者本地有缓存，这个值会和 fetchStart 相同。
    domainLookupEnd, // 域名查询结束的时间戳。如果使用了持久连接或者本地有缓存，这个值会和 fetchStart 相同。
    connectStart, // http 请求向服务器发送连接请求时的时间戳。如果使用了持久连接，这个值会和 fetchStart 相同。
    connectEnd, // 浏览器和服务器之前建立连接的时间戳，所有握手和认证过程全部结束。如果使用了持久连接，这个值会和 fetchStart 相同。
    secureConnectionStart, // 浏览器与服务器开始安全链接的握手时的时间戳。如果当前网页不要求安全连接，返回 0。
    requestStart, // 浏览器向服务器发起 http 请求(或者读取本地缓存)时的时间戳，即获取 html 文档。
    responseStart, // 浏览器从服务器接收到第一个字节时的时间戳。
    responseEnd, // 浏览器从服务器接受到最后一个字节时的时间戳。
    domLoading, // dom 结构开始解析的时间戳，document.readyState 的值为 loading。
    domInteractive, // dom 结构解析结束，开始加载内嵌资源的时间戳，document.readyState 的状态为 interactive。
    domContentLoadedEventStart, // DOMContentLoaded 事件触发时的时间戳，所有需要执行的脚本执行完毕。
    domContentLoadedEventEnd, // DOMContentLoaded 事件结束时的时间戳
    domComplete, // dom 文档完成解析的时间戳， document.readyState 的值为 complete。
    loadEventStart, // load 事件触发的时间。
    loadEventEnd; // load 时间结束时的时间。
}
```

> 不过，performance API 以及过时了，有一个新的 api 来检测性能：[PerformanceObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceObserver/PerformanceObserver)

- web-vitals 库（基于 Performance API 构建）专门用于 **监测 Core Web Vitals**（LCP、FID、CLS 等），简化性能监测和数据上报。

> web-vitals 缺点：有一定的兼容性问题。不支持 safari 浏览器，且捕获这些指标的一些 API 目前仅在基于 Chromium 的浏览器中可用，比如 CLS，INP，LCP 等

最终，我们使用[PerformanceObserver](https://developer.mozilla.org/zh-CN/docs/Web/API/PerformanceObserver/PerformanceObserver)来收集数据。

2、 静态资源采集

主要关注资源的性能数据，如加载时间、DNS 解析时间，资源缓存率等。

当页面加载完成时，通过 `observer.observe({ type: ['resource'], buffered: true })` 收集资源的加载列表。了解每个资源的加载情况。

> 还可以通过 performance.getEntriesByType('resource') 获取页面加载的资源列表。两者有啥区别？

3、个性化指标

- long task

执行时间超过 50ms 的任务，被称为 long task 长任务

```javascript
// 获取页面的长任务列表：
const entryHandler = (list) => {
  for (const long of list.getEntries()) {
    // 获取长任务详情
    console.log(long);
  }
};

let observer = new PerformanceObserver(entryHandler);
observer.observe({ entryTypes: ['longtask'] });
```

- 内存使用情况

performance.memory 可以显示此刻内存占用情况，它是一个动态值，其中：

- jsHeapSizeLimit 该属性代表的含义是：内存大小的限制。
- totalJSHeapSize 表示总内存的大小。
- usedJSHeapSize 表示可使用的内存的大小。

通常，usedJSHeapSize 不能大于 totalJSHeapSize，如果大于，有可能出现了内存泄漏

```javascript
// load事件中获取此时页面的内存大小
window.addEventListener('load', () => {
  console.log('memory', performance.memory);
});
```

- 首屏加载时间

首屏加载时间和首页加载时间不一样，首屏指的是屏幕内的 dom 渲染完成的时间

比如首页很长需要好几屏展示，这种情况下屏幕以外的元素不考虑在内

计算首屏加载时间流程：

1）利用 MutationObserver 监听 document 对象，每当 dom 变化时触发该事件

2）判断监听的 dom 是否在首屏内，如果在首屏内，将该 dom 放到指定的数组中，记录下当前 dom 变化的时间点

3）在 MutationObserver 的 callback 函数中，通过防抖函数，监听 document.readyState 状态的变化

4）当 document.readyState === 'complete'，停止定时器和 取消对 document 的监听

5）遍历存放 dom 的数组，找出最后变化节点的时间，用该时间点减去 performance.timing.navigationStart 得出首屏的加载时间

- 白屏检测

todo

### 用户行为采集

1、 页面跳转

- history 模式可以监听 popstate 事件
- hash 模式可以监听 hashchange 事件（vue 项目除外）

> vue 项目中不能通过 hashchange 事件来监听路由变化，vue-router 底层调用的是 history.pushState 和 history.replaceState，不会触发 hashchange，所以需要重写 pushState、replaceState 事件来监听路由变化

2、 页面点击事件

- PC：监听 mousedown/click 事件
- 移动端：监听 touchstart 事件

3、pv：进入页面就执行收集

4、uv： 进入系统 localStorage 存储一个唯一 user_unique_id，只有当用户是首次访问（没有存储的标识符）时，才记录 UV

5、接口调用

## 数据上报

### 上报方式

- 优先 sendBeacon（可靠，即便是页面关闭前，也能保证上报）
- 图片打点上上报（image/gif 支持跨域，使用 gif ，大小最小）
- 常规请求 xhr/fetch

### 上报内容

```javascript
{
  type: ,
	subType: 'promise',
  pageUrl: ''
}
```

### 上报时机

- requestidleCallback（优先浏览器空闲的时候）
- Promise 微任务
- setTimeout 宏任务
- beforeUnload
- 缓存批量上报

## 数据存储

### 数据上报格式

```javascript
const reportData = JSON.stringify({
  id: generateUniqueId(),
  datas,
});
```

## 数据展示

### 性能指标汇总

### 错误列表

### pv uv 统计

## 错误还原

### sourcemap

### rrweb 录屏

> 如何只录制报错时候 10s 的视频？

### 用户行为栈

## 数据监控和报警

### 报警规则

### 报警方式
