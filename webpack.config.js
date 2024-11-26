import path from 'path';
import webpack from 'webpack';
import fs from 'fs';

const _package = JSON.parse(fs.readFileSync('./package.json', {encoding:"utf-8"}));
import TerserPlugin from 'terser-webpack-plugin';
const isProduct = process.env.NODE_ENV != 'develop';

import { fileURLToPath } from "node:url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
	devtool: isProduct ? undefined : 'inline-source-map',
	mode: 'development',
	experiments: {
	  outputModule: true,
	},
	resolve: {
		extensions: ['.js', '.ts'],
		modules: [
			path.resolve('./src'),
			path.resolve('./node_modules')
		],
	},
    entry: {
		obitas: path.resolve(__dirname, "./src/index.ts"),
	},
	optimization: {
		minimizer: [new TerserPlugin({
			minify: TerserPlugin.esbuildMinify,
			extractComments: false,
			
		})],
	},
	output: {
		// library: `Obitas`,
		libraryTarget: process.env.LIB_TARGET,
		filename: `[name].${process.env.LIB_NAME}.cjs`,
		path: __dirname
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use:[
					{
						loader: 'ts-loader',
						options: {
							transpileOnly: true
						}
					},{
						loader: 'webpack-preprocessor-loader',
						options: {
							debug: process.env.NODE_ENV !== 'product',
							directives: {
								secret: false,
							},
							params: {
								ENV: process.env.NODE_ENV,
							},
							verbose: false,
						},
					},
				],
			}
		]
	},
	plugins: [
		new webpack.BannerPlugin({
			banner:
				`@odonata3d/obitas v${_package.version}
	copyright(c) ${new Date().getFullYear()}, ${_package.author}
	${_package.homepage}
	@license ${_package.license}`
		})
	]
}