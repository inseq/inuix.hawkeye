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
  
  // UI 설정 (기존 유지)
  ui: {
    containerId: 'publishingContainer',
    toolbarId: 'hawkeyeToolbar',
    overlayId: 'hawkeyeOverlayImage'
  },
  
  // 기본 상태 (기존 유지)
  defaultState: {
    opacity: 0.5,
    scale: 1.0,
    position: { x: 0, y: 0 },
    isLocked: false,
    isInverted: false,
    isHidden: false
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
    'ui.overlayId'
  ],
  types: {
    'enabled': 'boolean',
    'pms.enabled': 'boolean',
    'pms.domain': 'string',
    'ui.containerId': 'string',
    'ui.toolbarId': 'string',
    'ui.overlayId': 'string'
  }
};