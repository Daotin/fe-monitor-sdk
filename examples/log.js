// 重写控制台方法以在页面上显示日志
const consoleOutput = document.getElementById('console-output');
const clearConsoleBtn = document.getElementById('clear-console-btn');

// 修改清空控制台功能
clearConsoleBtn.addEventListener('click', () => {
  // 获取所有日志元素并删除
  const logs = consoleOutput.getElementsByClassName('log');
  while (logs.length > 0) {
    logs[0].remove();
  }
});

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

function addLogToPage(level, args) {
  const logElement = document.createElement('div');
  logElement.className = `log ${level}`;
  logElement.textContent = `[${level}] ${Array.from(args).join(' ')}`;
  consoleOutput.appendChild(logElement);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

console.log = function (...args) {
  addLogToPage('log', args);
  originalConsole.log.apply(console, args);
};

console.info = function (...args) {
  addLogToPage('info', args);
  originalConsole.info.apply(console, args);
};

console.warn = function (...args) {
  addLogToPage('warning', args);
  originalConsole.warn.apply(console, args);
};

console.error = function (...args) {
  addLogToPage('error', args);
  originalConsole.error.apply(console, args);
};
