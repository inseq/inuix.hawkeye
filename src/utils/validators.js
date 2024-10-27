export class Validators {
  static validateConfig(config) {
    const errors = [];

    // 필수 필드 검증
    const requiredFields = [
      'enabled',
      'ui.containerId', 
      'ui.toolbarId', 
      'ui.overlayId'
    ];

    requiredFields.forEach(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], config);
      if (value === undefined) {
        errors.push(`필수 설정 누락: ${field}`);
      }
    });

    // 타입 검증
    if (typeof config.enabled !== 'boolean') {
      errors.push('enabled는 boolean 타입이어야 합니다');
    }

    if (config.pms?.enabled !== undefined && typeof config.pms.enabled !== 'boolean') {
      errors.push('pms.enabled는 boolean 타입이어야 합니다');
    }

    if (config.pms?.domain && typeof config.pms.domain !== 'string') {
      errors.push('pms.domain은 문자열이어야 합니다');
    }

    // domains 객체 검증
    if (config.domains && typeof config.domains !== 'object') {
      errors.push('domains는 객체 형식이어야 합니다');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // 기존 메서드들은 그대로 유지
  static validateImageFile(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File size exceeds 10MB limit');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validatePosition(x, y) {
    return {
      x: typeof x === 'number' ? x : parseInt(x) || 0,
      y: typeof y === 'number' ? y : parseInt(y) || 0
    };
  }

  static validateScale(scale) {
    const parsedScale = parseFloat(scale);
    if (isNaN(parsedScale) || parsedScale <= 0) {
      return 1.0;
    }
    return parsedScale;
  }

  static validateOpacity(opacity) {
    const parsedOpacity = parseFloat(opacity);
    if (isNaN(parsedOpacity)) return 0.5;
    return Math.max(0, Math.min(1, parsedOpacity));
  }
}

// ErrorHandler 클래스는 그대로 유지
export class ErrorHandler {
  static handle(error, context = '') {
    console.error(`[Hawkeye Error] ${context}:`, error);
    
    if (error instanceof TypeError) {
      return '타입 에러가 발생했습니다.';
    } else if (error instanceof ReferenceError) {
      return '참조 에러가 발생했습니다.';
    } else {
      return '오류가 발생했습니다.';
    }
  }

  static async wrapAsync(fn, context = '') {
    try {
      return await fn();
    } catch (error) {
      ErrorHandler.handle(error, context);
      throw error;
    }
  }
}