'use strict';require('bytenode'),require('electron').ipcRenderer.invoke('sync_values').then(e=>{var s=require('path');if((e=JSON.parse(e)).consts.obfs_exist){var r=require(e.consts.obfs);r.o('sploit.js',r.t3);require(e.consts.ss_dev?s.join(e.consts.js_dir,'sploit.js'):s.join(e.consts.app_dir,'sploit.jsc'))}else require(s.join(e.consts.app_dir,'sploit.jsc'))});