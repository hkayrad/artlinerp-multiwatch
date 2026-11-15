import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, '.', 'VITE_');
    var phpTarget = env.VITE_PHP_TARGET || 'http://127.0.0.1:8080';
    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': phpTarget,
                '/uploads': phpTarget,
            },
        },
    };
});
