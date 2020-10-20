require('v8-compile-cache');
var fs = require('fs'),
	os = require('os'),
	url = require('url'),
	path = require('path'),
	util = require('util'),
	fetch = require('node-fetch'),
	electron = require('electron'),
	shortcut = require('electron-localshortcut'),
	sploit_folder = path.join(os.homedir(), 'Documents', 'shitsploit'),
	values = {
		version: electron.app.getVersion(),
		src_dir: fs.existsSync(path.resolve(__dirname, 'main.js')) ? __dirname : path.join(__dirname, 'res'),
		consts: ss_require('./consts.jsc'),
		useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.80 Safari/537.36 Edg/86.0.622.43',
		folders: {
			sploit: sploit_folder,
			css: path.join(sploit_folder, 'css'),
			js: path.join(sploit_folder, 'js'),
			swap: path.join(sploit_folder, 'swap'),
		},
		files: {
			config: path.join(sploit_folder, 'config.json'),
		},
		ui_visible: true,
		original_config: {
			esp: {
				status: 'off',
				nametags: false,
				tracers: false,
				health_bar: false,
				wall_opacity: 0.6,
				thickness: 2,
				walls: false,
			}, game: {
				bhop: 'off',
				pitch_mod: 'off',
				autoreload: false,
				overlay: false,
				wireframe: false,
				speed: false,
				auto_respawn: false,
			}, aim: {
				status: 'off',
				target: 'head',
				frustrum_check: false,
				auto_reload: false,
				wallbangs: false,
				target_ais: true,
			}, client: {
				custom_font: true,
				unlimited_fps: true,
			},
		},
	},
	html = {
		splash: '<html><head><meta charset="utf8"><title>Krunker</title><style>body{margin:0;background:#fff0}.splash-wrapper{z-index:1;background:#fff no-repeat center fixed;background-size:cover;background-image:url("https://kru2.sys32.dev/client/splash.jpg?ts=' + Date.now() + '");border:6px solid #0003;width:-webkit-fill-available;height:-webkit-fill-available}@font-face{font-family:GameFont;src:url(https://kru2.sys32.dev/static/krunker.ttf)}.g{outline:0;font-family:GameFont;font-size:13px;user-select:none;color:#fff;text-shadow:-1px -1px 0 #202020,1px -1px 0 #202020,-1px 1px 0 #202020,1px 1px 0 #202020,-2px -2px 0 #202020,2px -2px 0 #202020,-2px 2px 0 #202020,2px 2px 0 #202020;margin:0}a{color:#49f}a:hover{color:#7bf}.status{position:absolute;bottom:3px;left:10px;line-height:13px}.version{position:absolute;color:#fff;bottom:3px;right:10px;line-height:13px}.close{position:absolute;top:6px;right:6px;background:#0003;width:34px;height:18px;padding-left:6px;color:#fff;text-align:center;line-height:16px;user-select:none;cursor:pointer}.close:hover{top:0;right:0;width:46px;height:24px;line-height:28px;background:#a22;padding:0}</style></head><body><div class="splash-wrapper"><div class="close" onclick="window.close()">🞩</div><div class="g status"><p>Loading...</p></div><div class="g version"><p>Shitsploit v' + values.version + '</p></div></div></body></html>',
		ui: '<html><head><meta charset="utf8"><title>Krunker</title></head><body></body></html>',
		prompt: '<html><style type="text/css">html,body{padding: 0px;overflow: hidden;margin: 0px;}@font-face{font-family: "GameFont";src: url("https://kru2.sys32.dev/static/krunker.ttf");}*{outline: none;font-family: "GameFont";color: #353535;user-select: none;}#prompt_menu{background-color: #fff;text-align: center;padding: 10px;position: absolute;left: 0;right: 0;border-radius: 5px;-webkit-box-shadow: 0px 7px 0px 0px #a6a6a6;-moz-box-shadow: 0px 7px 0px 0px #a6a6a6;}#promptText{word-wrap: break-word;}input{top: 100px;background-color: #eee;border: none;border-radius: 3px;font-size: 14px;padding: 4px;width: 250px;}select{top: 100px;background-color: #eee;border: none;border-radius: 3px;font-size: 14px;padding: 4px;width: 250px;}.action{color: #fff !important;margin-right: 5px;margin-left: 5px;background-color: #2196F3;padding: 6px;font-size: 12px;display: inline-block;cursor: pointer;border-radius: 3px;}.action:active{background-color: #666;}.line_spacing{padding-bottom: 12px;}</style><head></head><body><div id="prompt_menu"><div class="line_spacing"><a id="promptText">Question</a></div><div id="type_frame" class="line_spacing"><input id="prompt_input" placeholder="Enter Input"><br></div><div class="line_spacing"><div class="action submit">Submit</div><div class="action cancel">Cancel</div></div></div></body></html>'
	},
	sizes = {
		splash: {
			width: 575,
			height: 300,
		},
		prompt: {
			width: 300,
			height: 157,
		},
		cheat: {
			width: 404,
			height: 328,
		},
	},
	valid_json = data => { try { return JSON.parse(data) } catch(err) { return false } },
	update_config = () => fs.writeFileSync(values.files.config, JSON.stringify(values.config, null, '\t')),
	fetcht = (timeout, args) => new Promise((resolve, reject) => {
		var timer = setTimeout(() => reject( new Error('Request timed out')), timeout);
		fetch.apply(this, args).then(response => resolve(response), err => reject(err)).finally(() => clearTimeout(timer));
	}),
	wins = { splash: 0, main: 0, editor: 0, social: 0, viewer: 0, cheat: 0 },
	splash_countdown = (splash, messages, duration = 10) => new Promise((resolve, reject) => {
		var msg = () => {
				if(!splash)return reject('splash removed');
				
				duration--;
				
				if(!duration)return resolve() && clearInterval(interval);
				else splash.webContents.send('splash_info', [
					...messages,
					'Client closing in ' + duration,
				]);
			},
			interval = setInterval(msg, 1000);
		
		msg();
	}),
	init = {
		fs(){
			if(!fs.existsSync(sploit_folder))fs.mkdirSync(sploit_folder);
			
			Object.entries(values.folders).forEach(([ label, dir ]) => ! fs.existsSync(dir) && fs.mkdirSync(dir));

			values.config = { ...values.original_config };

			if(fs.existsSync(values.files.config) && valid_json(fs.readFileSync(values.files.config)))values.config = Object.assign(values.config, valid_json(fs.readFileSync(values.files.config)));

			update_config();
		},
		prompt(){
			var response;
			electron.ipcMain.on('prompt', (event, opt) => {
				response = null;
				
				wins.prompt = new electron.BrowserWindow({
					...sizes.prompt,
 					show: false,
					frame: false,
					skipTaskbar: true,
					alwaysOnTop: true,
					resizable: false,
					movable: false,
					transparent: true,
					darkTheme: true,
					center: true,
					webPreferences: {
						nodeIntegration: true,
						enableRemoteModule: false,
						preload: path.join(values.consts.app_dir, 'prompt.js'),
					},
				});
				
				wins.prompt.loadURL('data:text/html,' + encodeURIComponent(html.prompt));
				
				wins.prompt.webContents.on('did-finish-load', () => {
					if(values.consts.ss_dev_debug)wins.prompt.webContents.openDevTools({ mode: 'undocked' });
					
					wins.prompt.show();
					wins.prompt.webContents.send('text', JSON.stringify(opt));
				});
				
				wins.prompt.webContents.on('prompt_size', (event, data) => wins.prompt.setBounds({ height: data }));
				
				wins.prompt.on('closed', () => (event.returnValue = response, wins.prompt = null))
				
			});
			electron.ipcMain.on('prompt-response', (event, args) => response = args == '' ? null : args);			
		},
		splash(){
			wins.splash = new electron.BrowserWindow({
				...sizes.splash,
				frame: false,
				skipTaskbar: true,
				center: true,
				resizable: false,
				shadow: false,
				webPreferences: {
					nodeIntegration: true
				},
			});
			
			wins.splash.setMenu(null);
			wins.splash.loadURL('data:text/html,' + encodeURIComponent(html.splash));
			
			wins.splash.once('ready-to-show', () => wins.splash.show());
			
			wins.splash.webContents.once('did-finish-load', async () => {
				if(values.consts.ss_dev_debug)wins.splash.webContents.openDevTools({ mode: 'undocked' });
				
				var note,
					exit_and_visit = err => {
						if(err)console.error(err);
						
						splash_countdown(wins.splash, ['Error during setup, visiting downloads instead'], 5).then(electron.app.quit);
						
						electron.shell.openExternal(updates.latest.url);
					};
				 
				// update check
				fetcht(5000, ['https://kru2.sys32.dev/client/updates.json?ts=' + Date.now()]).then(res => res.json()).then(async updates => {
					updates.latest.major = updates.latest.major.length == 3 ? updates.latest.major + '.0' : updates.latest.major
					
					if(!updates.latest.working)return splash_countdown(wins.splash, ['Shitsploit is currently not functional..', 'Check <a href="https://skidlamer.github.io/">here</a> for more info'], 10).then(() => electron.app.quit());
					else if(1*(values.version.replace(/\D/g, '')) < 1*(updates.latest.major.replace(/\D/g, ''))){ // not the latest major version
						var installer_url = updates.latest.installers[os.type()];
						
						// if no setup is available
						if(installer_url == 'none'){
							electron.shell.openExternal(updates.latest.url);
							setTimeout(electron.app.quit, 2000);
						}else { try{ // setup available
							wins.splash.webContents.send('splash_info', ['Downloading latest setup..']);
							
							var dir = path.join(os.tmpdir(), 'shitsploit'),
								file_path = path.join( dir, 'setup_' + Math.random().toString(36).substr(2) +  Date.now() + path.extname(installer_url) );
							
							try{ fs.accessSync(dir) }catch(err){ fs.mkdirSync(dir) }
							try{ fs.writeFileSync(file_path, '') }catch(err){ return exit_and_visit() }
							
							fetcht(60000, [ installer_url ]).then(res => {
								var write_stream = fs.createWriteStream(file_path);
								
								res.body.pipe(write_stream);
								res.body.on('error', exit_and_visit);
								
								write_stream.on('finish', () => {
									wins.splash.webContents.send('splash_info', ['Finished downloading, starting..']);
									
									var process,
										execute = () => {
										try{ process = require('child_process').spawn(file_path, {
											detached: true,
											stdio: ['ignore']
										}) }catch(err){ return setTimeout(execute, 1000) }
										
										// quit if there was no error
										process.unref();
										electron.app.quit();
									}
									
									setTimeout(execute, 1500);
								});
							}).catch(exit_and_visit);
						}catch(err){ // incase we cant download the installer just let the user do it
							console.error('uncaught:\n', err);
							exit_and_visit();
						} }
						
						return;
					// not the latest patch
					}else if(1*(values.version.replace(/\D/g, '')) < 1*(updates.latest.patch.replace(/\D/g, '')))note = 'Consider updating to the latest client patch <a href="' + updates.latest.url + '">here</a>';
					else note = 'Client is up-to-date';
					
					init.main();
				}).catch(err => (note = 'Error showing splash: ' + err.message, init.main()));
			});
		},
		main(){
			wins.game = new electron.BrowserWindow({
				width: electron.screen.getPrimaryDisplay().size.width * 0.85,
				height: electron.screen.getPrimaryDisplay().size.height * 0.75,
				show: false,
				darkTheme: true,
				center: true,
				webPreferences: {
					nodeIntegration: false,
					enableRemoteModule: true,
					webSecurity: true,
					preload: path.join(values.consts.app_dir, 'preload.js'),
				},
				title: 'Shitsploit Desktop',
			});
			
			// load cheat only once
			wins.game.webContents.once('did-finish-load', () => values.consts.ss_dev_debug && wins.game.webContents.openDevTools({ mode: 'undocked' }));
			
			wins.game.on('page-title-updated', event => event.preventDefault());
			
			electron.session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
				details.requestHeaders['user-agent'] = values.useragent;
				callback({ cancel: false, requestHeaders: details.requestHeaders });
			});
			
			wins.game.setMenu(null);
			wins.game.loadURL('https://krunker.io', { userAgent: values.useragent });
			
			if(!values.consts.ss_dev && !values.consts.ss_dev_debug)wins.game.webContents.on('devtools-opened', () => (wins.game.webContents.closeDevTools(), electron.app.quit()));
			
			wins.game.webContents.on('new-window', nav);
			wins.game.webContents.on('will-navigate', nav);
			
			wins.game.once('closed', () => {
				wins.game = null;
				if(wins.sploit)wins.sploit.destroy();
			});
			
			wins.game.once('ready-to-show', () => {
				wins.splash.destroy();
				wins.game.show();
				init.cheat();
			});
			
			wins.game.on('blur', () => wins.game.webContents.send('esc'));
			
			Object.entries({
				escape: {
					key: 'Esc',
					press: _ => wins.game.webContents.send('esc')
				},
				quit: {
					key: 'Alt+F4',
					press: _ => electron.app.quit()
				},
				refresh: {
					key: 'F5',
					press: _ => wins.game.webContents.reloadIgnoringCache()
				},
				fullscreen: {
					key: 'F11',
					press: _ => {
						wins.game.setFullScreen(!wins.game.isFullScreen());
						cheat.config.client.fullscreen = 'full';
					}
				},
				devTools: {
					key: 'F12',
					press: _ => {
						if(!values.consts.ss_dev)return;
						wins.game.webContents.isDevToolsOpened() 
						? wins.game.webContents.closeDevTools() 
						: wins.game.webContents.openDevTools({ mode: 'undocked' });
					}
				},
			}).forEach(entry => shortcut.register(wins.game, entry[1].key, entry[1].press));
		},
		editor(){
			var size = wins.game.getSize();
			
			wins.editor = new electron.BrowserWindow({
				width: size[0] * values.consts.windowResize.editor,
				height: size[1] * values.consts.windowResize.editor,
				show: false,
				darkTheme: true,
				center: true,
				parent: wins.game,
				webPreferences: {
					nodeIntegration: false,
					webSecurity: false,
				},
				icon: path.join(values.consts.app_dir, 'sploit.png'),
			});
			
			wins.editor.setMenu(null);
			
			wins.editor.loadURL('https://krunker.io/editor.html');
			
			wins.editor.webContents.on('new-window', nav);
			wins.editor.webContents.on('will-navigate', nav);
			
			wins.editor.once('ready-to-show', () => {
				if(values.consts.ss_dev_debug)wins.editor.webContents.openDevTools({
					mode: 'undocked'
				});
				wins.editor.show();
			});
			
			wins.editor.once('closed', () => {
				wins.editor = null;
			});			
		},
		social(url){
			var size = wins.game.getSize();
			
			wins.social = new electron.BrowserWindow({
				width: size[0] * values.consts.windowResize.social,
				height: size[1] * values.consts.windowResize.social,
				show: false,
				darkTheme: true,
				center: true,
				parent: wins.game,
				webPreferences: {
					nodeIntegration: false,
					webSecurity: false,
				},
				icon: path.join(values.consts.app_dir, 'sploit.png'),
			});
			
			wins.social.setMenu(null);
			
			wins.social.loadURL(url);
			
			wins.social.webContents.on('new-window', nav);
			wins.social.webContents.on('will-navigate', nav);
			
			wins.social.once('ready-to-show', () => {
				if(values.consts.ss_dev_debug)wins.social.webContents.openDevTools({
					mode: 'undocked'
				});
				wins.social.show();
			});
			
			wins.social.once('closed', () => {
				wins.social = null;
			});
		},
		viewer(url){
			var size = wins.game.getSize();
			wins.viewer = new electron.BrowserWindow({
				width: size[0] * values.consts.windowResize.viewer,
				height: size[1] * values.consts.windowResize.viewer,
				show: false,
				darkTheme: true,
				center: true,
				parent: wins.game,
				webPreferences: {
					nodeIntegration: false,
					webSecurity: false,
				},
				icon: path.join(values.consts.app_dir, 'sploit.png'),
			});
			
			wins.viewer.setMenu(null);
			
			wins.viewer.loadURL(url);
			
			wins.viewer.webContents.on('new-window', nav);
			wins.viewer.webContents.on('will-navigate', nav);
			
			wins.viewer.once('ready-to-show', () => {
				if(values.consts.ss_dev_debug)wins.viewer.webContents.openDevTools({ mode: 'undocked' });
				wins.viewer.show();
			});
			
			wins.viewer.once('closed', () => wins.viewer = null);
		},
		cheat(){
			var conf = {
				...sizes.cheat,
				x: wins.game.getPosition()[0] + 50,
				y: wins.game.getPosition()[1] + (wins.game.getSize()[1] / 2) - (328 / 2),
				show: true,
				frame: false,
				resizable: false,
				movable: true,
				transparent: false,
				shadow: false,
				webPreferences: {
					nodeIntegration: true,
					enableRemoteModule: true,
					preload: path.join(values.consts.app_dir, 'ui.js'),
				},
			};
			
			// fix alwaysontop again
			if(os.type != 'Linux')conf.parent = wins.game;
			
			wins.sploit = new electron.BrowserWindow(conf);
			wins.sploit.setMenu(null);
			
			// linux fix
			if(os.type == 'Linux')wins.sploit.setAlwaysOnTop(true);
			
			electron.ipcMain.on('con_vis', (event, data) => {
				if(!wins.sploit)return;
				
				wins.sploit.setIgnoreMouseEvents(!data);
				
				wins.sploit.setOpacity(data ? (wins.sploit.focused ? 1 : 0.75) : 0);
			});
			
			electron.ipcMain.on('relaunch', (event, data) => {
				electron.app.relaunch();
				electron.app.quit();
			});
			
			wins.sploit.on('maximize', () => {
				wins.sploit.unmaximize()
			});

			wins.sploit.on('focus', () => {
				wins.sploit.focused = true;
				wins.sploit.setOpacity(1);
			});
			
			wins.sploit.on('blur', () => {
				wins.sploit.focused = false;
				wins.sploit.setOpacity(0.75);
			});
			
			wins.sploit.once('closed', () => {
				wins.sploit = null;
				electron.app.quit();
			});
			
			wins.sploit.loadURL('data:text/html,' + encodeURIComponent(html.ui));
			
			wins.sploit.webContents.on('did-finish-load', () => {
				if(!wins.sploit.webContents.isDevToolsOpened() && values.consts.ss_dev_debug)wins.sploit.webContents.openDevTools({ mode: 'undocked' });
			});
		},
		resource_swapper(){
			var swap = { filter: { urls: [] }, files: {} },
				all_files_sync = dir => {
					fs.readdirSync(dir).forEach(file => {
						var file_path = path.join(dir, file),
							use_assets = !(/swap(\\|\/)(css|docs|img|libs|pkg|sound)/.test(dir));
						
						if(fs.statSync(file_path).isDirectory())all_files_sync(file_path); else{
							var krunk = '*://' + (use_assets ? 'assets.' : '') + 'krunker.io' + file_path.replace(values.folders.swap, '').replace(/\\/g, '/') + '*';
							
							swap.filter.urls.push(krunk);
							swap.files[krunk.replace(/\*/g, '')] = url.format({
								pathname: file_path,
								protocol: 'media:',
								slashes: true,
							});
						}
					});
				};
			
			all_files_sync(values.folders.swap);
			
			if(swap.filter.urls.length)electron.session.defaultSession.webRequest.onBeforeRequest(swap.filter, (details, callback) =>
				callback({ cancel: false, redirectURL: swap.files[details.url.replace(/https|http|(\?.*)|(#.*)/gi, '')] || details.url })
			);
		},
	},
	update_dir = path.join(__dirname, 'locales', 'update/'),
	check_url = url => {
		var checks = {
				editor: /^(https?:\/\/)?(www\.|comp\.|comp_beta\.)?(krunker\.io|127\.0\.0\.1:8080)\/editor\.html(.*)$/.test(url + ''),
				viewer: /^(https?:\/\/)?(www\.|comp\.|comp_beta\.)?(krunker\.io|127\.0\.0\.1:8080)\/viewer\.html(.*)$/.test(url + ''),
				social: /^(https?:\/\/)?(www\.|comp\.|comp_beta\.)?(krunker\.io|127\.0\.0\.1:8080)\/social\.html(.*)$/.test(url + ''),
				gamewn: /^(https?:\/\/)?(www\.|comp\.|comp_beta\.)?(krunker\.io|127\.0\.0\.1:8080)(\/|.+)$/.test(url + ''),
			},
			found_type = 'external';
		
		Object.entries(checks).forEach(entry => {
			if(found_type == 'external' && entry[1] == true)found_type = entry[0];
		});
		
		return found_type
	},
	nav = (event = {}, url = '') => {
		try{
			event.preventDefault();
			switch(check_url(url)){
				case'gamewn':
					
					if(wins.game)wins.game.loadURL(url);
					
					break;
				case'editor':
					
					if(!wins.editor)init.editor(url);
					else wins.editor.loadURL(url);
					
					break
				case'viewer':

					if(!wins.viewer)init.viewer(url);
					else wins.viewer.loadURL(url);
					
					break
				case'social':
					
					if(!wins.social)init.social(url);
					else wins.social.loadURL(url);
					
					break
				case'external':
				default:
					
					electron.shell.openExternal(url);
					
					break
			}
		}catch(err){
			electron.shell.openExternal(url);
			console.log(err);
		}
	},
	update_config = () => fs.writeFileSync(values.files.config, JSON.stringify(values.config, null, '\t'));

['SIGTERM', 'SIGHUP', 'SIGINT', 'SIGBREAK'].forEach(signal => process.on(signal, _ => {
	electron.app.quit()
	process.exit(0);
}));

// quit if we have not got the lock
if(!electron.app.requestSingleInstanceLock())return electron.app.quit();

electron.app.on('second-instance', () => {
	if(wins.splash && !wins.splash.isDestroyed())wins.splash.focus(); else if (wins.game) {
		if(wins.game.isMinimized())wins.game.restore();
		wins.game.focus();
	}
})

electron.ipcMain.on('clear-cache', event => {
	electron.session.defaultSession.clearCache();
	electron.app.relaunch();
	electron.app.quit();
});

init.fs();

/*
// init switches
// useful info
// https://forum.manjaro.org/t/howto-google-chrome-tweaks-for-76-0-3809-100-or-newer-20190817/39946
*/

if(values.config.client.unlimited_fps){
	if(values.consts.isAMDCPU)electron.app.commandLine.appendSwitch('enable-zero-copy');
	electron.app.commandLine.appendSwitch('disable-frame-rate-limit');
}

electron.app.commandLine.appendSwitch('enable-quic');
electron.app.commandLine.appendSwitch('high-dpi-support', 1);
electron.app.commandLine.appendSwitch('ignore-gpu-blacklist');

/*
// init app menu
*/

if(process.platform == 'darwin')electron.Menu.setApplicationMenu(electron.Menu.buildFromTemplate([{
	label: 'Application',
	submenu: [{
			label: 'About Application',
			selector: 'orderFrontStandardAboutPanel:'
		},
		{
			type: 'separator'
		},
		{
			label: 'Quit',
			accelerator: 'Command+Q',
			click: _ => electron.app.quit()
		}
	]
},{
	label: 'Edit',
	submenu: [{
			label: 'Undo',
			accelerator: 'CmdOrCtrl+Z',
			selector: 'undo:'
		},
		{
			label: 'Redo',
			accelerator: 'Shift+CmdOrCtrl+Z',
			selector: 'redo:'
		},
		{
			type: 'separator'
		},
		{
			label: 'Cut',
			accelerator: 'CmdOrCtrl+X',
			selector: 'cut:'
		},
		{
			label: 'Copy',
			accelerator: 'CmdOrCtrl+C',
			selector: 'copy:'
		},
		{
			label: 'Paste',
			accelerator: 'CmdOrCtrl+V',
			selector: 'paste:'
		},
		{
			label: 'Select All',
			accelerator: 'CmdOrCtrl+A',
			selector: 'selectAll:'
		}
	]
}]));

init.prompt();

electron.app.once('ready', async () => {
	process.env.ELECTRON_DISABLE_SECURITY_WARNINGS =  true;
	
	init.fs();
	init.splash();
	init.resource_swapper();
	
	electron.protocol.registerFileProtocol('media', (request, callback) => callback(request.url.replace('media:///', '')));
	electron.ipcMain.on('quit', () => electron.app.quit());
	
	electron.ipcMain.on('keydown', (event, data) => wins.sploit && wins.sploit.webContents.send('keydown', data));
	electron.ipcMain.on('keyup', (event, data) => wins.sploit && wins.sploit.webContents.send('keyup', data));
	
	electron.ipcMain.on('ui_visibility', () => {
		values.ui_visible = !values.ui_visible;
		
		if(!wins.sploit)return;
		
		wins.sploit.setResizable(true);
		wins.sploit.setSize(sizes.cheat.width, values.ui_visible ? sizes.cheat.height: 40);
		wins.sploit.setResizable(false);
	});
	
	electron.ipcMain.on('open_path', (event, data) => electron.shell.openPath(data));
	electron.ipcMain.on('open_external', (event, data) => electron.shell.openExternal(data));
	
	electron.ipcMain.handle('sync_values', () => JSON.stringify(values));
	electron.ipcMain.on('update_values', (event, data) => {
		values = JSON.parse(data);
		
		if(wins.sploit)wins.sploit.webContents.send('receive_values', JSON.stringify(values));
		if(wins.game)wins.game.webContents.send('receive_values', JSON.stringify(values));
		
		update_config();
	});
});

electron.app.on('activate', () => {
	if(!wins.game && (!wins.splash || wins.splash.isDestroyed()))init_splash();
});

electron.app.once('before-quit', () => {
	try{
		if(wins.game)shortcut.unregisterAll();
	}catch(err){}
	
	Object.keys(wins).forEach(label => {
		if(!wins[label])return;
		
		wins[label].removeAllListeners('closed');
		wins[label].close();
	});
});

electron.app.on('window-all-closed', () => electron.app.quit());

process.on('uncaughtException', err => {
	console.error('caught:\n' + util.format(err));
});