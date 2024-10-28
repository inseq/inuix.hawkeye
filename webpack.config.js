const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',  // 최종 프로덕션 모드 설정
  entry: './src/main.js',  // JS 엔트리 파일
  output: {
    filename: 'inuix.hawkeye.min.js',  // 번들된 파일 이름
    path: path.resolve(__dirname, 'dist'),  // 결과물이 저장될 경로
  },
  optimization: {
    minimize: true,  // JS 및 CSS 최소화 설정
    minimizer: [new TerserPlugin()],
  },
  module: {
    rules: [
      {
        test: /\.scss$/,  // SCSS 파일 처리
        use: [
          'style-loader',  // 스타일을 JS에 포함
          'css-loader',    // CSS를 JS로 변환
          'sass-loader',   // SCSS를 CSS로 컴파일
        ],
      },
      {
        test: /\.js$/,  // JS 파일 처리
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',  // 최신 JS 기능을 지원하도록 변환
        },
      },
    ],
  },
  devServer: {
    static: {
      directory: path.join(__dirname),  // 루트 경로에 있는 파일 제공
    },
    compress: true,
    port: 8080,  // 서버 실행 포트
    open: true,  // 서버 실행 시 브라우저 자동 열기
  },
};
