import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
// import path from "node:path";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  // resolve: {
  //   alias: {
  //     "@": path.resolve(__dirname, "./src"), // ✅ use __dirname here
  //   },
  // },
});
