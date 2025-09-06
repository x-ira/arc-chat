// https://vitejs.dev/config/

import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import wasm from "vite-plugin-wasm";
// import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
  build: {
    target: 'esnext',
    outDir: '../dist', //to project root
    emptyOutDir: true,
    // minify: false,
  },
  // publicDir: '../res', //will copy files to '/dist'!
  resolve: {
    // preserveSymlinks: true, //very important! https://github.com/solidjs/solid/issues/1472
    dedupe: ["solid-js"],  //or using this to fix, to avoid cache problem, using this!!
  },
  plugins: [
    solidPlugin(), wasm(), //topLevelAwait(),
  ],
  server: {
    // host: '127.0.0.1',
    port: 7070,
    proxy: {
      "/res":{
        target: "ws://127.0.0.1:1930", //localhost not work!
        changeOrigin: true,
        secure: false,
      },
      "/ws": {
        target: "ws://127.0.0.1:1930", //localhost not work!
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "http://127.0.0.1:1930", //localhost not work!
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
