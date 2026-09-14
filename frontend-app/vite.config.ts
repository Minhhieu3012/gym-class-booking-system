import { defineConfig } from "vite";

export default defineConfig({
  define: {
    global: "window",
  },
  resolve: {
    alias: {
      // Đảm bảo tương thích sockjs-client trên môi trường trình duyệt của Vite
      "sockjs-client": "sockjs-client/dist/sockjs.min.js",
    },
  },
});
