import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    open: true,
    host: true // すべてのネットワークインターフェースからの接続を許可
  }
});
