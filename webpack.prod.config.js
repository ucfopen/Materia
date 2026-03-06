const glob = require('glob')
const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackRemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts')
const BundleTracker = require('webpack-bundle-tracker')
const { WebpackManifestPlugin } = require('webpack-manifest-plugin')

const WIDGET_CORE_BUNDLES = ['materia.enginecore', 'materia.creatorcore', 'materia.scorecore']

const jsPath = path.join(__dirname, 'src')
const packageJsPath = path.join(__dirname, 'fuel', 'packages')
const cssPath = path.join(__dirname, 'src', 'css')

// 
const packageJSON = require('./package.json')

/*
 *   Template Production webpack config for Materia
 *   This can be modified to suit your needs. By default it is run when building the materia-app image using the materia-app.Dockerfile
 *   Note that additional comments can be found in the default webpack config
 */

const entry = {
	// Fonts CSS - emitted separately for better load performance
	fonts: path.join(cssPath, 'fonts.css')
}

const getEntryName = (file, basePath) => {
	const relativePath = path.relative(basePath, file)
	return path.join(path.dirname(relativePath), path.basename(file, '.js'))
}

glob.sync(path.join(cssPath, '*.scss')).forEach((file) => {
	entry[path.basename(file, '.scss')] = file
})

glob.sync(path.join(jsPath, '*.js')).map((file) => {
	entry[getEntryName(file, jsPath)] = file
})

glob.sync(path.join(packageJsPath, '**/*.js')).map((file) => {
	entry[getEntryName(file, packageJsPath)] = file
})

module.exports = {
	mode: 'production',
	entry,
	output: {
		path: path.join(__dirname, 'public/'),
		filename: (pathData) => {
			if (WIDGET_CORE_BUNDLES.includes(pathData.chunk.name)) {
				return 'js/[name].js'
			}
			return 'js/[name].[contenthash:8].js'
		},
		publicPath: '/static/',
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader',
				},
			},
			{
				test: /\.s?css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							url: false,
						},
					},
					'sass-loader',
				],
			},
			{
				test: /\.mdx?$/,
				use: [
					{ loader: 'babel-loader', options: {} },
					{ loader: '@mdx-js/loader', options: {} },
				],
			},
			{
				test: /homepage.jsx$/,
				use: {
					loader: 'string-replace-loader',
					options: {
						search: '__APP_VERSION_PLACEHOLDER__',
						replace: `v${packageJSON.version}`
					}
				}
			}
		]
	},
	plugins: [
		new BundleTracker({ filename: './webpack-stats.json' }),
		new WebpackRemoveEmptyScriptsPlugin(),
		new MiniCssExtractPlugin({
			filename: 'css/[name].[contenthash:8].css',
		}),
		new WebpackManifestPlugin({
			fileName: 'manifest.json',
			publicPath: '',
			generate: (seed, files, entries) => {
				const manifest = {}
				files.forEach(file => {
					const dir = file.path.substring(0, file.path.lastIndexOf('/') + 1)
					manifest[dir + file.name] = file.path
				})
				return manifest
			}
		}),
	],
	resolve: {
		extensions: ['.js', '.jsx'],
		alias: {
			'@': [path.resolve(__dirname, 'theme/src'), path.resolve(__dirname, 'src')],
			'MateriaText': [path.resolve(__dirname, 'theme/text'), path.resolve(__dirname, 'src/text')],
			'MateriaCommon': [path.resolve(__dirname, 'theme/common.json'), path.resolve(__dirname, 'src/common.json')],
		},
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'commons',
					chunks: (chunk) => {
						return (
							chunk.name !== 'materia.enginecore' &&
							chunk.name !== 'materia.creatorcore' &&
							chunk.name !== 'materia.scorecore'
						)
					},
				},
			},
		},
	},
}
