/* RUN IN NODE */

var vm = require('vm');

vm.runInNewContext('(' + (() => {
	props(Object.getOwnPropertyNames(this).filter(key => {
		var val = this[key];
		
		return val && key != 'props' && ['function', 'object'].includes(typeof val) && !(/webkit/gi.test(key)) && key.length >= 4;
	}));
}) + ')()', {
	props(vals){
		console.log('[ ' + vals.map(key => '\'' + key + '\'').join(', ') + ' ]');
	},
});