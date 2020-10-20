module.exports = async require => {
	var electron = require('electron'),
		deep_handler = {
			get(obj, prop){
				if(prop == 'parent')return parent;
				if(prop == 'key')return key;
				
				var ret = Reflect.get(obj, prop);
				
				return typeof ret == 'object' ? new Proxy(ret, deep_handler) : obj[prop];
			},
			set: function(obj, prop, value){
				var ret = Reflect.set(obj, prop, value);
				
				electron.ipcRenderer.send('update_values', JSON.stringify(values));
				
				return ret
			},
		},
		values = await electron.ipcRenderer.invoke('sync_values').then(data => new Proxy(JSON.parse(data), deep_handler));
	
	electron.ipcRenderer.on('receive_values', (event, data) => values = new Proxy(JSON.parse(data), deep_handler));
	
	var cheat = {
			inputs: [],
			keybinds: [],
			ui_controls: [],
			randoms: new Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = [...Array(16)].map(() => Math.random().toString(36)[2]).join('').replace(/(\d|\s)/, 'V').toLowerCase().substr(0, 6);
					
					return target[prop];
				}
			}),
		},
		init_ui = async (title, footer, array) => {
			var con = document.body.appendChild(document.createElement('div')),
				con_vis = true,
				titlebar = con.appendChild(document.createElement('div')),
				movement = { tb: { value: false, } },
				cons = con.appendChild(document.createElement('div')),
				sidebar_con = cons.appendChild(document.createElement('div')),
				tab_nodes = [],
				url = window.URL.createObjectURL(new window.Blob([`
@import url('https://fonts.googleapis.com/css2?family=Inconsolata&display=swap');

body {
	margin: 0px;
	padding: 0px;
	background: #000;
}

.con {
	z-index: 9000000;
	position: absolute;
	display: flex;
	width: calc(100% - 4px);
	height: calc(100% - 4px);
	background: #112;
	border: 2px solid #eee;
	color: #eee;
	flex-direction: column;
	transition: opacity .15s ease-in-out, color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
	font: 14px Inconsolata, monospace;
	-webkit-user-select: none;
	-moz-user-select: none;
	-ms-user-select: none;
	user-select: none;
	opacity: 1;
	overflow: hidden;
}

.cons {
	display: flex;
	flex: 1 1 0;
}

.bar:hover:first-of-type {
	cursor: move;
}

.bar:first-of-type {
	transition: opacity .15s ease-in-out, color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
	border-top-left-radius: 2px;
	border-top-right-radius: 2px;
	-webkit-app-region: drag;
}

.bar:first-of-type:active {
	box-shadow: 0 0 0 3px #29F;
	border-bottom-color: transparent
}

.bar {
	height: 30px;
	min-height: 30px;
	line-height: 28px;
	text-align: center;
}

.bar-top {
	border-bottom: 2px solid #eee;
}

.con:active {
	border-bottom: 2px solid #eee
}

.sidebar-con {
	width: 30%;
	height: auto;
	display: block;
	flex: none;
	border-right: 2px solid #445;
	border-bottom: 2px solid #445
}

.tab-button {
	height: 36px;
	line-height: 36px;
	text-align: center;
	border-bottom: 2px solid #445;
	transition: opacity .1s ease-in-out
}

.tab-button:hover {
	background: #666
}

.tab-button:active {
	background: #393a3e
}

.content-con {
	flex: 1 1 0;
	display: flex;
	flex-direction: column;
}

.content {
	min-height: 36px;
	border-bottom: 2px solid #445;
	display: flex;
	flex-direction: row
}

.control-button {
	width: 36px;
	text-align: center;
	line-height: 36px;
	border-right: 2px solid #445;
	transition: ease-in-out .1s
}

.control-button:hover {
	background: #32343e;
	filter: brightness(125%)
}

.control-button.true {
	background: #2a0
}

.control-button.false {
	background: #a1050d
}

.control-label {
	flex: 1 1 0;
	padding-left: 15px;
	line-height: 36px
}

.control-slider {
	-webkit-appearance: none;
	appearance: none;
	flex: 1 1 0;
	height: 28px;
	margin: 4px 0 4px 5px;
	cursor: w-resize;
	background: #333
}

.control-slider:hover {
	background: #333
}

.control-slider-bg {
	background: #2ad;
	height: 100%
}

.control-slider:hover .control-slider-bg {
	background: #4ad
}

.control-slider::after {
	position: relative;
	height: 100%;
	text-align: center;
	display: block;
	line-height: 28px;
	top: -28px;
	content: attr(data)
}

.tab-desc {
	position: absolute;
	bottom: 32px;
	height: 30px;
	line-height: 17px;
	text-align: center;
	font-size: 12px;
}

.ver {
	position: absolute;
	top: 0px;
	right: 0px;
	width: 60px;
	line-height: 30px;
	text-align: center;
}`], { type: 'text/css' })),
				style = document.head.appendChild(document.createElement('link'));
			
			style.setAttribute('rel', 'stylesheet');
			style.setAttribute('href', url);

			style.addEventListener('load', window.URL.revokeObjectURL(url));
			
			titlebar.innerHTML = title;
			titlebar.className = 'bar bar-top';
			
			con.className = 'con';
			cons.className = 'cons';
			sidebar_con.className = 'sidebar-con';
			
			cheat.keybinds.push({
				keycode: ['KeyC', 'F1'],
				interact: () => electron.ipcRenderer.send('ui_visibility'),
			});
			
			array.forEach((tab, index) => {
				var tab_button = sidebar_con.appendChild(document.createElement('div')),
					tab_ele = cons.appendChild(document.createElement('div'));
				
				tab_nodes.push(tab_ele);
				
				tab_button.className = 'tab-button',
				tab_ele.className = 'content-con';
				if(index > 0)tab_ele.style.display = 'none';
				
				tab_button.addEventListener('click', () => (tab_nodes.forEach(ele => ele.style.display = 'none'), tab_ele.removeAttribute('style')));
				
				tab_button.innerHTML = tab.name;
				
				tab.contents.forEach(control => { try{
					var content = tab_ele.appendChild(document.createElement('div')),
						content_name = document.createElement('div'); // append after stuff
					
					control.interact = () => {
						switch(control.type){
							case'bool':
								control.val_set(!control.val_get())
								break
							case'bool_rot':
								control.aval = control.aval + 1
								if(control.aval >= control.vals.length)control.aval = 0 // past length
								control.val_set(control.vals[control.aval].val)
								break
							case'function':
								control.val_get()();
								break
							case'function_inline':
								control.val();
								break
						}
						control.update();
					};
					
					control.update = _ =>{
						switch(control.type){
							case'bool':
								control.button.className = 'control-button ' + !!control.val_get();
								break
							case'bool_rot':
								content_name.innerHTML = control.name + ': ' + control.vals[control.aval].display;
								break
						}
					};
					 
					content.className = 'content'
					
					if(control.key){
						control.button = content.appendChild(document.createElement('div'));
						control.button.addEventListener('click', control.interact);
						control.button.className = 'control-button'
						if(control.key != 'unset')control.button.innerHTML = '[' + control.key + ']'
						else control.button.innerHTML = '[-]'
					}
					
					
					switch(control.type){
						case'slider':
							movement.sd = { held: false, x: 0, y: 0 };
							
							var rtn = (number, unit) => (number / unit).toFixed() * unit,
								update_slider = (event)=>{
									if(!movement.sd.held)return;
									
									var perc = (event.offsetX / control.slider.offsetWidth * 100).toFixed(2),
										perc_rounded = rtn(perc, control.unit / 10).toFixed(2),
										value = ((control.maxVal/100) * perc_rounded).toFixed(2);
									
									if(perc_rounded <= 100 && value >= control.minVal){
										control.slider_bg.style.width = perc_rounded + '%'
										control.slider.setAttribute('data', Number(value.toString().substr(0,10)));
										
										control.val_set(value)
									}
								};
							
							control.slider = content.appendChild(document.createElement('div'));
							control.slider_bg = control.slider.appendChild(document.createElement('div'));
							control.slider.className = 'control-slider'
							control.slider_bg.className = 'control-slider-bg'
							
							control.slider_bg.style.width = control.val_get() / control.maxVal * 100 + '%'
							control.slider.setAttribute('data', control.val_get());
							
							control.slider.addEventListener('mousedown', event=>{
								movement.sd = { held: true, x: event.layerX, y: event.layerY }
								update_slider(event);
							});
							
							document.addEventListener('mouseup', _=> movement.sd.held = false );
							
							control.slider.addEventListener('mousemove', event=> update_slider(event));
							
							break
						case'bool_rot':
							
							control.vals.forEach((entry, index) =>{ if(entry.val == control.val_get())control.aval = index })
							if(!control.aval)control.aval = 0
							
							break
					}
					
					content.appendChild(content_name);
					content_name.className = 'control-label'
					content_name.innerHTML = control.name;
					
					
					control.update();
					
					if(control.key && control.key != 'unset')cheat.keybinds.push({
						keycode: typeof control.key == 'number' ? 'Digit' + control.key : 'Key' + control.key,
						interact: control.interact,
					});
					
					
					
					cheat.ui_controls.push(control);
				}catch(err){ console.error('Encountered error at %c' + control.name + ' (' + control.val + ')', 'color: #FFF', err) }});
				
				if(tab.bottom_text){
					var bottom_text = tab_ele.appendChild(document.createElement('div'));
					
					bottom_text.className = 'tab-desc'
					bottom_text.innerHTML = tab.bottom_text;
				}
			});

			
			var descbar = con.appendChild(document.createElement('div'));
			descbar.className = 'bar'
			descbar.innerHTML = footer;
			
			var verbar = con.appendChild(document.createElement('div'));
			verbar.className = 'ver'
			verbar.innerHTML = 'v0.0.0';
			
			verbar.innerHTML = 'v' + values.version;
		},
		jstr = JSON.stringify,
		super_serialize = (ob, proto) => Object.fromEntries(Object.keys(proto.prototype).map(key => [key, ob[key]]));
	
	// add listener on ui and sploit
	window.addEventListener('keydown', event => electron.ipcRenderer.send('keydown', jstr({ ...super_serialize(event, KeyboardEvent), origin: 'ui' })));
	window.addEventListener('keyup', event => electron.ipcRenderer.send('keyup', jstr({ ...super_serialize(event, KeyboardEvent), origin: 'ui' })));
	
	electron.ipcRenderer.on('keydown', (event, data) => {
		var data = JSON.parse(data),
			keybind = cheat.keybinds.find(keybind => typeof keybind.keycode == 'string'
				? keybind.keycode == data.code || keybind.keycode.replace('Digit', 'Numpad') == data.code
				: keybind.keycode.some(keycode => keycode == data.code || keycode.replace('Digit', 'Numpad') == data.code));
		
		if(!keybind || data.repeat)return;
		
		// could not find the keybind or an input bar is focused or key is was held down
		keybind.interact(data); // call the keybind callback
	});
	
	var interval = setInterval(() => {
		if(!document.body)return; else clearInterval(interval);
		
		init_ui('Shitsploit', 'Press [F1] or [C] to toggle menu', [{
			name: 'Main',
			contents: [{
				name: 'Auto aim',
				type: 'bool_rot',
				val_get: _ => values.config.aim.status,
				val_set: v => values.config.aim.status = v,
				vals: [{
					val: 'off',
					display: 'Off',
				},{
					val: 'assist',
					display: 'Assist',
				},{
					val: 'silent',
					display: 'Silent',
				},{
					val: 'full',
					display: 'Full',
				}],
				key: 3,
			},{
				name: 'Auto bhop',
				type: 'bool_rot',
				val_get: _ => values.config.game.bhop,
				val_set: v => values.config.game.bhop = v,
				vals: [{
					val: 'off',
					display: 'Off',
				},{
					val: 'keyjump',
					display: 'Key jump',
				},{
					val: 'keyslide',
					display: 'Key slide',
				},{
					val: 'autoslide',
					display: 'Auto slide',
				},{
					val: 'autojump',
					display: 'Auto jump',
				}],
				key: 4,
			},{
				name: 'ESP mode',
				type: 'bool_rot',
				val_get: _ => values.config.esp.status,
				val_set: v => values.config.esp.status = v,
				vals: [{
					val: 'off',
					display: 'Off',
				},{
					val: 'chams',
					display: 'Chams',
				},{
					val: 'box',
					display: 'Box',
				},{
					val: 'box_chams',
					display: 'Box & chams',
				},{
					val: 'full',
					display: 'Full',
				}],
				key: 5,
			},{
				name: 'Tracers',
				type: 'bool',
				val_get: _ => values.config.esp.tracers,
				val_set: v => values.config.esp.tracers = v,
				key: 6,
			},{
				name: 'Nametags',
				type: 'bool',
				val_get: _ => values.config.esp.nametags,
				val_set: v => values.config.esp.nametags = v,
				key: 7,
			},{
				name: 'Overlay',
				type: 'bool',
				val_get: _ => values.config.game.overlay,
				val_set: v => values.config.game.overlay = v,
				key: 8,
			}],
		},{
			name: 'Game',
			contents: [{
				name: 'Wireframe',
				type: 'bool',
				val_get: _ => values.config.game.wireframe,
				val_set: v => values.config.game.wireframe = v,
				key: 'unset',
			},{
				name: 'Auto respawn',
				type: 'bool',
				val_get: _ => values.config.game.auto_respawn,
				val_set: v => values.config.game.auto_respawn = v,
				key: 'unset',
			},{
				name: 'Thirdperson',
				type: 'bool',
				val_get: _ => values.config.game.thirdperson,
				val_set: v => values.config.game.thirdperson = v,
				key: 'unset',
			},{
				name: 'No zoom',
				type: 'bool',
				val_get: _ => values.config.game.no_zoom,
				val_set: v => values.config.game.no_zoom = v,
				key: 'unset',
			},{
				name: 'Speed',
				type: 'bool',
				val_get: _ => values.config.game.speed,
				val_set: v => values.config.game.speed = v,
				key: 'unset',
			}],
		},{
			name: 'Aim',
			contents: [{
				name: 'Pitch mod',
				type: 'bool_rot',
				val_get: _ => values.config.game.pitch_mod,
				val_set: v => values.config.game.pitch_mod = v,
				vals: [{
					val: 'off',
					display: 'Off',
				},{
					val: 'up',
					display: 'Up',
				},{
					val: 'down',
					display: 'Down',
				},{
					val: 'random',
					display: 'Random',
				}],
				key: 'unset',
			},{
				name: 'Auto reload',
				type: 'bool',
				val_get: _ => values.config.aim.auto_reload,
				val_set: v => values.config.aim.auto_reload = v,
				key: 'unset',
			},{
				name: 'Frustrum check',
				type: 'bool',
				val_get: _ => values.config.aim.frustrum_check,
				val_set: v => values.config.aim.frustrum_check = v,
				key: 'unset',
			},{
				name: 'Wallbangs',
				type: 'bool',
				val_get: _ => values.config.aim.wallbangs,
				val_set: v => values.config.aim.wallbangs = v,
				key: 'unset',
			},{
				name: 'Target AIs',
				type: 'bool',
				val_get: _ => values.config.aim.target_ais,
				val_set: v => values.config.aim.target_ais = v,
				key: 'unset',
			}],
		},{
			name: 'Esp',
			contents: [{
				name: 'Box thickness',
				type: 'slider',
				val_get: _ => values.config.esp.thickness,
				val_set: v => values.config.esp.thickness = v,
				minVal: 0.5,
				maxVal: 5,
				unit: 1,
			},{
				name: 'Health bars',
				type: 'bool',
				val_get: _ => values.config.esp.health_bars,
				val_set: v => values.config.esp.health_bars = v,
				key: 'unset',
			},{
				name: 'Walls',
				type: 'bool',
				val_get: _ => values.config.esp.walls,
				val_set: v => values.config.esp.walls = v,
				key: 'unset',
			},{
				name: 'Wall opacity',
				type: 'slider',
				val_get: _ => values.config.esp.wall_opacity,
				val_set: v => values.config.esp.wall_opacity = v,
				minVal: 0.1,
				maxVal: 1,
				unit: 1,
			}]
		},{
			name: 'Client',
			bottom_text: 'Shitsploit by Gaming gurus',
			contents: [{
				name: 'Unlimited FPS',
				type: 'bool',
				val_get: _ => values.config.client.unlimited_fps,
				val_set: v => {
					values.config.client.unlimited_fps = v;
					electron.ipcRenderer.send('relaunch');
				},
				key: 'unset',
			},{
				name: 'Open CSS folder',
				type: 'function_inline',
				val(){
					electron.shell.openItem(values.folders.css);
				},
				key: 'unset',
			},{
				name: 'Open JS folder',
				type: 'function_inline',
				val: _ => electron.ipcRenderer.send('open_path', values.folders.js),
				key: 'unset',
			},{
				name: 'Open swapper folder',
				type: 'function_inline',
				val: _ => electron.ipcRenderer.send('open_path', values.folders.swap),
				key: 'unset',
			},{
				name: 'Join our Discord',
				type: 'function_inline',
				val: _ => electron.ipcRenderer.send('open_external', 'https://skidlamer.github.io/'),
				key: 'unset',
			},{
				name: 'Reset settings',
				type: 'function_inline',
				val(){
					values.config = Object.assign({}, values.original_config);
					
					cheat.ui_controls.forEach(control => {
						if(control.type == 'bool_rot')control.aval = 0;
						control.update();
					});
				},
				key: 'unset',
			}],
		}]);
	});
}