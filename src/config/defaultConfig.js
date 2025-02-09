export const DefaultConfig = {
  // 전역 활성화 여부
  enabled: true,

  // 도메인별 활성화 설정
  domains: {
    'pms.inseq.co.kr': true,
    'dev.inseq.co.kr': true,
    'localhost': true,
    '127.0.0.1': true
  },

  // IP 대역 설정 추가
  ipRanges: [
    '192.168.',  // 192.168.x.x
    // '10.',       // 10.x.x.x
  ],

  // PMS 환경 설정
  pms: {
    enabled: true,
    domain: 'pms.inseq.co.kr',
    branches: {
      'master': false,
      'develop': true,
      'release/*': true,
      'feature/*': true,
      'hotfix/*': true
    }
  },

  // URL 패턴 설정 (기존 유지)
  urlPatterns: ['*'],
  
  // 스토리지 키 설정 (기존 유지)
  storageKeys: {
    state: `hawkeye_${window.location.pathname}`,
    toolbar: 'hawkeyeToolbarState'
  },
  
  // UI 설정
  ui: {
    containerId: 'publishingContainer',
    toolbarId: 'hawkeyeToolbar',
    overlayId: 'hawkeyeOverlayImage',
    natasha: {
      enabled: true,           // 나타샤 기능 활성화 여부
      baseUrl: '',            // 나타샤 서버 기본 URL (비어있으면 현재 도메인 사용)
      allowedPaths: ['*'],    // 허용된 경로 패턴
      timeout: 5000,          // 요청 타임아웃 (ms)
    }
  },
  
  // 기본 상태에 나타샤 관련 상태 추가
  defaultState: {
    opacity: 0.5,
    scale: 1.0,
    position: { x: 0, y: 0 },
    isLocked: false,
    isInverted: false,
    isHidden: false,
    natashaLastPath: ''      // 마지막으로 사용한 나타샤 경로 저장
  },

  features: {
    natasha: {
      enabled: false,           // 나타샤 기능 활성화 여부
      baseUrl: '',            // 나타샤 서버 기본 URL
      allowedPaths: ['*'],    // 허용된 경로 패턴
      timeout: 5000,          // 요청 타임아웃 (ms)
    }
  }
};

/**
 * 설정 검증 규칙
 */
export const ValidationRules = {
  required: [
    'enabled',
    'ui.containerId',
    'ui.toolbarId',
    'ui.overlayId',
    'ui.natasha.enabled'
  ],
  types: {
    'enabled': 'boolean',
    'pms.enabled': 'boolean',
    'pms.domain': 'string',
    'ui.containerId': 'string',
    'ui.toolbarId': 'string',
    'ui.overlayId': 'string',
    'ui.natasha.enabled': 'boolean',
    'ui.natasha.baseUrl': 'string',
    'ui.natasha.timeout': 'number'
  }
};