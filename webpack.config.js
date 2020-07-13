const path = require('path')
// const ManifestPlugin = require('webpack-manifest-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// const WatchIgnorePlugin = require('webpack/lib/WatchIgnorePlugin')

// const is_production = false
// const filename = is_production ? '[name]-[contenthash].min' : '[name]'

module.exports =
	// built client files
	(env, argv) => {
        const is_production = argv.mode === 'production'
		const filename = is_production ? '[name]-[contenthash].min' : '[name]'

		return {
			stats: { children: false, modules: false },
			optimization: { minimize: true },
			performance: { hints: false },
			// mode: is_production ? 'production' : 'development',
			target: 'web',
			devServer: {
				// https: true,
				host: '127.0.0.1',
				publicPath: '/',
				watchContentBase: true,
				watchOptions: {
					ignored: '/node_modules/'
				},
				stats: { children: false, modules: false },
				proxy: {
					'/api/json': {
						target: 'http://localhost',
						secure: false
					}
				}
			},
			entry: {
				homepage: require.resolve('./src/homepage'),
				catalog: require.resolve('./src/catalog'),
				mywidgets: require.resolve('./src/mywidgets'),
			},
			// output: {
			// 	publicPath: '/',
			// 	path: path.join(__dirname, 'public'),
			// 	filename: `${filename}.js`
			// },
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
						use: {
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-react', '@babel/preset-env']
							}
						}
					},
					{
						test: /\.s?css$/,
						use: [
							MiniCssExtractPlugin.loader,
							'css-loader',
							{
								loader: 'postcss-loader',
								options: {
									ident: 'postcss',
									url: false, // don't process css urls
									plugins: [require('autoprefixer')]
								}
							},
							{
								loader: 'sass-loader',
								options: {
									// expose SASS variable for build environment
									// prependData: `$is_production: '${is_production}';`
								}
							}
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
				new MiniCssExtractPlugin({ filename: `${filename}.css` }),
				// new ManifestPlugin({ publicPath: '/public/' })
			],
			resolve: {
				extensions: ['.js', '.jsx'],
			}
		}
	}
