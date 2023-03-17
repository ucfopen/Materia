const glob = require('glob')
const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const jsPath = path.join(__dirname, 'src',)
const packageJsPath = path.join(__dirname, 'fuel','packages')
const cssPath = path.join(__dirname, 'src', 'css')
const componentCssPath = path.join(__dirname, 'src', 'components')

const entry = {}
// Webpack Entry Point Registration Overview
// Create object with:
// Key = output name, Value = source sass file
// for every scss file in the cssPath directory
// EX: { 'css/<filename>.css' : './src/css/filename.scss', ...}


// SASS/CSS webpack entry point registration
glob.sync(path.join(cssPath, '*.scss')).forEach(file => {
	entry['css/'+path.basename(file, '.scss')] = file
})

glob.sync(path.join(componentCssPath, '*.scss')).forEach(file => {
	entry['css/'+path.basename(file, '.scss')] = file
})

// // JS webpack entry point registration
// // locates all `js/*.js` files
glob.sync(path.join(jsPath, '*.js')).map(file => {
	entry['js/'+path.basename(file, '.js')] = file
})

// some packages (like the reactified materia-theme-ucf) have js that needs to be added to webpack
glob.sync(path.join(packageJsPath, '**/*.js')).map(file => {
	entry['js/'+path.basename(file, '.js')] = file
})

module.exports = {
	mode: 'production',
	entry,
	output: {
		path: path.join(__dirname, 'public/dist/'),
		filename: '[name].js',
		clean: true
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
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
		new MiniCssExtractPlugin({
			filename: "[name].css"
		})
	],
	resolve: {
		extensions: ['.js', '.jsx'],
	}
	// externals: {
	// 	react: 'React',
	// 	'react-dom': 'ReactDOM'
	// }
}