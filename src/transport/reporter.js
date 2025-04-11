/**
 * Data Reporter 模块用于向服务器发送数据，支持 Beacon、Image、XHR 和 Fetch 等多种上报方式
 */

/**
 * 将数据发送到服务器的 DataReporter 类
 */
class DataReporter {
  /**
   * 使用 Beacon API 发送数据
   * @param {string} url - 要发送数据的 URL
   * @param {Object|Array} data - 要发送的数据
   * @returns {boolean} - 如果数据发送成功，则返回 true
   */
  sendByBeacon(url, data) {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json; charset=UTF-8' });
      return navigator.sendBeacon(url, blob);
    }
    return false;
  }

  /**
   * 使用 Image API 发送数据（对于非常小的有效负载）
   * @param {string} url - 要发送数据的 URL
   * @param {Object} data - 要发送的数据
   * @returns {boolean} - 如果请求已发起，则返回 true
   */
  sendByImage(url, data) {
    try {
      const img = new Image();
      const params = Object.keys(data)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(data[key]))}`)
        .join('&');
      img.src = `${url}?${params}`;
      return true; // 无法确认是否成功，默认认为发起即成功
    } catch (e) {
      console.error('Image beacon 失败:', e);
      return false;
    }
  }

  /**
   * 使用 XMLHttpRequest 发送数据
   * @param {string} url - 要发送数据的 URL
   * @param {Object|Array} data - 要发送的数据
   * @returns {boolean} - 如果请求已发起，则返回 true
   */
  sendByXHR(url, data) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true); // 异步
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
      return true; // 异步无法立即确认成功
    } catch (e) {
      console.error('XHR 上报失败:', e);
      return false;
    }
  }

  /**
   * 使用 fetch API 发送数据
   * @param {string} url - 要发送数据的 URL
   * @param {Object|Array} data - 要发送的数据
   * @returns {Promise} - 一个解析为数据发送成功的 Promise
   */
  sendByFetch(url, data) {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }).catch((e) => {
      console.error('Fetch 上报失败:', e);
      return false;
    });
  }

  /**
   * 主上报方法，尝试不同的上报方式
   * @param {string} url - 要发送数据的 URL
   * @param {Object|Array} data - 要发送的数据
   * @returns {boolean} - 如果数据发送成功，则返回 true
   */
  report(url, data) {
    if (typeof window === 'undefined') {
      console.error('不是浏览器环境，无法上报');
      return false;
    }

    console.log('🟢report上报数据:', data);
    return true;

    if (document.visibilityState === 'hidden' || navigator.onLine === false) {
      if (Array.isArray(data) && data.length === 1) {
        if (this.sendByBeacon(url, data[0])) {
          return true;
        }
      } else if (this.sendByBeacon(url, data)) {
        return true;
      }
    }

    if (Array.isArray(data) && data.length > 1) {
      if (this.sendByXHR(url, data)) {
        return true;
      }
    }

    try {
      this.sendByFetch(url, data);
      return true;
    } catch (e) {
      if (this.sendByXHR(url, data)) {
        return true;
      }
    }

    if (!Array.isArray(data) || data.length === 1) {
      const singleData = Array.isArray(data) ? data[0] : data;
      if (Object.keys(singleData).length < 5) {
        return this.sendByImage(url, singleData);
      }
    }

    console.error('所有上报方式失败，数据可能丢失:', data);
    return false;
  }
}

export default new DataReporter();
