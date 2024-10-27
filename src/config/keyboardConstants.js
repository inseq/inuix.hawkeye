export const KeyboardShortcuts = {
  TOGGLE_VISIBILITY: {
    key: 'v',
    modifier: 'alt',
    description: '이미지 토글'
  },
  MOVE_UP: {
    key: 'ArrowUp',
    description: '위로 1px 이동'
  },
  MOVE_DOWN: {
    key: 'ArrowDown',
    description: '아래로 1px 이동'
  },
  MOVE_LEFT: {
    key: 'ArrowLeft',
    description: '왼쪽으로 1px 이동'
  },
  MOVE_RIGHT: {
    key: 'ArrowRight',
    description: '오른쪽으로 1px 이동'
  }
};

export const MouseControls = {
  DRAG: {
    description: '이미지 드래그하여 이동'
  },
  RESIZE: {
    description: '모서리 핸들로 크기 조절'
  }
};

export const ControlButtons = {
  POSITION: [
    { id: 'top-left', label: '↖️', title: '왼쪽상단' },
    { id: 'top-right', label: '↗️', title: '오른쪽상단' },
    { id: 'bottom-left', label: '↙️', title: '왼쪽하단' },
    { id: 'bottom-right', label: '↘️', title: '오른쪽하단' },
    { id: 'center', label: '⏺️', title: '중앙' }
  ],
  ACTIONS: [
    { id: 'toggleVisibilityButton', label: '🙉', title: '이미지 토글 (Alt + V)' },
    { id: 'lockButton', label: '🔒', title: '이미지 잠금' },
    { id: 'invertColorButton', label: '🌗', title: '색상 반전' }
  ]
};