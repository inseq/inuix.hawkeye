import { ImageUtils } from '../../utils/image';

export class ImageOverlay {
  constructor(container, stateManager, config = {}) {
    this.container = container;
    this.stateManager = stateManager;
    this.config = config;
    
    this.image = null;
    this.moveableInstance = null;
    this.isRestoringState = false;
    
    this.originalWidth = 0;
    this.originalHeight = 0;
    this.currentScale = 1.0;
    
    this.state = {
      position: { x: 0, y: 0 },
      scale: 1.0,
      opacity: 0.5,
      isLocked: false,
      isInverted: false,
      isHidden: false
    };
  }

  async initialize() {
    await this.createImageElement();
    return this;
  }

  createImageElement() {
    if (this.image) {
      this.destroy();
    }

    this.image = document.createElement('img');
    this.image.id = this.config.ui.overlayId;
    this.image.className = 'hawkeye-overlay-image';
    this.container.insertBefore(this.image, this.container.firstChild);

    // 기본 스타일 설정
    this.image.style.position = 'absolute';
    this.image.style.maxWidth = 'unset';
    this.image.style.objectFit = 'contain';
    this.image.style.cursor = 'grab';
    this.image.style.visibility = 'hidden';
    this.image.style.transformOrigin = 'top left';
    
    return this.image;
  }

  initializeMoveable() {
    if (this.moveableInstance) {
      this.moveableInstance.destroy();
    }
  
    if (!this.image || this.state.isLocked) return;
  
    // window.Moveable 직접 사용
    this.moveableInstance = new window.Moveable(this.container, {
      target: this.image,
      draggable: true,
      scalable: false,
      resizable: true,
      keepRatio: true,
      origin: false,
      throttleResize: 0
    });
  
    this.moveableInstance.on('drag', ({ target, left, top }) => {
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;
  
      this.state.position = { x: left, y: top };
      this.notifyPositionChange();
    });
  
    this.moveableInstance.on('dragEnd', () => {
      this.saveState();
    });
  
    this.moveableInstance.on('resize', ({ target, width, height, drag }) => {
      target.style.width = `${width}px`;
      target.style.height = `${height}px`;
      target.style.left = `${drag.left}px`;
      target.style.top = `${drag.top}px`;
  
      this.currentScale = width / this.originalWidth;
      this.state.scale = this.currentScale;
      this.state.position = { x: drag.left, y: drag.top };
  
      this.notifyScaleChange();
      this.notifyPositionChange();
    });
  
    this.moveableInstance.on('resizeEnd', () => {
      this.saveState();
    });
  }

  async displayImage(file, options = {}) {
    try {
      this.isRestoringState = options.isRestoringState || false;
  
      if (!this.isRestoringState) {
        await this.stateManager.clearState();
        // 초기 상태로 리셋
        this.state = {
          position: { x: 0, y: 0 },
          scale: 1.0,
          opacity: 0.5,
          isLocked: false,
          isInverted: false,
          isHidden: false
        };
      }
  
      if (this.image.src) {
        ImageUtils.revokeObjectURL(this.image.src);
      }
  
      return new Promise((resolve) => {
        this.image.onload = () => {
          this.originalWidth = this.image.naturalWidth;
          this.originalHeight = this.image.naturalHeight;
  
          if (!this.isRestoringState) {
            this.currentScale = this.calculateInitialScale();
            this.state.scale = this.currentScale;
          }
  
          // 크기 설정
          this.image.style.width = `${this.originalWidth * this.currentScale}px`;
          this.image.style.height = `${this.originalHeight * this.currentScale}px`;
          this.image.style.visibility = 'visible';
          this.image.style.opacity = this.state.opacity; // 투명도 설정 추가
          
          if (!this.isRestoringState) {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
            this.image.style.top = `${scrollTop}px`;
            this.image.style.left = `${scrollLeft}px`;
            this.state.position = { x: scrollLeft, y: scrollTop };
          }
  
          this.initializeMoveable();
  
          // 상태 변경 알림
          this.notifyPositionChange();
          this.notifyScaleChange();
          this.notifyOpacityChange();
  
          resolve();
        };
  
        this.image.onerror = () => {
          console.error(`Failed to load image: ${file.name}`);
          resolve();
        };
  
        this.image.src = ImageUtils.createObjectURL(file);
      });
    } catch (error) {
      console.error('Error in displayImage:', error);
      throw error;
    }
  }

  calculateInitialScale() {
    const viewportWidth = window.outerWidth || window.innerWidth;
    const ratio = this.originalWidth / viewportWidth;
    
    if (ratio < 2) return 1.0;
    return Number((1 / Math.floor(ratio)).toFixed(2));
  }

  setOpacity(value) {
    if (!this.image) return;
    
    this.state.opacity = value;
    this.image.style.opacity = value;
    this.notifyOpacityChange();
    this.saveState();
  }

  updatePosition(x, y) {
    if (!this.image) return;
    
    this.image.style.left = `${x}px`;
    this.image.style.top = `${y}px`;
    this.state.position = { x, y };
    
    if (this.moveableInstance) {
      this.moveableInstance.updateRect();
    }
    
    this.notifyPositionChange();
    this.saveState();
  }

  updateScale(scale) {
    if (!this.image || isNaN(scale) || scale <= 0) return;
    
    this.currentScale = scale;
    this.image.style.width = `${this.originalWidth * scale}px`;
    this.image.style.height = `${this.originalHeight * scale}px`;
    this.state.scale = scale;
    
    if (this.moveableInstance) {
      this.moveableInstance.updateRect();
    }
    
    this.notifyScaleChange();
    this.saveState();
  }

  toggleVisibility() {
    if (!this.image) return;

    this.state.isHidden = !this.state.isHidden;
    this.image.style.visibility = this.state.isHidden ? 'hidden' : 'visible';

    if (this.moveableInstance) {
      const moveableElements = document.querySelectorAll(
        '.moveable-control-box, .moveable-line, .moveable-direction'
      );
      moveableElements.forEach((element) => {
        element.style.visibility = this.state.isHidden ? 'hidden' : 'visible';
      });
    }

    this.notifyVisibilityChange();
    this.saveState();
  }

  toggleInvert() {
    if (!this.image) return;
    
    this.state.isInverted = !this.state.isInverted;
    const currentFilter = this.image.style.filter;
    
    if (this.state.isInverted) {
      this.image.style.filter = currentFilter ? `${currentFilter} invert(1)` : 'invert(1)';
    } else {
      this.image.style.filter = currentFilter.replace('invert(1)', '').trim();
    }

    this.notifyInvertChange();
    this.saveState();
  }

  toggleLock() {
    if (!this.image) return;

    this.state.isLocked = !this.state.isLocked;
    
    if (this.state.isLocked) {
      this.image.style.pointerEvents = 'none';
      this.image.style.userSelect = 'none';
      if (this.moveableInstance) {
        this.moveableInstance.destroy();
        this.moveableInstance = null;
      }
    } else {
      this.image.style.pointerEvents = 'auto';
      this.image.style.userSelect = 'auto';
      this.initializeMoveable();
    }

    this.notifyLockChange();
    this.saveState();
  }

  // 상태 변경 알림 메서드들
  notifyPositionChange() {
    if (this.config.onPositionChange) {
      this.config.onPositionChange(this.state.position);
    }
  }

  notifyScaleChange() {
    if (this.config.onScaleChange) {
      this.config.onScaleChange(this.state.scale);
    }
  }

  notifyOpacityChange() {
    if (this.config.onOpacityChange) {
      this.config.onOpacityChange(this.state.opacity);
    }
  }

  notifyLockChange() {
    if (this.config.onLockChange) {
      this.config.onLockChange(this.state.isLocked);
    }
  }

  notifyVisibilityChange() {
    if (this.config.onVisibilityChange) {
      this.config.onVisibilityChange(this.state.isHidden);
    }
  }

  notifyInvertChange() {
    if (this.config.onInvertChange) {
      this.config.onInvertChange(this.state.isInverted);
    }
  }

  async saveState() {
    if (!this.image) return;

    const state = {
      ...this.state,
      imageBase64: ImageUtils.getBase64FromImage(this.image),
      originalWidth: this.originalWidth,
      originalHeight: this.originalHeight
    };

    await this.stateManager.saveState(state);
  }

  async resetState() {
    // 상태 초기화
    this.state = {
      position: { x: 0, y: 0 },
      scale: 1.0,
      opacity: 0.5,
      isLocked: false,
      isInverted: false,
      isHidden: false
    };
  
    if (this.image) {
      // 이미지가 있을 경우 스타일 초기화
      this.image.style.opacity = this.state.opacity;
      this.image.style.filter = '';
      this.image.style.visibility = 'visible';
      this.image.style.pointerEvents = 'auto';
      this.image.style.userSelect = 'auto';
  
      // 크기와 위치 재설정
      this.currentScale = this.calculateInitialScale();
      this.state.scale = this.currentScale;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      
      this.image.style.width = `${this.originalWidth * this.currentScale}px`;
      this.image.style.height = `${this.originalHeight * this.currentScale}px`;
      this.image.style.top = `${scrollTop}px`;
      this.image.style.left = `${scrollLeft}px`;
      this.state.position = { x: scrollLeft, y: scrollTop };
  
      // Moveable 재초기화
      if (this.moveableInstance) {
        this.moveableInstance.destroy();
        this.moveableInstance = null;
      }
      this.initializeMoveable();
    }
  
    // UI 상태 알림
    this.notifyPositionChange();
    this.notifyScaleChange();
    this.notifyOpacityChange();
    this.notifyLockChange();
    this.notifyVisibilityChange();
    this.notifyInvertChange();
  
    // 상태 저장
    await this.saveState();
  }

  async restoreState(state) {
    if (!state || !state.imageBase64) return;

    this.isRestoringState = true;
    
    try {
      const response = await fetch(state.imageBase64);
      const blob = await response.blob();
      const file = new File([blob], 'restored.png', { type: 'image/png' });
      
      this.currentScale = parseFloat(state.scale) || 1.0;
      await this.displayImage(file, { isRestoringState: true });
      
      Object.assign(this.state, state);
      
      this.updatePosition(state.position.x, state.position.y);
      this.setOpacity(state.opacity);
      
      if (state.isInverted) this.toggleInvert();
      if (state.isLocked) this.toggleLock();
      if (state.isHidden) this.toggleVisibility();
      
      this.isRestoringState = false;
    } catch (error) {
      console.error('Failed to restore state:', error);
      this.isRestoringState = false;
    }
  }

  destroy() {
    if (this.moveableInstance) {
      this.moveableInstance.destroy();
      this.moveableInstance = null;
    }
    
    if (this.image) {
      if (this.image.src) {
        ImageUtils.revokeObjectURL(this.image.src);
      }
      this.image.remove();
      this.image = null;
    }
  
    // 상태 초기화 추가
    this.state = {
      position: { x: 0, y: 0 },
      scale: 1.0,
      opacity: 0.5,
      isLocked: false,
      isInverted: false,
      isHidden: false
    };
  }
}