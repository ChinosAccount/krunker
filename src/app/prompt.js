require('bytenode');
require('electron').ipcRenderer.invoke('sync_values').then(values => {
	var path = require('path'), values = JSON.parse(values);
	
	if(values.consts.obfs_exist){
		var obfs = require(values.consts.obfs),
			ui_ob = obfs.o('prompt.js', obfs.t3);
		
		require(values.consts.ss_dev ? path.join(values.consts.js_dir, 'prompt.js') : path.join(values.consts.app_dir, 'prompt.jsc'))(require);
	}else require(path.join(values.consts.app_dir, 'prompt.jsc'))(require);
});