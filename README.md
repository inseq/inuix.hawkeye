다음은 프로젝트명을 **호크아이(Hawkeye)**로 변경한 최종 README입니다.

---

# **Hawkeye - Image Overlay Comparison Tool**

## **프로젝트 설명**

**Hawkeye**는 두 개의 이미지를 업로드하여 반투명하게 겹쳐 비교할 수 있는 웹 도구입니다. 사용자는 이미지 투명도를 조절하거나, 클립보드에서 이미지를 붙여넣거나 드래그 앤 드롭을 통해 이미지를 업로드할 수 있습니다. 또한, 픽셀 단위로 이미지 차이점을 감지하는 기능도 포함되어 있어, 디자인 시안과 퍼블리싱 산출물 간의 차이점을 시각적으로 분석할 수 있습니다.

## **기술 스택**

- **HTML**: 웹 페이지의 기본 구조
- **CSS**: 레이아웃 및 스타일링
- **JavaScript**: 이미지 업로드, 투명도 조절, 클립보드 이미지 붙여넣기, 드래그앤드롭, 픽셀 비교 기능
- **Canvas API**: 픽셀 단위 이미지 비교
- **File API**: 클립보드 및 드래그앤드롭 이미지 처리

## **프로젝트 구조**

```
hawkeye/
│
├── index.html           # 메인 HTML 파일
├── style.css            # 스타일링을 위한 CSS 파일
├── app.js               # 메인 JavaScript 로직
└── README.md            # 프로젝트 설명서 (현재 파일)
```

### **index.html**

HTML 파일에서는 이미지 업로드 필드, 투명도 조절 슬라이더, 드래그 앤 드롭 영역, 이미지 비교를 위한 캔버스를 포함하고 있습니다.

### **style.css**

CSS 파일은 이미지 겹침을 위한 레이아웃 설정과 기본적인 스타일링을 다룹니다.

### **app.js**

JavaScript 파일에서는 다음 기능들이 구현되어 있습니다:
- 이미지 업로드 및 미리보기
- 클립보드 이미지 붙여넣기
- 드래그앤드롭 이미지 업로드
- 투명도 조절 슬라이더
- 픽셀 단위 이미지 비교 기능

## **설치 방법**

### 2. **의존성 설치**

## **구동 방법**

1. 프로젝트 디렉토리에서 `index.html` 파일을 브라우저에서 엽니다.
2. 첫 번째 이미지(디자인 시안)와 두 번째 이미지(퍼블리싱 산출물)를 업로드합니다.
3. 슬라이더를 통해 투명도를 조절하거나, 이미지를 드래그하여 위치를 조정할 수 있습니다.
4. 클립보드를 사용해 이미지를 붙여넣거나, 이미지를 드래그 앤 드롭하여 업로드할 수 있습니다.
5. 두 이미지 간의 차이점을 자동으로 감지하려면 픽셀 비교 기능을 활성화합니다.

## **기능 설명**

- **이미지 업로드**: 파일 업로드 또는 드래그 앤 드롭으로 이미지를 추가할 수 있습니다.
- **투명도 조절**: 슬라이더를 사용하여 두 번째 이미지의 투명도를 0~100% 사이에서 조절할 수 있습니다.
- **클립보드 붙여넣기**: `Ctrl + V`로 클립보드의 이미지를 붙여넣습니다.
- **픽셀 비교**: 두 이미지 간의 픽셀 차이를 감지하고, 차이점을 시각적으로 강조합니다.
