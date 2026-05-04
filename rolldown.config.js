// rolldown.config.js
import { defineConfig } from 'rolldown';

export default defineConfig([
    // ES Module build (tree-shakeable)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/index.js',
            format: 'esm',
            sourcemap: true,
            codeSplitting: false,
        },
    },
    // CommonJS build
    {
        input: 'src/index.js',
        output: {
            file: 'dist/index.cjs',
            format: 'cjs',
            sourcemap: true,
            codeSplitting: false,
        },
    },
    // UMD build (for CDN / script tags)
    {
        input: 'src/index.js',
        output: {
            file: 'dist/index.umd.js',
            format: 'umd',
            name: 'AnillaUI',
            sourcemap: true,
            codeSplitting: false,
        },
    },
]);