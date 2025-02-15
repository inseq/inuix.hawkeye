const pkg = require('../../../package.json');

export const toolbarTemplate = (config) => `
  <div id="hawkeyeToolbar">
    <div class="hawkeye-head">
      <div class="title-container">
        <h1 class="hawkeye-title">호크아이 - UI QA Tool</h1>
        <button class="toggle-button" title="Alt + \`">▼</button>
      </div>
    </div>
    <div class="hawkeye-body">
      <div class="file-upload-area">
        <input type="file" id="overlayImageInput" accept="image/*" aria-label="오버레이 이미지 선택">
      </div>
      <div class="url-input-area" id="natashaArea" style="display: ${config.features.natasha.enabled ? 'flex' : 'none'}">
        <input type="text" 
          class="form-control" 
          id="url-val" 
          placeholder="예) /demos/example2.html" 
          title="절대경로 입력"
          value="${config.defaultState.natashaLastPath || ''}">
        <button type="button" 
          id="call-markup" 
          class="btn-url-capture" 
          title="캡쳐할 URL">캡쳐해오기</button>
      </div>
      <div class="upload-before">
        <p>이미지 파일을 업로드하거나 <br>클립보드 이미지를 Ctrl + V로 붙여넣으세요!</p>
      </div>
      <div class="upload-after">
        <div class="controller">
          <div class="opacity-slider">
            <label for="opacitySlider">투명도</label>
            <input type="range" id="opacitySlider" min="0" max="1" step="0.01" value="0.5" disabled>
          </div>
          <div class="button-group">
            <div class="buttons-container">
              <button type="button" id="toggleVisibilityButton" class="btn-toggle" title="가시성 on/off\nAlt + V">🙉</button>
              <button type="button" id="lockButton" class="btn-lock" title="마우스 잠금\nAlt + L">🔒</button>
              <button type="button" id="invertColorButton" class="btn-invert" title="색상 반전\nAlt + D">🌗</button>
            </div>
            <div class="buttons-container">
              <button type="button" id="top-left" title="왼쪽상단">↖️</button>
              <button type="button" id="top-right" title="오른쪽상단">↗️</button>
              <button type="button" id="bottom-left" title="왼쪽하단">↙️</button>
              <button type="button" id="bottom-right" title="오른쪽하단">↘️</button>
              <button type="button" id="center" title="너비중앙">⏺️</button>
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