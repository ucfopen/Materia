const glob = require('glob')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const WebpackRemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts')

const jsPath = path.join(__dirname, 'src',)
const packageJsPath = path.join(__dirname, 'fuel','packages')
const cssPath = path.join(__dirname, 'src', 'css')

const entry = {}
// Webpack Entry Point Registration Overview
// Create object with:
// Key = output name and path, Value = source file path
// You CAN prepend path.basename(...) with a path, but we're opting to use output.filename to determine the default output directory (js/)
// the MiniCSSExtractPlugin has its own filename param that sends emitted CSS files to css/ instead

// OLD CSS entry point registration
// Ideally these are no longer included
glob.sync(path.join(cssPath, '*.scss')).forEach(file => {
	entry[path.basename(file, '.scss')] = file
})

// // JS webpack entry point registration
// // locates all `js/*.js` files
glob.sync(path.join(jsPath, '*.js')).map(file => {
	entry[path.basename(file, '.js')] = file
})

// some packages (like the reactified materia-theme-ucf) have js that needs to be added to webpack
glob.sync(path.join(packageJsPath, '**/*.js')).map(file => {
	entry[path.basename(file, '.js')] = file
})

// !!! Note that CSS entry points are not included.
// MiniCSSExtractPlugin will create CSS files from js since they're part of each js file's dependency graph already

module.exports = {
	mode: 'development',
	devServer: {
		host: '127.0.0.1',
		server: 'https',
		hot: false,
		devMiddleware: {
			writeToDisk: true
		},
		proxy: {
			target: 'https://127.0.0.1:443'
		},
		webSocketServer: false
	},
	entry,
	output: {
		path: path.join(__dirname, 'public/dist/'),
		filename: 'js/[name].js',
		clean: {
			keep(asset) {
				return (asset.includes('package.json') || asset.includes('README.md') || asset.includes('path.js'))
			}
		}
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules|public\/dist/,
				use: {
						loader: 'babel-loader'
					}
			},
			{
				test: /\.s?css$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							url: false
						}
					},
					'sass-loader'
				]
			},
		]
	},
	plugins: [
		new WebpackRemoveEmptyScriptsPlugin(), // webpack produces a js file for each emitted bundle no matter what. This removes leftover & unncessary js duplicates within css/
		new MiniCssExtractPlugin({
			filename: "css/[name].css"
		})
	],
	resolve: {
		extensions: ['.js', '.jsx'],
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /\.js$/,
					name: 'commons',
					chunks: 'initial'
				}
			}
		}
	}
	// externals: {
	// 	react: 'React',
	// 	'react-dom': 'ReactDOM'
	// }
}