/* inuix.hawkeye.js */
import "./inuix.hawkeye.scss";

class HawkeyeOverlayTool {
  constructor(publishingContainerId) {
    this.overlayImage = null;
    this.overlayState = {
      moveable: null,
      initialState: {},
      locked: false,
    };
    this.currentScale = 1.0;
    this.originalWidth = 0;
    this.originalHeight = 0;
    this.boundEventHandlers = {}; // 이벤트 핸들러 참조 저장용
    this.STORAGE_KEY = `hawkeye_${window.location.pathname}`; // URL별 저장소 키

    // DOM 로드 이벤트 핸들러
    this.boundEventHandlers.domContentLoaded = () => {
      this.initPublishingContainer(publishingContainerId);
      this.renderUI();
      this.attachEventListeners();
      this.addClipboardImageHandler();
      this.addArrowKeyHandler();
      this.initPanelControls();
      this.restoreToolbarState();
      this.restoreState();
    };

    // 리사이즈 이벤트 핸들러
    this.boundEventHandlers.resize = () => {
      const toolbar = document.getElementById("hawkeyeToolbar");
      if (!toolbar) return;

      const savedState = localStorage.getItem("hawkeyeToolbarState");
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.position && (state.position.left || state.position.top)) {
          toolbar.style.removeProperty("left");
          toolbar.style.removeProperty("top");
          localStorage.removeItem("hawkeyeToolbarState");
        }
      }
    };

    // 키보드 이벤트 핸들러
    this.boundEventHandlers.keydown = (event) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (this.overlayImage) {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key
          )
        ) {
          event.preventDefault();
          this.handleArrowKey(event.key);
        }
      }
    };

    // 클립보드 이벤트 핸들러
    this.boundEventHandlers.paste = (event) => {
      const items = (event.clipboardData || event.originalEvent.clipboardData)
        .items;
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            this.displayOverlayImage(file);
          }
        }
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener(
      "DOMContentLoaded",
      this.boundEventHandlers.domContentLoaded
    );
    window.addEventListener("resize", this.boundEventHandlers.resize);
  }

  // IndexedDB 초기화 메서드
  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("hawkeyeDB", 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("states")) {
          db.createObjectStore("states", { keyPath: "key" });
        }
      };
    });
  }

  async clearStorageState() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
  
      if (!this.db) {
        await this.initIndexedDB();
      }
  
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["states"], "readwrite");
        const store = transaction.objectStore("states");
        const request = store.delete(this.STORAGE_KEY);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(new Error('Transaction aborted'));
      });
    } catch (error) {
      console.error("Failed to clear storage state:", error);
      throw error;
    }
  }

  // 이벤트 리스너 정리 메서드
  destroy() {
    // 윈도우/도큐먼트 이벤트 리스너 제거
    document.removeEventListener(
      "DOMContentLoaded",
      this.boundEventHandlers.domContentLoaded
    );
    window.removeEventListener("resize", this.boundEventHandlers.resize);
    document.removeEventListener("keydown", this.boundEventHandlers.keydown);
    document.removeEventListener("paste", this.boundEventHandlers.paste);

    // 타이머 정리
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Moveable 인스턴스 정리
    if (this.overlayState.moveable) {
      this.overlayState.moveable.destroy();
      this.overlayState.moveable = null;
    }

    // 이미지 메모리 정리
    if (this.overlayImage) {
      if (this.overlayImage.src) {
        URL.revokeObjectURL(this.overlayImage.src);
      }
      this.overlayImage.remove();
      this.overlayImage = null;
    }

    // 로컬 스토리지 정리 (필요한 경우)
    // localStorage.removeItem(this.STORAGE_KEY);

    // 바운드 이벤트 핸들러 참조 정리
    this.boundEventHandlers = {};
  }

  // Arrow 키 처리를 위한 헬퍼 메서드
  handleArrowKey(key) {
    let top = parseInt(this.overlayImage.style.top) || 0;
    let left = parseInt(this.overlayImage.style.left) || 0;

    switch (key) {
      case "ArrowUp":
        top -= 1;
        break;
      case "ArrowDown":
        top += 1;
        break;
      case "ArrowLeft":
        left -= 1;
        break;
      case "ArrowRight":
        left += 1;
        break;
      default:
        return;
    }

    this.overlayImage.style.top = `${top}px`;
    this.overlayImage.style.left = `${left}px`;
    this.updateStateInputs();

    if (this.overlayState.moveable) {
      this.overlayState.moveable.updateRect();
    }

    this.saveState();
  }

  static initialize() {
    new HawkeyeOverlayTool("publishingContainer");
  }

  initPublishingContainer(publishingContainerId) {
    let container = document.getElementById(publishingContainerId);
    if (!container) {
      container = document.createElement("div");
      container.id = publishingContainerId;
      container.className = "publishing-container";
      document.body.appendChild(container);
    }
    this.publishingContainer = container;
  }

  initPanelControls() {
    const toolbar = document.getElementById("hawkeyeToolbar");
    const header = toolbar.querySelector(".hawkeye-head");

    // 토글 버튼 추가
    const toggleButton = document.createElement("button");
    toggleButton.className = "toggle-button";
    toggleButton.innerHTML = "▼";

    // 토글 버튼에 대한 별도의 이벤트 핸들러
    const handleToggleClick = (e) => {
      e.preventDefault(); // 기본 동작 방지
      e.stopPropagation(); // 이벤트 전파 중지
      this.togglePanel();
    };

    // 모바일 터치와 데스크톱 클릭 모두 처리
    toggleButton.addEventListener("click", handleToggleClick);
    toggleButton.addEventListener("touchstart", handleToggleClick, {
      passive: false,
    });

    header.appendChild(toggleButton);

    // 드래그 기능
    const startDrag = (e) => {
      if (e.target === toggleButton) return;
      if (e.type === "touchstart") {
        e.preventDefault();
      }
      this.isDragging = true;
      toolbar.classList.add("dragging");

      const x = e.type === "mousedown" ? e.clientX : e.touches[0].clientX;
      const y = e.type === "mousedown" ? e.clientY : e.touches[0].clientY;
      this.dragOffset = {
        x: x - toolbar.offsetLeft,
        y: y - toolbar.offsetTop,
      };
    };

    const doDrag = (e) => {
      if (!this.isDragging) return;
      e.preventDefault();

      const x = e.type === "mousemove" ? e.clientX : e.touches[0].clientX;
      const y = e.type === "mousemove" ? e.clientY : e.touches[0].clientY;

      let newX = x - this.dragOffset.x;
      let newY = y - this.dragOffset.y;

      const minVisible = 100;
      const maxX = window.innerWidth - toolbar.offsetWidth + minVisible;
      const maxY = window.innerHeight - toolbar.offsetHeight + minVisible;

      newX = Math.max(-minVisible, Math.min(newX, maxX));
      newY = Math.max(-minVisible, Math.min(newY, maxY));

      toolbar.style.left = `${newX}px`;
      toolbar.style.top = `${newY}px`;

      this.saveToolbarState();
    };

    const endDrag = () => {
      this.isDragging = false;
      toolbar.classList.remove("dragging");
    };

    header.addEventListener("mousedown", startDrag);
    document.addEventListener("mousemove", doDrag);
    document.addEventListener("mouseup", endDrag);
    header.addEventListener("touchstart", (e) => {
      e.preventDefault();
      startDrag(e);
    });
    document.addEventListener("touchmove", doDrag);
    document.addEventListener("touchend", endDrag);
  }

  calculateInitialScale() {
    // 반응형 모드에서는 outerWidth가 실제 디바이스 너비를 반영
    const viewportWidth = window.outerWidth || window.innerWidth;

    console.log({
      originalWidth: this.originalWidth,
      viewportWidth,
      ratio: this.originalWidth / viewportWidth,
    });

    const ratio = this.originalWidth / viewportWidth;

    if (ratio < 2) {
      return 1.0;
    }

    const scale = 1 / Math.floor(ratio);
    return Number(scale.toFixed(2));
  }

  togglePanel() {
    const toolbar = document.getElementById("hawkeyeToolbar");
    const toggleButton = toolbar.querySelector(".toggle-button");
    const isCollapsed = toolbar.classList.toggle("collapsed");
    toggleButton.innerHTML = isCollapsed ? "▲" : "▼";
    this.saveToolbarState();
  }

  saveToolbarState() {
    const toolbar = document.getElementById("hawkeyeToolbar");
    const state = {
      collapsed: toolbar.classList.contains("collapsed"),
      position: {
        left: toolbar.style.left,
        top: toolbar.style.top,
      },
    };
    localStorage.setItem("hawkeyeToolbarState", JSON.stringify(state));
  }

  restoreToolbarState() {
    const savedState = localStorage.getItem("hawkeyeToolbarState");
    if (savedState) {
      const state = JSON.parse(savedState);
      const toolbar = document.getElementById("hawkeyeToolbar");

      if (state.collapsed) {
        toolbar.classList.add("collapsed");
        toolbar.querySelector(".toggle-button").innerHTML = "▲";
      }

      if (state.position) {
        toolbar.style.left = state.position.left;
        toolbar.style.top = state.position.top;
      }
    }
  }

  renderUI() {
    const template = `
      <div id="hawkeyeToolbar">
        <div class="hawkeye-head">
          <h1 class="hawkeye-title">호크아이 - UI 대조 검토기</h1>
        </div>
        <div class="hawkeye-body">
          <div class="file-upload-area">
            <input type="file" id="overlayImageInput" accept="image/*" aria-label="오버레이 이미지 선택">
          </div>
          <div class="upload-before">
            <p>이미지 파일을 업로드 하거나, 클립보드의 이미지를 Ctrl + V 로 붙여넣으세요!</p>
          </div>
          <div class="upload-after">
            <div class="controller">
              <div class="opacity-slider">
                <label for="opacitySlider">투명도</label>
                <input type="range" id="opacitySlider" min="0" max="1" step="0.01" value="0.5" disabled>
              </div>
              <div class="button-group">
                <div class="buttons-container">
                  <button id="toggleVisibilityButton" class="btn-toggle">🙉</button>
                  <button id="lockButton" class="btn-lock">🔒</button>
                  <button id="invertColorButton" class="btn-invert">🌗</button>
                </div>
                <div class="buttons-container">
                  <button id="top-left" title="왼쪽상단">↖️</button>
                  <button id="top-right" title="오른쪽상단">↗️</button>
                  <button id="bottom-left" title="왼쪽하단">↙️</button>
                  <button id="bottom-right" title="오른쪽하단">↘️</button>
                  <button id="center" title="중앙">⏺️</button>
                </div>
              </div>
              <div id="stateContainer">
                <label for="xInput">x:</label>
                <input type="number" id="xInput" value="0">
                <label for="yInput">y:</label>
                <input type="number" id="yInput" value="0">
                <label for="scaleInput">scale:</label>
                <input type="number" id="scaleInput" value="1.0" step="0.1">
              </div>
            </div>
            <div class="reset-save-container">
              <button id="resetOverlayButton">초기화</button>
              <button id="saveImageButton">이미지 저장</button>
            </div>
          </div>
        </div>
        <div class="hawkeye-foot">
          <ul>
            <li><a href="http://pms.inseq.co.kr/inuix/hawkeye" target="_blank" title="새창">호크아이 사용법</a></li>
            <li><a href="http://pms.inseq.co.kr/inuix/hawkeye/issues" target="_blank" title="새창">호크아이 오류 제보</a></li>
          </ul>
        </div>
      </div>
    `;

    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = template;
    document.body.appendChild(tempContainer.firstElementChild);
  }

  attachEventListeners() {
    this.overlayImageInput = document.getElementById("overlayImageInput");
    this.opacitySlider = document.getElementById("opacitySlider");
    this.xInput = document.getElementById("xInput");
    this.yInput = document.getElementById("yInput");
    this.scaleInput = document.getElementById("scaleInput");
    this.invertColorButton = document.getElementById("invertColorButton");
    this.lockButton = document.getElementById("lockButton");
    this.resetOverlayButton = document.getElementById("resetOverlayButton");
    this.saveImageButton = document.getElementById("saveImageButton");
    this.toggleVisibilityButton = document.getElementById(
      "toggleVisibilityButton"
    );

    // 파일 입력 이벤트
    this.overlayImageInput.addEventListener("change", (e) =>
      this.loadOverlayImage(e.target)
    );

    // 투명도 슬라이더 이벤트
    this.opacitySlider.addEventListener("input", (e) =>
      this.setOverlayOpacity(e.target.value)
    );

    // x, y 위치 입력 이벤트
    this.xInput.addEventListener("input", (e) => this.updateOverlayPosition());
    this.yInput.addEventListener("input", (e) => this.updateOverlayPosition());

    // 스케일 입력 이벤트
    this.scaleInput.addEventListener("input", (e) => this.updateOverlayScale());

    // 색상 반전 버튼 이벤트
    this.invertColorButton.addEventListener("click", () => {
      this.invertOverlayColor();
      this.invertColorButton.classList.toggle("active");
    });

    // 잠금/해제 버튼 이벤트
    this.lockButton.addEventListener("click", () => {
      this.toggleLockOverlay(this.lockButton);
      this.lockButton.classList.toggle("active");
    });

    // 위치 버튼 이벤트 설정
    document.querySelectorAll(".buttons-container button").forEach((button) => {
      button.addEventListener("click", () => {
        this.setPosition(button.id);
      });
    });

    // 이미지 토글 이벤트 설정
    this.toggleVisibilityButton.title = "이미지 토글 (Alt + V)";
    this.toggleVisibilityButton.addEventListener("click", () => {
      this.toggleOverlayVisibility();
    });

    // 초기화 버튼 이벤트
    this.resetOverlayButton.addEventListener("click", () =>
      this.resetOverlayState()
    );

    // 이미지 저장 버튼 이벤트
    this.saveImageButton.addEventListener("click", () =>
      this.saveCurrentImage()
    );

    // 키보드 단축키 이벤트 추가
    this.addKeyboardShortcuts();
  }

  toggleOverlayVisibility() {
    if (!this.overlayImage) return;

    const isHidden = this.overlayImage.style.visibility === "hidden";
    this.overlayImage.style.visibility = isHidden ? "visible" : "hidden";

    if (this.overlayState.moveable) {
      const moveableElements = document.querySelectorAll(
        ".moveable-control-box, .moveable-line, .moveable-direction"
      );
      moveableElements.forEach((element) => {
        element.style.visibility = isHidden ? "visible" : "hidden";
      });
    }

    this.toggleVisibilityButton.innerHTML = isHidden ? "🙉" : "🙈";
    this.toggleVisibilityButton.classList.toggle("active", !isHidden);
  }

  addKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Alt + V 키 조합으로 이미지 토글
      if (e.altKey && e.key.toLowerCase() === "v") {
        e.preventDefault();
        this.toggleOverlayVisibility();
      }
    });
  }

  setPosition(position) {
    if (this.overlayImage) {
      const scaledWidth = parseFloat(this.overlayImage.style.width);
      const scaledHeight = parseFloat(this.overlayImage.style.height);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      switch (position) {
        case "top-left":
          this.overlayImage.style.left = `${scrollLeft}px`;
          this.overlayImage.style.top = `${scrollTop}px`;
          break;
        case "top-right":
          this.overlayImage.style.left = `${
            scrollLeft + viewportWidth - scaledWidth
          }px`;
          this.overlayImage.style.top = `${scrollTop}px`;
          break;
        case "bottom-left":
          this.overlayImage.style.left = `${scrollLeft}px`;
          this.overlayImage.style.top = `${
            scrollTop + viewportHeight - scaledHeight
          }px`;
          break;
        case "bottom-right":
          this.overlayImage.style.left = `${
            scrollLeft + viewportWidth - scaledWidth
          }px`;
          this.overlayImage.style.top = `${
            scrollTop + viewportHeight - scaledHeight
          }px`;
          break;
        case "center":
          this.overlayImage.style.left = `${
            scrollLeft + (viewportWidth - scaledWidth) / 2
          }px`;
          this.overlayImage.style.top = `${
            scrollTop + (viewportHeight - scaledHeight) / 2
          }px`;
          break;
        default:
          break;
      }

      this.updateStateInputs();
      if (this.overlayState.moveable) {
        this.overlayState.moveable.updateTarget();
      }
    }
  }

  loadOverlayImage(inputElement) {
    const file = inputElement.files[0];
    if (file) {
      this.displayOverlayImage(file);
    }
  }

  async displayOverlayImage(file, callback) {
    try {
      // 새 이미지 업로드시에만 상태 초기화
      if (!this.isRestoringState) {
        await this.clearStorageState();
      }
  
      // 기존 이미지와 Moveable 정리
      if (this.overlayImage) {
        if (this.overlayImage.src) {
          URL.revokeObjectURL(this.overlayImage.src);
        }
        if (this.overlayState.moveable) {
          this.overlayState.moveable.destroy();
          this.overlayState.moveable = null;
        }
      } else {
        this.overlayImage = document.createElement("img");
        this.overlayImage.id = "hawkeyeOverlayImage";
        this.publishingContainer.insertBefore(
          this.overlayImage,
          this.publishingContainer.firstChild
        );
      }
  
      return new Promise((resolve) => {
        this.overlayImage.onload = () => {
          this.originalWidth = this.overlayImage.naturalWidth;
          this.originalHeight = this.overlayImage.naturalHeight;
  
          if (!this.isRestoringState) {
            this.currentScale = this.calculateInitialScale();
          }
  
          // 크기 설정
          this.overlayImage.style.width = `${this.originalWidth * this.currentScale}px`;
          this.overlayImage.style.height = `${this.originalHeight * this.currentScale}px`;
  
          // 기본 설정
          this.overlayImage.style.visibility = "visible";
          this.overlayImage.style.position = "absolute";
          this.overlayImage.style.transformOrigin = "top left";
          
          if (!this.isRestoringState) {
            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
            this.overlayImage.style.top = `${scrollTop}px`;
            this.overlayImage.style.left = `${scrollLeft}px`;
          }
  
          this.overlayImage.style.opacity = this.opacitySlider.value;
          this.setOverlayOpacity(this.opacitySlider.value);
          this.opacitySlider.disabled = false;
  
          this.overlayState.initialState = {
            width: this.originalWidth,
            height: this.originalHeight,
            top: parseInt(this.overlayImage.style.top),
            left: parseInt(this.overlayImage.style.left),
            scale: this.currentScale,
          };
  
          document.querySelector(".upload-before").style.display = "none";
          document.querySelector(".upload-after").style.display = "flex";
  
          this.updateStateInputs();
          
          // 새 이미지일 때만 상태 저장
          if (!this.isRestoringState) {
            this.saveState();
          }
  
          // Moveable 초기화는 모든 설정 완료 후
          this.initializeMoveable(this.overlayImage);
          
          if (typeof callback === "function") {
            callback();
          }
          
          resolve();
        };
  
        this.overlayImage.onerror = () => {
          console.error(`Failed to load image: ${file.name}`);
          resolve();
        };
  
        this.overlayImage.src = URL.createObjectURL(file);
      });
    } catch (error) {
      console.error("Error in displayOverlayImage:", error);
      throw error;
    }
  }

  setOverlayOpacity(value) {
    if (this.overlayImage) {
      this.overlayImage.style.opacity = value;
      this.saveState();
    }
  }

  invertOverlayColor() {
    if (this.overlayImage) {
      const currentFilter = this.overlayImage.style.filter;
      if (currentFilter.includes("invert(1)")) {
        this.overlayImage.style.filter = currentFilter.replace("invert(1)", "");
      } else {
        this.overlayImage.style.filter += " invert(1)";
      }
    }
  }

  toggleLockOverlay(button) {
    if (this.overlayImage) {
      if (this.overlayState.locked) {
        this.overlayImage.style.pointerEvents = "auto";
        this.overlayImage.style.userSelect = "auto";
        this.overlayState.locked = false;

        this.initializeMoveable(this.overlayImage);
      } else {
        this.overlayImage.style.pointerEvents = "none";
        this.overlayImage.style.userSelect = "none";
        this.overlayState.locked = true;

        if (this.overlayState.moveable) {
          this.overlayState.moveable.destroy();
          this.overlayState.moveable = null;
        }
      }
    }
  }

  async resetOverlayState() {
    try {
      // 진행 중인 저장 작업 취소
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }

      // 스토리지 초기화
      await this.clearStorageState();

      // 기존의 UI 초기화 로직
      if (this.overlayImage) {
        if (this.overlayImage.src) {
          URL.revokeObjectURL(this.overlayImage.src);
        }
        this.overlayImage.remove();
        this.overlayImage = null;

        this.xInput.value = 0;
        this.yInput.value = 0;
        this.scaleInput.value = 1.0;
        this.opacitySlider.value = 0.5;
        this.opacitySlider.disabled = true;
        this.overlayImageInput.value = "";

        this.overlayState.locked = false;
        this.lockButton.classList.remove("active");
        this.invertColorButton.classList.remove("active");

        if (this.overlayState.moveable) {
          this.overlayState.moveable.destroy();
          this.overlayState.moveable = null;
        }

        document.querySelector(".upload-before").style.display = "flex";
        document.querySelector(".upload-after").style.display = "none";
      }

      // 현재 메모리 상태 초기화
      this.currentScale = 1.0;
      this.originalWidth = 0;
      this.originalHeight = 0;
      this.isRestoringState = false;

    } catch (error) {
      console.error("Reset state failed:", error);
      throw error;
    }
  }

  saveCurrentImage() {
    alert("기능 준비중입니다.");
    // if (this.overlayImage) {
    //   html2canvas(document.body, {
    //     windowWidth: document.documentElement.scrollWidth,
    //     windowHeight: document.documentElement.scrollHeight,
    //   }).then((canvas) => {
    //     const link = document.createElement("a");
    //     link.href = canvas.toDataURL("image/png");
    //     link.download = "screenshot.png";
    //     link.click();
    //   });
    // }
  }

  initializeMoveable(target) {
    if (this.overlayState.moveable) {
      this.overlayState.moveable.destroy();
    }

    this.overlayState.moveable = new Moveable(this.publishingContainer, {
      target: target,
      draggable: true,
      scalable: false,
      resizable: true,
      keepRatio: true,
      origin: false,
      throttleResize: 0,
    });

    this.overlayState.moveable.on("drag", ({ target, left, top }) => {
      target.style.left = `${left}px`;
      target.style.top = `${top}px`;
      this.updateStateInputs();
    });

    this.overlayState.moveable.on("dragEnd", () => {
      this.saveState();
    });

    // this.overlayState.moveable.on("scale", ({ target, transform, scale }) => {
    //   target.style.transform = transform;
    //   this.currentScale = scale[0];
    //   this.updateStateInputs();
    // });

    // this.overlayState.moveable.on("scaleEnd", () => {
    //   this.saveState();
    // });

    this.overlayState.moveable.on(
      "resize",
      ({ target, width, height, drag }) => {
        // 이미지 크기 직접 변경
        target.style.width = `${width}px`;
        target.style.height = `${height}px`;
        target.style.left = `${drag.left}px`;
        target.style.top = `${drag.top}px`;

        // 스케일 값 업데이트 (currentScale을 덮어쓰지 않음)
        if (this.originalWidth && this.originalHeight) {
          const calculatedScale = width / this.originalWidth;
          this.scaleInput.value = calculatedScale.toFixed(2);
          this.updateStateInputs();
        }
      }
    );

    this.overlayState.moveable.on("resizeEnd", () => {
      this.saveState(); // resize 완료 시 상태 저장
    });
  }

  updateStateInputs() {
    if (this.overlayImage) {
      const rect = this.overlayImage.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
      this.xInput.value = Math.round(rect.left + scrollLeft);
      this.yInput.value = Math.round(rect.top + scrollTop);

      // currentScale을 덮어쓰지 않고, 계산된 스케일을 임시 변수로 사용
      const width = parseFloat(this.overlayImage.style.width);
      const calculatedScale = width / this.originalWidth;
      this.scaleInput.value = calculatedScale.toFixed(2);
    }
  }

  updateOverlayPosition() {
    if (this.overlayImage) {
      const x = parseInt(this.xInput.value) || 0;
      const y = parseInt(this.yInput.value) || 0;
      this.overlayImage.style.left = `${x}px`;
      this.overlayImage.style.top = `${y}px`;
      if (this.overlayState.moveable) {
        this.overlayState.moveable.updateRect();
      }
      this.saveState();
    }
  }

  updateOverlayScale() {
    if (this.overlayImage) {
      const scaleValue = parseFloat(this.scaleInput.value);
      if (isNaN(scaleValue) || scaleValue <= 0) {
        this.scaleInput.value = this.currentScale.toFixed(2);
        return;
      }

      this.currentScale = scaleValue;
      this.overlayImage.style.width = `${
        this.originalWidth * this.currentScale
      }px`;
      this.overlayImage.style.height = `${
        this.originalHeight * this.currentScale
      }px`;

      if (this.overlayState.moveable) {
        this.overlayState.moveable.updateRect();
      }
      this.updateStateInputs();
      this.saveState();
    }
  }

  addClipboardImageHandler() {
    document.addEventListener("paste", (event) => {
      const items = (event.clipboardData || event.originalEvent.clipboardData)
        .items;
      for (const item of items) {
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            this.displayOverlayImage(file);
          }
        }
      }
    });
  }

  addArrowKeyHandler() {
    document.addEventListener("keydown", (event) => {
      if (
        document.activeElement.tagName === "INPUT" ||
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (this.overlayImage) {
        if (
          ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
            event.key
          )
        ) {
          event.preventDefault();
        }
        let top = parseInt(this.overlayImage.style.top) || 0;
        let left = parseInt(this.overlayImage.style.left) || 0;

        switch (event.key) {
          case "ArrowUp":
            top -= 1;
            break;
          case "ArrowDown":
            top += 1;
            break;
          case "ArrowLeft":
            left -= 1;
            break;
          case "ArrowRight":
            left += 1;
            break;
          default:
            return;
        }

        this.overlayImage.style.top = `${top}px`;
        this.overlayImage.style.left = `${left}px`;
        this.updateStateInputs();
        if (this.overlayState.moveable) {
          this.overlayState.moveable.updateRect();
        }
      }
    });
  }

  // 상태 저장
  saveState() {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      try {
        if (!this.overlayImage) return;
  
        const state = {
          key: this.STORAGE_KEY,
          imageBase64: this.getBase64Image(),
          position: {
            x: parseInt(this.xInput.value) || 0,
            y: parseInt(this.yInput.value) || 0,
          },
          scale: parseFloat(this.scaleInput.value) || this.currentScale || 1.0,
          originalWidth: this.originalWidth,
          originalHeight: this.originalHeight,
          opacity: parseFloat(this.opacitySlider.value) || 0.5,
          isInverted: this.invertColorButton.classList.contains("active"),
          isLocked: this.overlayState.locked,
          isHidden: this.overlayImage.style.visibility === "hidden",
        };
  
        if (!this.db) {
          await this.initIndexedDB();
        }
  
        const transaction = this.db.transaction(["states"], "readwrite");
        const store = transaction.objectStore("states");
        await store.put(state);
      } catch (error) {
        console.error("State save failed:", error);
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
          console.error("Fallback save failed:", e);
        }
      }
    }, 300);
  }

  // 상태 복원
  async restoreState() {
    try {
      if (!this.db) {
        await this.initIndexedDB();
      }

      const transaction = this.db.transaction(["states"], "readonly");
      const store = transaction.objectStore("states");
      const request = store.get(this.STORAGE_KEY);

      request.onsuccess = () => {
        const state = request.result;
        if (!state) {
          // IndexedDB에 없으면 localStorage 확인
          const savedState = localStorage.getItem(this.STORAGE_KEY);
          if (savedState) {
            this.restoreFromState(JSON.parse(savedState));
          }
          return;
        }
        this.restoreFromState(state);
      };
    } catch (error) {
      console.error("State restore failed:", error);
      // 복원 실패 시 localStorage fallback
      const savedState = localStorage.getItem(this.STORAGE_KEY);
      if (savedState) {
        this.restoreFromState(JSON.parse(savedState));
      }
    }
  }

  // 상태로부터 복원하는 헬퍼 메서드
  restoreFromState(state) {
    if (!state || !state.imageBase64) return;

    this.isRestoringState = true;

    fetch(state.imageBase64)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "restored.png", { type: "image/png" });
        this.currentScale = parseFloat(state.scale) || 1.0;

        this.displayOverlayImage(file, () => {
          this.overlayImage.style.left = `${state.position.x}px`;
          this.overlayImage.style.top = `${state.position.y}px`;
          this.opacitySlider.value = state.opacity;
          this.setOverlayOpacity(state.opacity);

          if (this.overlayState.moveable) {
            this.overlayState.moveable.updateRect();
          }

          this.updateStateInputs();

          if (state.isInverted) {
            this.invertOverlayColor();
            this.invertColorButton.classList.add("active");
          }
          if (state.isLocked) {
            this.toggleLockOverlay(this.lockButton);
          }
          if (state.isHidden) {
            this.toggleOverlayVisibility();
          }

          this.isRestoringState = false;
        });
      });
  }

  // Base64 이미지 얻기
  getBase64Image() {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.overlayImage.naturalWidth;
      canvas.height = this.overlayImage.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(this.overlayImage, 0, 0);

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Failed to convert image to Base64:", error);
      return null;
    }
  }
}

// 자동 초기화
HawkeyeOverlayTool.initialize();