export class StateManager {
  constructor(config = {}) {
    this.config = config;
    this.db = null;
    this.saveTimeout = null;
    this.STORAGE_KEY =
      config.storageKeys?.state || `hawkeye_${window.location.pathname}`;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return true;
      }

      await this.initIndexedDB();
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error("Failed to initialize StateManager:", error);
      return false;
    }
  }

  async initIndexedDB() {
    return new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open("hawkeyeDB", 1);

        request.onerror = () => {
          console.error("IndexedDB open failed:", request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;

          // DB 연결 끊김 감지
          this.db.onversionchange = () => {
            this.db.close();
            this.isInitialized = false;
            console.warn("Database is outdated, please reload the page");
          };

          // 에러 이벤트 전역 처리
          this.db.onerror = (event) => {
            console.error("Database error:", event.target.error);
          };

          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains("states")) {
            db.createObjectStore("states", { keyPath: "key" });
          }
        };
      } catch (error) {
        console.error("IndexedDB initialization failed:", error);
        reject(error);
      }
    });
  }

  async saveState(state) {
    if (!state) {
      console.warn("Invalid state provided to saveState");
      return;
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    return new Promise((resolve, reject) => {
      this.saveTimeout = setTimeout(async () => {
        try {
          if (!this.isInitialized || !this.db) {
            await this.initialize();
          }

          // 상태 유효성 검사
          if (!this.validateState(state)) {
            throw new Error("Invalid state structure");
          }

          const stateToSave = {
            key: this.STORAGE_KEY,
            ...state,
            timestamp: Date.now(),
          };

          // IndexedDB 저장 시도
          const transaction = this.db.transaction(["states"], "readwrite");
          const store = transaction.objectStore("states");

          transaction.oncomplete = () => {
            // IndexedDB 저장 성공 시 localStorage 백업 생략
            resolve();
          };

          transaction.onerror = (event) => {
            console.error("Transaction failed:", event.target.error);
            // IndexedDB 실패 시 localStorage로 백업 시도
            try {
              localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(stateToSave)
              );
              resolve();
            } catch (e) {
              console.warn("Failed to backup to localStorage:", e);
              reject(e);
            }
          };

          const request = store.put(stateToSave);
          request.onerror = () => {
            console.error("Store put failed:", request.error);
            transaction.abort();
          };
        } catch (error) {
          console.error("State save failed:", error);
          // IndexedDB 초기화 실패 시 localStorage로 백업 시도
          try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
            resolve();
          } catch (e) {
            console.warn("Failed to backup to localStorage:", e);
            reject(e);
          }
        }
      }, 300);
    });
  }

  async getState() {
    console.log('[StateManager] Getting state...');
    
    try {
        if (!this.isInitialized || !this.db) {
            console.log('[StateManager] Initializing DB for getState');
            await this.initialize();
        }

        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction(["states"], "readonly");
                const store = transaction.objectStore("states");
                const request = store.get(this.STORAGE_KEY);

                request.onsuccess = () => {
                    const state = request.result;
                    console.log('[StateManager] Retrieved state:', state);
                    
                    if (!state) {
                        // IndexedDB에 데이터가 없는 경우 localStorage 확인
                        try {
                            const savedState = localStorage.getItem(this.STORAGE_KEY);
                            console.log('[StateManager] Fallback to localStorage:', savedState);
                            
                            if (savedState) {
                                const parsedState = JSON.parse(savedState);
                                // localStorage의 데이터를 IndexedDB에 동기화
                                this.saveState(parsedState).catch(console.error);
                                resolve(parsedState);
                            } else {
                                resolve(null);
                            }
                        } catch (e) {
                            console.warn('[StateManager] Failed to read from localStorage:', e);
                            resolve(null);
                        }
                        return;
                    }
                    resolve(state);
                };

                request.onerror = () => {
                    console.error('[StateManager] Failed to read from IndexedDB:', request.error);
                    // localStorage fallback
                    try {
                        const savedState = localStorage.getItem(this.STORAGE_KEY);
                        resolve(savedState ? JSON.parse(savedState) : null);
                    } catch (e) {
                        console.error('[StateManager] Failed to read from localStorage:', e);
                        resolve(null);
                    }
                };
            } catch (error) {
                console.error('[StateManager] Transaction failed:', error);
                reject(error);
            }
        });
    } catch (error) {
        console.error('[StateManager] Failed to get state:', error);
        return null;
    }
}

  async clearState() {
    try {
      if (!this.isInitialized || !this.db) {
        await this.initialize();
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["states"], "readwrite");

        transaction.oncomplete = () => {
          // IndexedDB 삭제 성공 후 localStorage 정리
          try {
            localStorage.removeItem(this.STORAGE_KEY);
          } catch (e) {
            console.warn("Failed to remove from localStorage:", e);
          }
          resolve();
        };

        transaction.onerror = (event) => {
          console.error("Clear state transaction failed:", event.target.error);
          reject(event.target.error);
        };

        const store = transaction.objectStore("states");
        const request = store.delete(this.STORAGE_KEY);

        request.onerror = () => {
          console.error("Clear state request failed:", request.error);
          transaction.abort();
        };
      });
    } catch (error) {
      console.error("Failed to clear state:", error);
      // 최후의 수단으로 localStorage만이라도 정리
      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (e) {
        console.warn("Failed to remove from localStorage:", e);
      }
      throw error;
    }
  }

  validateState(state) {
    console.log('[StateManager] Validating state:', state);

    // 기본적인 상태 구조 검증
    const requiredProperties = [
        "position", "scale", "opacity",
        "isHidden", "isLocked", "isInverted"
    ];
    
    const missingProps = requiredProperties.filter(prop => !(prop in state));
    if (missingProps.length > 0) {
        console.warn('[StateManager] Missing properties:', missingProps);
        return false;
    }

    // 각 속성의 타입 검증 결과를 저장
    const validationResults = {
        position: state.position && 
                 typeof state.position.x === 'number' && 
                 typeof state.position.y === 'number',
        scale: typeof state.scale === 'number',
        opacity: typeof state.opacity === 'number',
        isHidden: typeof state.isHidden === 'boolean',
        isLocked: typeof state.isLocked === 'boolean',
        isInverted: typeof state.isInverted === 'boolean'
    };

    // 실패한 타입 검증 결과 확인
    const invalidProps = Object.entries(validationResults)
        .filter(([_, isValid]) => !isValid)
        .map(([prop]) => prop);

    if (invalidProps.length > 0) {
        console.warn('[StateManager] Invalid property types:', invalidProps);
        return false;
    }

    console.log('[StateManager] State validation successful');
    return true;
}

  async saveToolbarState(state) {
    if (!state) return;

    try {
      localStorage.setItem(
        this.config.storageKeys.toolbar,
        JSON.stringify({
          ...state,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Failed to save toolbar state:", error);
    }
  }

  getToolbarState() {
    try {
      const savedState = localStorage.getItem(this.config.storageKeys.toolbar);
      return savedState ? JSON.parse(savedState) : null;
    } catch (error) {
      console.error("Failed to get toolbar state:", error);
      return null;
    }
  }

  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
  }
}
