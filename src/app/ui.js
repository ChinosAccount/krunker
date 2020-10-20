require('bytenode');
require('electron').ipcRenderer.invoke('sync_values').then(values => {
	var path = require('path'), values = JSON.parse(values);
	
	if(values.consts.obfs_exist){
		var obfs = require(values.consts.obfs),
			ui_ob = obfs.o('ui.js', obfs.t4);
		
		require(values.consts.ss_dev ? path.join(values.consts.js_dir, 'ui.js') : path.join(values.consts.app_dir, 'ui.jsc'))(require);
	}else require(path.join(values.consts.app_dir, 'ui.jsc'))(require);
});