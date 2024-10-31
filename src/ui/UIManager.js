import { toolbarTemplate } from './templates/toolbar';

export class UIManager {
  constructor(stateManager, config = {}) {
    this.stateManager = stateManager;
    this.config = config;
    this.elements = {
      container: null,
      toolbar: null,
      overlayImage: null,
      opacitySlider: null,
      toggleButton: null,
      lockButton: null,
      invertButton: null,
      xInput: null,
      yInput: null,
      scaleInput: null
    };
    
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
  }

  async initialize() {
    try {
      // 1. 컨테이너 초기화
      await this.initContainer();
      
      // 2. 오버레이 이미지 엘리먼트 생성
      const overlayImage = document.createElement('img');
      overlayImage.id = this.config.ui.overlayId;
      overlayImage.className = 'hawkeye-overlay-image';
      this.elements.container.appendChild(overlayImage);
      this.elements.overlayImage = overlayImage;
      
      // 3. 툴바 렌더링
      await this.renderToolbar();
      
      // 4. DOM 업데이트 대기
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // 5. 나머지 요소 초기화
      await this.initializeElements();
      
      // 6. 이벤트 리스너 연결
      await this.attachEventListeners();
      
      // 7. 툴바 상태 복원
      await this.restoreToolbarState();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize UIManager:', error);
      return false;
    }
  }

  initContainer() {
    return new Promise((resolve) => {
      let container = document.getElementById(this.config.ui.containerId);
      if (!container) {
        container = document.createElement('div');
        container.id = this.config.ui.containerId;
        container.className = 'publishing-container';
        document.body.appendChild(container);
      }
      this.elements.container = container;
      resolve();
    });
  }

  renderToolbar() {
    return new Promise((resolve) => {
      const tempContainer = document.createElement('div');
      tempContainer.innerHTML = toolbarTemplate;
      document.body.appendChild(tempContainer.firstElementChild);
      this.elements.toolbar = document.getElementById(this.config.ui.toolbarId);
      resolve();
    });
  }

  initializeElements() {
    return new Promise((resolve, reject) => {
      try {
        // 기본 요소들 초기화
        this.elements = {
          ...this.elements,
          toolbar: document.getElementById(this.config.ui.toolbarId),
          toggleButton: document.querySelector('.toggle-button'),
          opacitySlider: document.getElementById('opacitySlider'),
          toggleVisibilityButton: document.getElementById('toggleVisibilityButton'),
          lockButton: document.getElementById('lockButton'),
          invertButton: document.getElementById('invertColorButton'),
          xInput: document.getElementById('xInput'),
          yInput: document.getElementById('yInput'),
          scaleInput: document.getElementById('scaleInput')
        };
  
        // 요소 존재 확인
        const requiredElements = [
          'container', 
          'overlayImage', 
          'toolbar', 
          'toggleButton', ,
          'opacitySlider', 
          'toggleVisibilityButton',
          'lockButton', 
          'invertButton', 
          'xInput', 
          'yInput', 
          'scaleInput'
        ];
  
        const missingElements = requiredElements.filter(key => !this.elements[key]);
  
        if (missingElements.length > 0) {
          throw new Error(`Missing elements: ${missingElements.join(', ')}`);
        }
  
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  attachEventListeners() {
    return new Promise((resolve) => {
      const header = this.elements.toolbar.querySelector('.hawkeye-head');
      
      const startDrag = (e) => {
        if (e.target === this.elements.toggleButton) return;
        this.isDragging = true;
        this.elements.toolbar.classList.add('dragging');

        const x = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        const y = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        this.dragOffset = {
          x: x - this.elements.toolbar.offsetLeft,
          y: y - this.elements.toolbar.offsetTop
        };
      };

      const doDrag = (e) => {
        if (!this.isDragging) return;
        e.preventDefault();

        const x = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const y = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;

        let newX = x - this.dragOffset.x;
        let newY = y - this.dragOffset.y;

        const minVisible = 100;
        const maxX = window.innerWidth - this.elements.toolbar.offsetWidth + minVisible;
        const maxY = window.innerHeight - this.elements.toolbar.offsetHeight + minVisible;

        newX = Math.max(-minVisible, Math.min(newX, maxX));
        newY = Math.max(-minVisible, Math.min(newY, maxY));

        this.elements.toolbar.style.left = `${newX}px`;
        this.elements.toolbar.style.top = `${newY}px`;

        this.saveToolbarState();
      };

      const endDrag = () => {
        this.isDragging = false;
        this.elements.toolbar.classList.remove('dragging');
      };

      // Passive 이벤트 리스너 등록
      header.addEventListener('mousedown', startDrag);
      document.addEventListener('mousemove', doDrag);
      document.addEventListener('mouseup', endDrag);
      header.addEventListener('touchstart', startDrag, { passive: true });
      document.addEventListener('touchmove', doDrag, { passive: false });
      document.addEventListener('touchend', endDrag, { passive: true });

      // 토글 버튼 이벤트
      this.elements.toggleButton.addEventListener('click', () => this.toggleToolbar());

      // 이미지 가시성 토글 이벤트
      this.elements.toggleVisibilityButton.addEventListener('click', () => {
        const isHidden = this.elements.overlayImage.style.display !== 'none';
        this.elements.overlayImage.style.display = isHidden ? 'none' : 'block';
        this.updateVisibilityButton(!isHidden);
        this.saveToolbarState();
      });

      resolve();
    });
  }

  toggleToolbar() {
    const isCollapsed = this.elements.toolbar.classList.toggle('collapsed');
    this.elements.toggleButton.innerHTML = isCollapsed ? '▲' : '▼';
    this.saveToolbarState();
  }

  async saveToolbarState() {
    const state = {
      collapsed: this.elements.toolbar.classList.contains('collapsed'),
      position: {
        left: this.elements.toolbar.style.left,
        top: this.elements.toolbar.style.top
      },
      isHidden: this.elements.overlayImage.style.display === 'none'
    };
    await this.stateManager.saveToolbarState(state);
  }

  async restoreToolbarState() {
    const state = await this.stateManager.getToolbarState();
    if (state) {
      if (state.collapsed) {
        this.elements.toolbar.classList.add('collapsed');
        this.elements.toggleButton.innerHTML = '▲';
      }
      if (state.position) {
        this.elements.toolbar.style.left = state.position.left;
        this.elements.toolbar.style.top = state.position.top;
      }
      if (state.isHidden !== undefined) {
        this.elements.overlayImage.style.display = state.isHidden ? 'none' : 'block';
        this.updateVisibilityButton(state.isHidden);
      }
    }
  }

  updateControls(state) {
    console.log('[UIManager] Updating controls with state:', state);
    
    if (!state) return;

    if (state.hasImage) {
        document.querySelector('.upload-before').style.display = 'none';
        document.querySelector('.upload-after').style.display = 'flex';
    }

    if (state.opacity !== undefined) {
        this.elements.opacitySlider.value = state.opacity;
        this.elements.opacitySlider.disabled = !state.hasImage;
    }

    if (state.isHidden !== undefined) {
        this.updateVisibilityButton(state.isHidden);
        const button = document.getElementById('toggleVisibilityButton');
        button.innerHTML = state.isHidden ? '🙈' : '🙉';
        button.classList.toggle('active', state.isHidden);
    }

    if (state.isLocked !== undefined) {
        const button = document.getElementById('lockButton');
        button.classList.toggle('active', state.isLocked);
    }

    if (state.isInverted !== undefined) {
        const button = document.getElementById('invertColorButton');
        button.classList.toggle('active', state.isInverted);
    }

    console.log('[UIManager] Controls update complete');
  }

  resetControls() {
    this.elements.xInput.value = 0;
    this.elements.yInput.value = 0;
    this.elements.scaleInput.value = 1.0;
    this.elements.opacitySlider.value = 0.5;
    this.elements.opacitySlider.disabled = true;
    this.elements.lockButton.classList.remove('active');
    this.elements.invertButton.classList.remove('active');
    
    document.querySelector('.upload-before').style.display = 'flex';
    document.querySelector('.upload-after').style.display = 'none';
  }

  destroy() {
    // 이벤트 리스너 제거 및 리소스 정리
    if (this.elements.toolbar) {
      this.elements.toolbar.remove();
    }
    if (this.elements.overlayImage) {
      this.elements.overlayImage.remove();
    }
    this.elements = {};
  }

  updatePositionInputs(position) {
    if (!position) return;
    
    if (this.elements.xInput) {
      this.elements.xInput.value = Math.round(position.x);
    }
    if (this.elements.yInput) {
      this.elements.yInput.value = Math.round(position.y);
    }
  }

  updateScaleInput(scale) {
    if (this.elements.scaleInput) {
      this.elements.scaleInput.value = parseFloat(scale).toFixed(2);
    }
  }

  updateOpacitySlider(value) {
    if (this.elements.opacitySlider) {
      this.elements.opacitySlider.value = value;
      this.elements.opacitySlider.disabled = false;
    }
  }

  updateVisibilityButton(isHidden) {
    if (this.elements.toggleVisibilityButton) {
      this.elements.toggleVisibilityButton.innerHTML = isHidden ? '🙈' : '🙉';
      this.elements.toggleVisibilityButton.classList.toggle('active', isHidden);
    }
  }

  updateLockButton(isLocked) {
    if (this.elements.lockButton) {
      this.elements.lockButton.classList.toggle('active', isLocked);
    }
  }

  updateInvertButton(isInverted) {
    if (this.elements.invertButton) {
      this.elements.invertButton.classList.toggle('active', isInverted);
    }
  }
}