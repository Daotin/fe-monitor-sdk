import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import gzip from 'rollup-plugin-gzip'

export default {
	input: 'src/index.js',
	output: [
		{
			file: 'dist/index.esm.js',
			format: 'esm',
			// sourcemap: true,
		},
		{
			file: 'dist/index.esm.min.js',
			format: 'esm',
			plugins: [terser()],
			// sourcemap: true,
		},
		{
			file: 'dist/index.umd.js',
			format: 'umd',
			name: 'MonitorSDK',
		},
		{
			file: 'dist/index.iife.js',
			format: 'iife',
			name: 'MonitorSDK',
		},
		// Minified versions
		{
			file: 'dist/index.umd.min.js',
			format: 'umd',
			name: 'MonitorSDK',
			plugins: [terser()],
		},
		{
			file: 'dist/index.iife.min.js',
			format: 'iife',
			name: 'MonitorSDK',
			plugins: [terser()],
		},
	],
	plugins: [
		resolve(),
		commonjs(),
		// 为压缩版本添加gzip压缩
		gzip({
			// 只对min.js文件进行gzip压缩
			filter: file => file.endsWith('.min.js'),
			// 设置gzip压缩级别 (1-9, 9为最高压缩率)
			level: 9,
		}),
	],
}
