import './styles/main.scss';
import { HawkeyeCore } from './core/HawkeyeCore';
import { DefaultConfig } from './config/defaultConfig';

class HawkeyeOverlayTool {
  constructor(config = {}) {
    const mergedConfig = {
      ...DefaultConfig,
      ...config,
      ui: {
        ...DefaultConfig.ui,
        ...config.ui,
        containerId: config.containerId || DefaultConfig.ui.containerId
      }
    };

    this.core = new HawkeyeCore(mergedConfig);
  }

  async initialize() {
    try {
      await this.core.initialize();
    } catch (error) {
      console.error('Failed to initialize Hawkeye:', error);
    }
  }

  destroy() {
    if (this.core) {
      this.core.destroy();
    }
  }

  static initialize(config = {}) {
    const instance = new HawkeyeOverlayTool(config);
    return instance.initialize();
  }
}

// 전역 객체로 노출
window.HawkeyeOverlayTool = HawkeyeOverlayTool;

// 자동 초기화 (enabled가 false로 명시되지 않은 경우에만)
if (!window.HAWKEYE_CONFIG?.enabled === false) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => HawkeyeOverlayTool.initialize());
  } else {
    HawkeyeOverlayTool.initialize();
  }
}

export default HawkeyeOverlayTool;