import './styles/main.scss';
import { HawkeyeCore } from './core/HawkeyeCore';
import { DefaultConfig } from './config/defaultConfig';

class HawkeyeOverlayTool {
  static instance = null;
  static hasManualInit = false;

  constructor(config = {}) {
    console.log('[Hawkeye] Constructor config:', config);
  
    if (HawkeyeOverlayTool.instance) {
      console.log('[Hawkeye] Destroying existing instance');
      HawkeyeOverlayTool.instance.destroy();
    }
  
    const deepMerge = (target, source) => {
      const result = { ...target };
      for (const key in source) {
        if (source[key] instanceof Object && !Array.isArray(source[key])) {
          result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
      return result;
    };
  
    const mergedConfig = deepMerge(DefaultConfig, config);
  
    this.core = new HawkeyeCore(mergedConfig);
    this.config = mergedConfig;
    HawkeyeOverlayTool.instance = this;
  }

  async initialize() {
    try {
      console.log('[Hawkeye] Final merged config:', this.config);
      console.log('[Hawkeye] Current branch:', this.managers?.visibility?.extractBranchFromUrl());
  
      if (this.config.enabled === false) {
        console.log('[Hawkeye] Config disabled, destroying');
        this.destroy();
        return;
      }
      await this.core.initialize();
    } catch (error) {
      console.error('[Hawkeye] Init failed:', error);
    }
  }

  destroy() {
    if (this.core) {
      this.core.destroy();
    }
  }

  static initialize(config = {}) {
    console.log('[Hawkeye] Manual initialize:', config);
    HawkeyeOverlayTool.hasManualInit = true;
    const instance = new HawkeyeOverlayTool(config);
    return instance.initialize();
  }
}

window.HawkeyeOverlayTool = HawkeyeOverlayTool;

// 자동 초기화는 수동 초기화가 없을 때만
if (!HawkeyeOverlayTool.hasManualInit) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!HawkeyeOverlayTool.hasManualInit) {
        HawkeyeOverlayTool.initialize();
      }
    });
  } else {
    HawkeyeOverlayTool.initialize();
  }
}

export default HawkeyeOverlayTool;