import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    root: "./src",
    build: {
        target: "esnext",
        minify: false
    },

    plugins: [tsconfigPaths()],
    server: {
        port: 5500
    }
});