const glob = require('glob')
const path = require('path')
// const ManifestPlugin = require('webpack-manifest-plugin')
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// const WatchIgnorePlugin = require('webpack/lib/WatchIgnorePlugin')
const jsPath = path.join(__dirname, 'src',)
const packageJsPath = path.join(__dirname, 'fuel','packages')
const cssPath = path.join(__dirname, 'src', 'css')
const componentCssPath = path.join(__dirname, 'src', 'components')
const outPath = path.join(__dirname, 'public/dist/')
const CopyPlugin = require('copy-webpack-plugin')

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

// JS webpack entry point registration
// locates all `js/*.js` files
glob.sync(path.join(jsPath, '*.js')).map(file => {
	entry['js/'+path.basename(file, '.js')] = file
})

// some packages (like the reactified materia-theme-ucf) have js that needs to be added to webpack
glob.sync(path.join(packageJsPath, '**/*.js')).map(file => {
	entry['js/'+path.basename(file, '.js')] = file
})

module.exports =
	// built client files
	(env, argv) => {
		return {
			stats: {
				assetsSort: 'size',
				entrypoints: false,
				children: false,
				modules: false
			},
			optimization: { minimize: true },
			performance: { hints: false },
			// mode: is_production ? 'production' : 'development',
			target: 'web',
			devServer: {
				index: '', // specify to enable root proxying
				hot: false,
				inline: false,
				host: '127.0.0.1',
				publicPath: '/dist/',
				https: true,
				watchContentBase: true,
				watchOptions: {
					ignored: '/node_modules/',
				},
				proxy: {
					// proxy everything back into docker
					context: () => true,
					target: 'https://127.0.0.1:443',
					secure: false
				}
			},
			entry,
			output: {
				// publicPath: '/',
				path: outPath,
				filename: '[name].js'
			},
			module: {
				rules: [
					// {
					// 	test: /\.svg/,
					// 	use: {
					// 		loader: 'svg-url-loader',
					// 		options: {
					// 			stripdeclarations: true,
					// 			iesafe: true
					// 		}
					// 	}
					// },
					{
						test: /\.(js|jsx)$/,
						exclude: /node_modules/,
						use: [
							'babel-loader' // configuration in .babelrc
						]
					},
					{
						test: /\.s?css$/,
						use: [
							MiniCssExtractPlugin.loader,
							{
								loader: 'css-loader',
								options: {
									url: false, // don't process urls in css
								}
							},
							{
								loader: 'postcss-loader',
								options: {
									ident: 'postcss',
									url: false, // don't process urls in css
									plugins: [require('autoprefixer')]
								}
							},
							'sass-loader'
						]
					},
					// {
					// 	test: /\.(jpe?g|png)$/i,
					// 	use: [
					// 		{
					// 			loader: 'responsive-loader',
					// 			options: {
					// 				adapter: require('responsive-loader/sharp')
					// 			}
					// 		}
					// 	]
					// }
				]
			},
			externals: {
				react: 'React',
				'react-dom': 'ReactDOM'
			},
			plugins: [
				// new WatchIgnorePlugin([
				// 	path.join(__dirname, 'server', 'public', 'compiled', 'manifest.json')
				// ]),
				new CleanWebpackPlugin(), // clear the dist folder before build
				new MiniCssExtractPlugin({ filename: '[name].css' }),
				// Copy all the frontend dependencies from node_modules to dist/vendor
				new CopyPlugin({
					patterns: [
						{
							from: require.resolve('datatables/media/js/jquery.dataTables.min.js'),
							to: 'vendor/jquery.dataTables.min.js'
						},
						{
							from: require.resolve('labjs/LAB.min.js'),
							to: 'vendor/LAB.min.js'
						},
						{
							from: require.resolve('hammerjs/hammer.min.js'),
							to: 'vendor/hammer.min.js'
						},
						{
							from: require.resolve('angular/angular.min.js'),
							to: 'vendor/angular.min.js'
						},
						{
							from: require.resolve('angular-animate/angular-animate.min.js'),
							to: 'vendor/angular-animate.min.js'
						},
						{
							from: require.resolve('jquery/dist/jquery.min.js'),
							to: 'vendor/jquery.min.js'
						},
						{
							from: require.resolve('ngmodal/dist/ng-modal.min.js'),
							to: 'vendor/ng-modal.min.js'
						},
						{
							from: require.resolve('ngmodal/dist/ng-modal.css'),
							to: 'vendor/ng-modal.css'
						},
						{
							from: require.resolve('datatables/media/css/jquery.dataTables.min.css'),
							to: 'vendor/jquery.dataTables.min.css'
						}
					],
				}),
				// new ManifestPlugin({ publicPath: '/', writeToFileEmit: true }),
				new IgnoreEmitPlugin(/css\/.+\.js$/) // omit all js files in the css directory
			],
			resolve: {
				extensions: ['.js', '.jsx'],
			}
		}
	}
