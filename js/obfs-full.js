var bytenode = require('bytenode'),
	jsob = require('javascript-obfuscator'),
	path = require('path'),
	fs = require('fs'),
	v8 = require('v8'),
	consts = require('./consts.js'),
	default_obfs_ops = {
		splitStrings: true,
		stringArrayThreshold: 1,
		splitStringsChunkLength: 15,
		deadCodeInjection: true,
		deadCodeInjectionThreshold: 1,
		renameGlobals: true,
		renameProperties: false,
		identifierNamesGenerator: 'mangled-shuffled',
		stringArrayEncoding: ['rc4'],
	},
	main = {
		o(file_name, options = {}){ // obfuscate
			if(file_name.constructor == String && module.exports[file_name])file_name = module.exports[file_name];
			if(options.constructor == String)options = module.exports[options];
			
			var options = Object.assign({
					obio: false, // obfuscator.io module thing
					obio_ops: {},
				}, options),
				file_binary = path.join(consts.app_dir, file_name.replace(/js$/g, 'jsc')),
				file_script = path.join(consts.js_dir, file_name),
				file_obfus = path.join(consts.js_dir, file_name.replace(/\.js$/g, '_ob_' + Date.now() + '_.js'));
			
			if(!fs.existsSync(file_script))file_script = path.join(__dirname, file_name);
			if(!fs.existsSync(file_script))file_script = path.join(__dirname, file_name);
			
			if(!fs.existsSync(file_binary)){
				if(!fs.existsSync(file_script))return console.error(file_name + ' missing');
				
				// load custom options if we obfuscate
				try{
					if(options.obio){
						var consts_wrapped = require('module').wrap(fs.readFileSync(path.join(__dirname, 'consts.js'), 'utf8'));
						
						fs.writeFileSync(file_obfus, jsob.obfuscate('var ss_requires = {}, ss_require = file => ss_requires[file], ce = { exports: {} }, ex = {};' + consts_wrapped.replace(/.$/, '') + '(ex, require("module").createRequire(__dirname), ce, __filename, __dirname); ss_requires["./consts.jsc"] = ce.exports || ex;'
						+ fs.readFileSync(file_script, 'utf8'), options.obio_ops));
					}
				}catch(err){
					return console.error('encountered error when obfuscating ' + file_name + '\n', err);
				}
				
				bytenode.compileFile({
					filename: options.obio ? file_obfus : file_script,
					compileAsModule: true,
					output: file_binary
				});
				
				if(options.obio)fs.unlink(file_obfus, _ => {});
			}
			
			return file_binary;
		},
	},
	to_ob = ['sploit.js', 'main.js', 'ui.js'];

console.log(to_ob.map(file_name => main.o(file_name, default_obfs_ops)));