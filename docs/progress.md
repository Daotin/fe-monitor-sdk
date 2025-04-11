# 前端监控 SDK 开发进度

## 2023 年 10 月

### 基础框架和错误监控

- [x] 搭建项目基础结构

  - [x] 创建核心监控类 (Monitor)
  - [x] 实现插件架构
  - [x] 实现数据上报模块
  - [x] 实现工具函数模块

- [x] 错误监控功能

  - [x] JavaScript 错误捕获 (window.onerror 替换为 handleError 方法)
  - [x] Promise 未处理拒绝捕获
  - [x] 资源加载错误捕获
  - [x] HTTP 请求错误捕获

- [x] 示例代码
  - [x] 错误监控示例

## 2023 年 11 月

### 性能监控功能

- [x] 性能监控功能

  - [x] 页面加载性能指标收集 (Web Vitals)
    - [x] First Paint (FP)
    - [x] First Contentful Paint (FCP)
    - [x] Largest Contentful Paint (LCP)
  - [x] 资源加载性能收集
  - [x] 页面加载时间计算

- [x] 示例代码
  - [x] 性能监控示例

### 性能监控功能扩展

- [x] 性能监控功能扩展

  - [x] 首屏加载时间计算
  - [x] 白屏检测
  - [x] long task 监控

## 下一步计划

- [ ] 用户行为监控

  - [ ] PV/UV 统计
  - [ ] 点击行为收集
  - [ ] 页面跳转记录

- [ ] 扩展功能
  - [ ] 数据采样机制优化
  - [ ] 离线缓存与重发
  - [ ] 数据压缩
  - [ ] sourcemap 错误还原
  - [ ] rrweb 录屏
  - [ ] 用户行为栈
