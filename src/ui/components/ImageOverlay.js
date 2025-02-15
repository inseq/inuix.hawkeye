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
    this.image.style.visibility = 'hidden';
    this.image.style.transformOrigin = 'top left';
    
    return this.image;
  }

  initializeMoveable() {
    if (this.moveableInstance) {
      this.moveableInstance.destroy();
    }
  
    if (!this.image) return;
  
    // Moveable 인스턴스 생성
    this.moveableInstance = new window.Moveable(this.container, {
      target: this.image,
      draggable: true,
      scalable: false,
      resizable: true,
      keepRatio: true,
      origin: false,
      throttleResize: 0,
      className: this.state.isLocked ? 'hawkeye-locked' : ''
    });
  
    // 마우스 이벤트만 선택적으로 차단
    this.moveableInstance.target.addEventListener('mousedown', (e) => {
      if (this.state.isLocked) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);
  
    // 이미지 드래그 핸들러
    this.moveableInstance.on('drag', ({ target, left, top }) => {
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;
  
      this.state.position = { x: left, y: top };
      this.notifyPositionChange();
    });
  
    this.moveableInstance.on('dragEnd', () => {
      this.saveState();
    });
  
    // 이미지 리사이즈 핸들러
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

  setPosition(positionType) {
    if (!this.image) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scaledWidth = parseFloat(this.image.style.width);
    const scaledHeight = parseFloat(this.image.style.height);

    let x, y;
    const currentY = parseFloat(this.image.style.top) || scrollTop;

    switch (positionType) {
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
        y = currentY; // 현재 Y 위치 유지
        break;
      default:
        return;
    }

    this.updatePosition(x, y);
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

  async toggleInvert() {
    if (!this.image || !this.image.complete) return;
    try {
      if (this.image.naturalWidth === 0 || this.image.naturalHeight === 0) {
          console.error('Image not properly loaded');
          return;
      }

      this.state.isInverted = !this.state.isInverted;
      
      this.image.style.filter = this.state.isInverted ? 'invert(1)' : '';
      
      this.notifyInvertChange();
      await this.saveState();
        
    } catch (error) {
      console.error('Failed to invert image:', error);
      this.state.isInverted = !this.state.isInverted;
    }
  }

  toggleLock() {
    if (!this.image || !this.moveableInstance) return;
  
    this.state.isLocked = !this.state.isLocked;
    
    // UI 스타일만 변경 (draggable/resizable은 건드리지 않음)
    this.moveableInstance.className = this.state.isLocked ? 'hawkeye-locked' : '';
    this.container.classList.toggle('hawkeye-locked', this.state.isLocked);  // 컨테이너에도 클래스 추가
  
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
      // 1. 이미지 로드 및 기본 상태 복원
      const response = await fetch(state.imageBase64);
      const blob = await response.blob();
      const file = new File([blob], 'restored.png', { type: 'image/png' });
      
      this.currentScale = parseFloat(state.scale) || 1.0;
      await this.displayImage(file, { isRestoringState: true });
      
      // 2. 상태 복원
      this.state = { ...state };
      
      // 3. 이미지 상태 적용
      if (this.image) {
        // 위치와 투명도
        this.updatePosition(state.position.x, state.position.y);
        this.setOpacity(state.opacity);
  
        // 반전 상태 적용
        this.image.style.filter = state.isInverted ? 'invert(1)' : '';
  
        // 가시성 상태 적용
        this.image.style.visibility = state.isHidden ? 'hidden' : 'visible';
      }
  
      // 4. Moveable 인스턴스 재초기화
      this.initializeMoveable();
  
      // 5. Moveable 가시성 상태도 동일한 방식으로 적용
      if (this.moveableInstance && state.isHidden) {
        const moveableElements = document.querySelectorAll(
          '.moveable-control-box, .moveable-line, .moveable-direction'
        );
        moveableElements.forEach((element) => {
          element.style.visibility = 'hidden';
        });
      }
  
      // 6. 컨테이너 잠금 상태 복원
      this.container.classList.toggle('hawkeye-locked', this.state.isLocked);
  
      // 7. UI 알림
      this.notifyLockChange();
      this.notifyVisibilityChange();
      this.notifyInvertChange();
      
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