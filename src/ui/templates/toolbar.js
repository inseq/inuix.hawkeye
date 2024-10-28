const pkg = require('../../../package.json');

export const toolbarTemplate = `
  <div id="hawkeyeToolbar">
    <div class="hawkeye-head">
      <div class="title-container">
        <h1 class="hawkeye-title">호크아이 - UI 대조 검토기</h1>
        <button class="toggle-button">▼</button>
      </div>
    </div>
    <div class="hawkeye-body">
      <div class="file-upload-area">
        <input type="file" id="overlayImageInput" accept="image/*" aria-label="오버레이 이미지 선택">
      </div>
      <div class="upload-before">
        <p>이미지 파일을 업로드 하거나,<br> 클립보드 이미지를 Ctrl + V로 붙여넣으세요!</p>
      </div>
      <div class="upload-after">
        <div class="controller">
          <div class="opacity-slider">
            <label for="opacitySlider">투명도</label>
            <input type="range" id="opacitySlider" min="0" max="1" step="0.01" value="0.5" disabled>
          </div>
          <div class="button-group">
            <div class="buttons-container">
              <button id="toggleVisibilityButton" class="btn-toggle" title="이미지 on/off">🙉</button>
              <button id="lockButton" class="btn-lock" title="잠금 및 해제">🔒</button>
              <button id="invertColorButton" class="btn-invert" title="색상 반전">🌗</button>
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
      <li><a href="http://pms.inseq.co.kr/inuix/hawkeye" target="_blank" title="새창">📖 호크아이 사용법</a></li>
      <li><a href="http://pms.inseq.co.kr/inuix/hawkeye/issues" target="_blank" title="새창">🐞 오류제보 및 개선제안</a></li>
      </ul>
      <p class="copyright">
        <span>Hawkeye v${pkg.version}</span>
        <a href="https://inseq.co.kr" target="_blank" title="새창">©inseq</a>
      </p>
    </div>
  </div>
`;