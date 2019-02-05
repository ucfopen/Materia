const path = require('path');
const fs = require('fs');
const fse = require('fs-extra')
const glob = require('glob')
const crypto = require('crypto');

const nodeModulesPath = path.join(__dirname, 'node_modules')
const srcPath = path.join(nodeModulesPath, 'materia-server-client-assets', 'dist')
const pubPath = path.join(__dirname, 'public')
const vendorPath = path.join(pubPath, 'js', 'vendor')
const filesFound = {}

const copyList = [
	{
		from: path.join(srcPath, 'css'),
		to: path.join(pubPath, 'css')
	},
	{
		from: path.join(srcPath, 'js', 'materia.js'),
		to: path.join(pubPath, 'js', 'materia.js')
	},
	{
		from: path.join(srcPath, 'js', 'student.js'),
		to: path.join(pubPath, 'js', 'student.js')
	},
	{
		from: path.join(srcPath, 'js', 'author.js'),
		to: path.join(pubPath, 'js', 'author.js')
	},
	{
		from: path.join(srcPath, 'js', 'admin.js'),
		to: path.join(pubPath, 'js', 'admin.js')
	},
	{
		from: path.join(srcPath, 'js', 'materia.creatorcore.js'),
		to: path.join(pubPath, 'js', 'materia.creatorcore.js')
	},
	{
		from: path.join(srcPath, 'js', 'materia.enginecore.js'),
		to: path.join(pubPath, 'js', 'materia.enginecore.js')
	},
	{
		from: path.join(srcPath, 'js', 'materia.scorecore.js'),
		to: path.join(pubPath, 'js', 'materia.scorecore.js')
	},
	{
		from: path.join(nodeModulesPath, 'datatables', 'media', 'js', 'jquery.dataTables.min.js'),
		to:  path.join(vendorPath, 'datatables', 'jquery.dataTables.min.js')
	},
	{
		from: path.join(nodeModulesPath, 'labjs', 'LAB.min.js'),
		to:  path.join(vendorPath, 'labjs', 'LAB.min.js')
	},
	{
		from: path.join(nodeModulesPath, 'swfobject', 'swfobject'),
		to:  path.join(vendorPath, 'swfobject')
	},
	{
		from: path.join(nodeModulesPath, 'hammerjs', 'hammer.min.js'),
		to:  path.join(vendorPath, 'hammer.min.js')
	},
	{
		from: path.join(nodeModulesPath, 'spinjs', 'dist', 'spin.min.js'),
		to:  path.join(vendorPath, 'spin.min.js')
	}
]

/*
	fse.copy filter function applied to each item
	we'll use it to build a list of all files
	and make an md5 hash for each of them
*/
const md5AllAssets = (src, dest) => {
	let files = []
	let srcDir
	let destDir

	if(fs.statSync(src).isDirectory()){
		// src is a directory
		files = glob.sync(path.join(src, '**', '*'))
		srcDir = src
		destDir = dest
	}
	else{
		// src is a single file
		files = [src]
		srcDir = path.dirname(src)
		destDir = path.dirname(dest)
	}

	// md5 each file and keep track of it
	files.forEach(f => {
		if(fs.lstatSync(f).isDirectory()) return
		count++
		let data = fse.readFileSync(f)
		let outputName = f.replace(srcDir, destDir).replace(pubPath+'/', '')
		filesFound[outputName] = crypto.createHash('md5').update(data).digest("hex")
	})

	return true
}


let count = 0;

Promise.all(copyList.map(item => fse.copy(item.from, item.to, {filter: md5AllAssets})))
.then(() => {
	const hashPath = path.join(__dirname, 'fuel', 'app', 'config', 'asset_hash.json')
	return fse.writeJson(hashPath, filesFound, {spaces: '\t'})
})
.then(() => {
	console.log(` ${count} Assets installed!`)
	process.exit()
})
.catch(err => {
	console.error(err)
	process.exit(1)
})
