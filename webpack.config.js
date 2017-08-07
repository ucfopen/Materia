const CopyWebpackPlugin = require('copy-webpack-plugin');
const HashAssetsPlugin = require('hash-assets-webpack-plugin');
const path = require('path');

// build some paths
const modulesPath = path.join(__dirname, 'node_modules')
const srcPath = path.join(modulesPath, 'materia-client-assets', 'dist')
const pubPath = path.join(__dirname, 'public')
const vendorPath = path.join(pubPath, 'js', 'vendor')
const fuelConfigPath = path.join(__dirname, 'fuel', 'app', 'config')

// use the materia-clients-asset webpack as a base
let materiaClientAssets = require('materia-client-assets/webpack.config.js')

const isProd = process.argv.indexOf('-p') != -1

// Adds copy plugin to move files around
let copy = new CopyWebpackPlugin(
	[
		{
			context: path.join(srcPath, 'css'),
			from: '**/*',
			to: path.join(pubPath, 'css')
		},
		{
			context: path.join(srcPath, 'js'),
			from: '**/*',
			to: path.join(pubPath, 'js')
		},
		{
			from: path.join(modulesPath, 'ngmodal', 'dist'),
			to:  path.join(vendorPath, 'ngmodal')
		},
		{
			from: path.join(modulesPath, 'fancybox', 'source'),
			to:  path.join(vendorPath, 'fancybox')
		},
		{
			from: path.join(modulesPath, 'spinjs', 'dist', 'spin.min.js'),
			to:  path.join(vendorPath, 'spin.min.js')
		},
		{
			from: path.join(modulesPath, 'timepicker', '**', '*'),
			to:  path.join(vendorPath, 'timepicker')
		},
	], { copyUnmodified: true }
)

// Builds a json file with asset hashes for each js file
let hash = new HashAssetsPlugin({
	filename: 'asset_hash.json',
	keyTemplate: '[name]',
	prettyPrint: true,
	path: fuelConfigPath,
})


materiaClientAssets.plugins.push(copy)

if(isProd){
	materiaClientAssets.plugins.push(hash)
}

module.exports = materiaClientAssets
