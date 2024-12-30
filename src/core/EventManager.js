export class EventManager {
  constructor(hawkeyeCore) {
    this.core = hawkeyeCore;
    this.boundHandlers = new Map();
  }

  initialize() {
    this.registerKeyboardEvents();
    this.registerClipboardEvents();
    this.registerWindowEvents();
    this.registerInputEvents();
    this.registerControlEvents();
    this.registerToolbarEvents();
  }

  registerKeyboardEvents() {
    const keydownHandler = (event) => {
      // 입력 필드에서는 단축키 무시
      if (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA'
      ) {
        return;
      }

      // Alt + `: 툴바 토글
      if (event.altKey && event.key === '`') {
        event.preventDefault();
        this.core.managers.ui.toggleToolbar();
        return;
      }

      // Alt + V: 이미지 토글
      if (event.altKey && event.key.toLowerCase() === 'v') {
        event.preventDefault();
        this.core.toggleOverlayVisibility();
        return;
      }

      // Alt + L: 잠금/해제 토글
      if (event.altKey && event.key.toLowerCase() === 'l') {
        event.preventDefault();
        this.core.toggleLockOverlay();
        return;
      }

      // Alt + D: 색상 반전 토글
      if (event.altKey && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        this.core.invertOverlayColor();
        return;
      }

      // 방향키: 이미지 이동
      if (this.core.hasOverlayImage() && !this.core.isOverlayLocked()) {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault();
          this.handleArrowKey(event.key, event.shiftKey);
        }
      }
    };

    document.addEventListener('keydown', keydownHandler);
    this.boundHandlers.set('keydown', keydownHandler);
  }

  registerClipboardEvents() {
    const pasteHandler = (event) => {
      const items = (event.clipboardData || event.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            this.core.displayOverlayImage(file);
          }
        }
      }
    };

    document.addEventListener('paste', pasteHandler);
    this.boundHandlers.set('paste', pasteHandler);
  }

  registerWindowEvents() {
    const resizeHandler = () => {
      const toolbar = this.core.getToolbar();
      if (!toolbar) return;

      const savedState = this.core.getToolbarState();
      if (savedState && (savedState.position.left || savedState.position.top)) {
        toolbar.style.removeProperty('left');
        toolbar.style.removeProperty('top');
        this.core.clearToolbarState();
      }
    };

    window.addEventListener('resize', resizeHandler);
    this.boundHandlers.set('resize', resizeHandler);
  }

  registerInputEvents() {
    // 위치 입력 이벤트
    ['xInput', 'yInput'].forEach(inputId => {
      const input = document.getElementById(inputId);
      if (!input) return;

      const handler = () => {
        this.core.updateOverlayPosition();
      };

      input.addEventListener('input', handler);
      this.boundHandlers.set(inputId, handler);
    });

    // 스케일 입력 이벤트
    const scaleInput = document.getElementById('scaleInput');
    if (scaleInput) {
      const handler = () => {
        this.core.updateOverlayScale();
      };

      scaleInput.addEventListener('input', handler);
      this.boundHandlers.set('scaleInput', handler);
    }

    // 투명도 슬라이더 이벤트
    const opacitySlider = document.getElementById('opacitySlider');
    if (opacitySlider) {
      const handler = (e) => {
        this.core.setOverlayOpacity(e.target.value);
      };

      opacitySlider.addEventListener('input', handler);
      this.boundHandlers.set('opacitySlider', handler);
    }
  }

  registerControlEvents() {
    // 이미지 업로드 이벤트
    const fileInput = document.getElementById('overlayImageInput');
    if (fileInput) {
      const handler = (e) => {
        const file = e.target.files[0];
        if (file) {
          this.core.displayOverlayImage(file);
        }
      };

      fileInput.addEventListener('change', handler);
      this.boundHandlers.set('fileInput', handler);
    }

    // 컨트롤 버튼 이벤트
    this.registerControlButton('invertColorButton', () => this.core.invertOverlayColor());
    this.registerControlButton('lockButton', () => this.core.toggleLockOverlay());
    this.registerControlButton('toggleVisibilityButton', () => this.core.toggleOverlayVisibility());
    this.registerControlButton('resetOverlayButton', () => this.core.resetOverlayState());
    this.registerControlButton('saveImageButton', () => this.core.saveCurrentImage());

    // 위치 버튼 이벤트
    ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].forEach(position => {
      this.registerControlButton(position, () => this.core.setPosition(position));
    });
  }

  registerToolbarEvents() {
    const ui = this.core.managers.ui;
    const header = ui.elements.toolbar.querySelector('.hawkeye-head');
    const toggleButton = ui.elements.toggleButton;

    // 드래그 이벤트
    const startDrag = (e) => {
      if (e.target === toggleButton) return;
      const x = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
      const y = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
      ui.handleDragStart(x, y);
    };

    const doDrag = (e) => {
      e.preventDefault();
      const x = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
      const y = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
      ui.handleDrag(x, y);
    };

    const endDrag = () => {
      ui.handleDragEnd();
    };

    // 이벤트 리스너 등록
    header.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', endDrag);
    header.addEventListener('touchstart', startDrag, {
      passive: true
    });
    document.addEventListener('touchmove', doDrag, {
      passive: false
    });
    document.addEventListener('touchend', endDrag, {
      passive: true
    });

    // 툴바 토글 버튼
    toggleButton.addEventListener('click', () => ui.toggleToolbar());

    // 이미지 가시성 토글
    ui.elements.toggleVisibilityButton.addEventListener('click', () => {
      ui.toggleImageVisibility();
    });
  }

  registerControlButton(id, handler) {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener('click', handler);
      this.boundHandlers.set(id, handler);
    }
  }

  handleArrowKey(key, isShiftPressed) {
    const image = this.core.getOverlayImage();
    if (!image) return;

    let top = parseInt(image.style.top) || 0;
    let left = parseInt(image.style.left) || 0;

    const moveDistance = isShiftPressed ? 10 : 1;

    switch (key) {
      case 'ArrowUp':
        top -= moveDistance;
        break;
      case 'ArrowDown':
        top += moveDistance;
        break;
      case 'ArrowLeft':
        left -= moveDistance;
        break;
      case 'ArrowRight':
        left += moveDistance;
        break;
    }

    this.core.updateOverlayPosition(left, top);
  }

  destroy() {
    // 등록된 모든 이벤트 리스너 제거
    for (const [eventName, handler] of this.boundHandlers.entries()) {
      const element = document.getElementById(eventName) || document;
      if (element instanceof HTMLElement) {
        element.removeEventListener('click', handler);
        element.removeEventListener('input', handler);
        element.removeEventListener('change', handler);
      } else {
        document.removeEventListener(eventName, handler);
        window.removeEventListener(eventName, handler);
      }
    }

    this.boundHandlers.clear();
  }
}