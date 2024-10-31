import { DefaultConfig } from '../config/defaultConfig';
import { EventManager } from './EventManager';
import { StateManager } from './StateManager';
import { UIManager } from '../ui/UIManager';
import { VisibilityManager } from './VisibilityManager';
import { ImageOverlay } from '../ui/components/ImageOverlay';
import { Validators, ErrorHandler } from '../utils/validators';

export class HawkeyeCore {
  constructor(config = {}) {
    this.config = { ...DefaultConfig, ...config };
    this.initialized = false;
    this.managers = {
      state: null,
      event: null,
      ui: null,
      visibility: null
    };
    this.overlay = null;

    // 이벤트 핸들러 바인딩
    this.handleResize = this.handleResize.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
  }

  async initialize() {
    try {
      // 전역 활성화 여부 체크
      if (!this.config.enabled) {
        console.info('[Hawkeye] 전역 설정에 의해 비활성화됨');
        return false;
      }

      // 설정 유효성 검사
      const { isValid, errors } = Validators.validateConfig(this.config);
      if (!isValid) {
        throw new Error(`Invalid configuration: ${errors.join(', ')}`);
      }

      // 노출 조건 체크
      this.managers.visibility = new VisibilityManager(this.config);
      
      // visibility 초기화 후 로그 출력
      console.log('[Hawkeye] Final merged config:', this.config);
      console.log('[Hawkeye] Current branch:', this.managers.visibility.extractBranchFromUrl());

      const shouldDisplay = await this.managers.visibility.checkVisibility();
      if (!shouldDisplay) {
        console.info('[Hawkeye] Visibility conditions not met. Tool will not be displayed.');
        return false;
      }

      // State Manager 초기화
      this.managers.state = new StateManager(this.config);
      await this.managers.state.initialize();

      // UI Manager 초기화
      this.managers.ui = new UIManager(this.managers.state, this.config);
      await this.managers.ui.initialize();

      // Image Overlay 초기화 (콜백 포함)
      this.overlay = new ImageOverlay(
        this.managers.ui.elements.container,
        this.managers.state,
        {
          ...this.config,
          onPositionChange: (position) => this.managers.ui.updatePositionInputs(position),
          onScaleChange: (scale) => this.managers.ui.updateScaleInput(scale),
          onOpacityChange: (opacity) => this.managers.ui.updateOpacitySlider(opacity),
          onLockChange: (isLocked) => this.managers.ui.updateLockButton(isLocked),
          onVisibilityChange: (isHidden) => this.managers.ui.updateVisibilityButton(isHidden),
          onInvertChange: (isInverted) => this.managers.ui.updateInvertButton(isInverted)
        }
      );
      await this.overlay.initialize();

      // Event Manager 초기화
      this.managers.event = new EventManager(this);
      this.managers.event.initialize();

      // 이전 상태 복원
      await this.restoreState();

      this.initialized = true;
      return true;
    } catch (error) {
      ErrorHandler.handle(error, 'Core initialization failed');
      return false;
    }
  }

  displayOverlayImage(file) {
    try {
      const validation = Validators.validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      this.overlay.displayImage(file);
      this.managers.ui.updateControls({ hasImage: true });
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to display overlay image');
    }
  }

  setOverlayOpacity(value) {
    const opacity = Validators.validateOpacity(value);
    this.overlay.setOpacity(opacity);
  }

  updateOverlayPosition(x = null, y = null) {
    const currentPos = {
      x: x !== null ? x : (parseInt(this.managers.ui.elements.xInput.value) || 0),
      y: y !== null ? y : (parseInt(this.managers.ui.elements.yInput.value) || 0)
    };
    
    const validatedPos = Validators.validatePosition(currentPos.x, currentPos.y);
    this.overlay.updatePosition(validatedPos.x, validatedPos.y);
  }

  updateOverlayScale() {
    const scale = Validators.validateScale(this.managers.ui.elements.scaleInput.value);
    this.overlay.updateScale(scale);
  }

  toggleOverlayVisibility() {
    if (this.hasOverlayImage()) {
      this.overlay.toggleVisibility();
    }
  }

  toggleLockOverlay() {
    if (this.hasOverlayImage()) {
      this.overlay.toggleLock();
    }
  }

  invertOverlayColor() {
    if (this.hasOverlayImage()) {
      this.overlay.toggleInvert();
    }
  }

  setPosition(position) {
    if (!this.hasOverlayImage()) return;

    const image = this.overlay.image;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scaledWidth = parseFloat(image.style.width);
    const scaledHeight = parseFloat(image.style.height);

    let x, y;

    switch (position) {
      case 'top-left':
        x = scrollLeft;
        y = scrollTop;
        break;
      case 'top-right':
        x = scrollLeft + viewportWidth - scaledWidth;
        y = scrollTop;
        break;
      case 'bottom-left':
        x = scrollLeft;
        y = scrollTop + viewportHeight - scaledHeight;
        break;
      case 'bottom-right':
        x = scrollLeft + viewportWidth - scaledWidth;
        y = scrollTop + viewportHeight - scaledHeight;
        break;
      case 'center':
        x = scrollLeft + (viewportWidth - scaledWidth) / 2;
        y = scrollTop + (viewportHeight - scaledHeight) / 2;
        break;
      default:
        return;
    }

    this.updateOverlayPosition(x, y);
  }

  async saveState() {
    if (this.hasOverlayImage()) {
      await this.overlay.saveState();
    }
  }

  async restoreState() {
    try {
        console.log('[HawkeyeCore] Starting state restoration');
        const state = await this.managers.state.getState();
        console.log('[HawkeyeCore] Retrieved state:', state);
        
        if (state) {
            // 1. 이미지 상태 복원
            await this.overlay.restoreState(state);
            
            // 2. UI 상태 업데이트
            this.managers.ui.updateControls({
                hasImage: true,
                opacity: state.opacity,
                position: state.position,
                scale: state.scale,
                isLocked: state.isLocked,
                isInverted: state.isInverted,
                isHidden: state.isHidden
            });
            
            console.log('[HawkeyeCore] State restoration complete');
        }
    } catch (error) {
        console.error('[HawkeyeCore] Failed to restore state:', error);
    }
  }

  async resetOverlayState() {
    try {
      await this.managers.state.clearState();
      this.overlay.destroy();
      await this.overlay.initialize();
      this.managers.ui.resetControls();
    } catch (error) {
      ErrorHandler.handle(error, 'Failed to reset state');
    }
  }

  hasOverlayImage() {
    return this.overlay && this.overlay.image !== null;
  }

  isOverlayLocked() {
    return this.overlay ? this.overlay.state.isLocked : false;
  }

  getOverlayImage() {
    return this.overlay ? this.overlay.image : null;
  }

  getToolbarState() {
    return this.managers.state.getToolbarState();
  }
  
  saveToolbarState(state) {
    return this.managers.state.saveToolbarState(state);
  }
  
  clearToolbarState() {
    if (this.managers.state) {
      localStorage.removeItem(this.config.storageKeys.toolbar);
    }
  }

  getToolbar() {
    return this.managers.ui ? this.managers.ui.elements.toolbar : null;
  }

  handleResize() {
    if (this.hasOverlayImage()) {
      this.overlay.updateScale(this.overlay.currentScale);
    }
  }

  handlePaste(event) {
    const items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          this.displayOverlayImage(file);
        }
      }
    }
  }

  async saveCurrentImage() {
    if (this.hasOverlayImage()) {
      alert("기능 준비중입니다.");
      // try {
      //   const dataUrl = I.getBase64FromImage(this.getOverlayImage());
      //   if (dataUrl) {
      //     // 이미지를 다운로드할 수 있는 링크 생성
      //     const link = document.createElement('a');
      //     link.href = dataUrl;
      //     link.setAttribute('download', 'hawkeye-overlay.png');
      //     document.body.appendChild(link);
      //     link.click();
      //     document.body.removeChild(link);
      //     // 저장 완료 알림 띄우기
      //     alert('이미지가 저장되었습니다.');
      //   } else {
      //     alert('이미지 저장에 실패했습니다.');
      //   }
      // } catch (error) {
      //   console.error('Failed to save image:', error);
      //   alert('이미지 저장에 실패했습니다.');
      // }
    }
  }

  destroy() {
    Object.values(this.managers).forEach(manager => {
      if (manager && typeof manager.destroy === 'function') {
        manager.destroy();
      }
    });

    if (this.overlay) {
      this.overlay.destroy();
    }

    this.initialized = false;
  }
}