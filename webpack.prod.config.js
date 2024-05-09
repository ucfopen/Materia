const glob = require('glob')
const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackRemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts')
const BundleTracker = require('webpack-bundle-tracker')

const jsPath = path.join(__dirname, 'src')
const packageJsPath = path.join(__dirname, 'fuel', 'packages')
const cssPath = path.join(__dirname, 'src', 'css')

/*
 *   Template Production webpack config for Materia
 *   This can be modified to suit your needs. By default it is run when building the materia-app image using the materia-app.Dockerfile
 *   Note that additional comments can be found in the default webpack config
 */

const entry = {}

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
		filename: 'js/[name].js',
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
		],
	},
	plugins: [
		new BundleTracker({ filename: './webpack-stats.json' }),
		new WebpackRemoveEmptyScriptsPlugin(),
		new MiniCssExtractPlugin({
			filename: 'css/[name].css',
		}),
	],
	resolve: {
		extensions: ['.js', '.jsx'],
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
