import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/index.js',
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'MonitorSDK',
      sourcemap: true,
    },
    {
      file: 'dist/index.iife.js',
      format: 'iife',
      name: 'MonitorSDK',
      sourcemap: true,
    },
    // Minified versions
    {
      file: 'dist/index.umd.min.js',
      format: 'umd',
      name: 'MonitorSDK',
      plugins: [terser()],
      sourcemap: true,
    },
    {
      file: 'dist/index.iife.min.js',
      format: 'iife',
      name: 'MonitorSDK',
      plugins: [terser()],
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
  ],
};
