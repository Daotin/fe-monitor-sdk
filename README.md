# Frontend Monitoring SDK

A lightweight, modular frontend monitoring SDK for tracking errors, performance, and user behavior.

## Features

- Core monitoring framework with plugin architecture
- Error tracking (JS errors, resource errors, API errors)
- Performance monitoring (Web Vitals, resource loading, etc.)
- User behavior tracking (page views, clicks, etc.)
- Flexible data reporting with multiple fallback strategies
- Sampling support
- Customizable configuration

## Installation

```bash
npm install fe-monitor-sdk
```

Or using yarn:

```bash
yarn add fe-monitor-sdk
```

## Basic Usage

### ES Module

```javascript
import Monitor from 'fe-monitor-sdk';

const monitor = new Monitor({
  appId: 'your-app-id',
  reportUrl: 'https://your-server.com/report',
  plugins: ['jsError', 'resourceError', 'pv'],
  sampling: 1, // 100% sampling
});

monitor.init();

// Manual error reporting
try {
  // Some code that might throw
} catch (error) {
  monitor.reportError(error, { 
    context: 'login-flow',
    userId: 'user-123'
  });
}

// Custom event tracking
monitor.reportEvent('button_click', {
  buttonId: 'submit-btn',
  page: 'checkout'
});

// Set user information
monitor.setUser('user-123', {
  role: 'admin',
  plan: 'premium'
});
```

### Script Tag (UMD)

```html
<script src="https://cdn.example.com/fe-monitor-sdk.min.js"></script>
<script>
  var monitor = new MonitorSDK({
    appId: 'your-app-id',
    reportUrl: 'https://your-server.com/report',
    plugins: ['jsError', 'pv']
  });
  
  monitor.init();
</script>
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `appId` | string | (required) | Your application identifier |
| `reportUrl` | string | (required) | URL to send reports to |
| `userId` | string | null | Current user identifier |
| `sampling` | number | 1 | Sampling rate (0-1) |
| `plugins` | array | [] | Plugins to enable |
| `maxQueueSize` | number | 10 | Max queue size before auto-sending |
| `reportInterval` | number | 5000 | Report interval in milliseconds |
| `enableConsoleRecord` | boolean | false | Whether to record console logs |
| `maxConsoleRecords` | number | 50 | Max console records to keep |

## API Reference

### Core Methods

- `monitor.init()` - Initialize the monitoring SDK
- `monitor.reportError(error, extraInfo)` - Report an error
- `monitor.reportEvent(eventName, eventData)` - Report a custom event
- `monitor.setUser(userId, userInfo)` - Set user information
- `monitor.destroy()` - Clean up and destroy the monitor instance

## Building from Source

```bash
# Install dependencies
npm install

# Build the SDK
npm run build
```

## License

MIT
