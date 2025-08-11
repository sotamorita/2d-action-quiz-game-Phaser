import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/2d-action-quiz-game-Phaser/', // GitHub Pagesのリポジトリ名に合わせる
  publicDir: 'public',
  build: {
    outDir: 'dist', // ビルド出力先を 'dist' に設定
  },
  server: {
    open: true,
    host: true // すべてのネットワークインターフェースからの接続を許可
  }
});
