export class VisibilityManager {
  constructor(config) {
    this.config = config;
    this.currentDomain = window.location.hostname;
    this.currentPath = window.location.pathname;
  }

  async checkVisibility() {
    try {
      // 전역 활성화 여부 체크
      if (!this.config.enabled) {
        console.info('[Hawkeye] 전역 설정에 의해 비활성화됨');
        return false;
      }

      // 개발 환경 체크
      if (this.isDevelopment()) {
        return true;
      }

      // 도메인 체크
      if (!this.checkDomain()) {
        console.info(`[Hawkeye] ${this.currentDomain} 도메인에서 비활성화됨`);
        return false;
      }

      // URL 패턴 체크
      if (!this.checkUrlPattern()) {
        console.info(`[Hawkeye] URL 패턴 불일치: ${this.currentPath}`);
        return false;
      }

      // PMS 환경에서 브랜치 체크
      if (this.isPMSEnvironment() && this.config.pms?.enabled) {
        const branchEnabled = await this.checkBranch();
        if (!branchEnabled) {
          console.info('[Hawkeye] 현재 브랜치에서 비활성화됨');
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[Hawkeye] 노출 여부 확인 중 오류:', error);
      return false;
    }
  }

  isDevelopment() {
    return (
      this.currentDomain === 'localhost' ||
      this.currentDomain === '127.0.0.1' ||
      this.currentDomain.includes('.local') ||
      window.location.port === '8080'
    );
  }

  isPMSEnvironment() {
    return this.currentDomain === this.config.pms?.domain;
  }

  checkDomain() {
    const { domains, ipRanges } = this.config;

    // IP 대역 체크
    if (ipRanges && ipRanges.length > 0) {
      // 문자열 패턴을 정규식으로 변환하여 체크
      const isInAllowedRange = ipRanges.some(range => {
        const regexPattern = range.replace(/\./g, '\\.') + '.*';
        return new RegExp(`^${regexPattern}`).test(this.currentDomain);
      });
      if (isInAllowedRange) return true;
    }

    // 기존 도메인 체크 로직
    if (!domains || Object.keys(domains).length === 0) {
      return true;
    }

    if (domains[this.currentDomain] !== undefined) {
      return domains[this.currentDomain];
    }

    for (const [domain, enabled] of Object.entries(domains)) {
      if (this.currentDomain.endsWith(`.${domain}`)) {
        return enabled;
      }
    }

    return true;
  }

  checkUrlPattern() {
    if (!this.config.urlPatterns || this.config.urlPatterns.length === 0) {
      return true; // URL 패턴이 없으면 모든 URL 허용
    }

    return this.config.urlPatterns.some(pattern => {
      if (pattern === '*') return true;
      if (pattern instanceof RegExp) {
        return pattern.test(this.currentPath);
      }
      return this.matchWildcard(this.currentPath, pattern);
    });
  }

  async checkBranch() {
    try {
      const branchName = this.extractBranchFromUrl();
      if (!branchName) return true; // 브랜치를 확인할 수 없는 경우 허용

      const branchConfig = this.config.pms?.branches;
      if (!branchConfig) return true;

      // 정확한 브랜치명 매칭
      if (branchConfig[branchName] !== undefined) {
        return branchConfig[branchName];
      }

      // 와일드카드 패턴 매칭
      for (const [pattern, enabled] of Object.entries(branchConfig)) {
        if (pattern.includes('*') && this.matchWildcard(branchName, pattern)) {
          return enabled;
        }
      }

      return true; // 설정되지 않은 브랜치는 기본적으로 허용
    } catch (error) {
      console.error('[Hawkeye] 브랜치 확인 중 오류:', error);
      return true; // 오류 발생 시 안전하게 허용
    }
  }

  extractBranchFromUrl() {
    try {
      // PMS URL 패턴 매칭: /그룹/프로젝트/files/브랜치/경로
      const matches = this.currentPath.match(/\/[^/]+\/[^/]+\/files\/([^/]+)/);
      if (!matches) return null;

      // URL 인코딩된 브랜치명 디코딩
      return decodeURIComponent(matches[1]);
    } catch (error) {
      console.error('[Hawkeye] 브랜치명 추출 중 오류:', error);
      return null;
    }
  }

  matchWildcard(text, pattern) {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`).test(text);
  }
}