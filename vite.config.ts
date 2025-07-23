import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    build: {
        minify: false,
        rollupOptions: {
            output: {
                preserveModules: true,
            }
        },
    },

    plugins: [tsconfigPaths()],
    server: {
        port: 5500
    }
});