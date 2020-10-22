var fs = require('fs'),
	path = require('path'),
	electron = require('electron'),
	cheat = {},
	THREE = {},
	gen_asset = (content_type, data) => 'asset:{' + encodeURIComponent(content_type) + '},{' + encodeURIComponent(btoa(data)) + '}',
	uhook = (orig_func, handler) => {
		var func = function(){
			return Reflect.apply(handler, this, [orig_func, this, arguments]);
		};
		
		func.toString = Reflect.apply(Function.prototype.bind, orig_func.toString, [orig_func]);
		Reflect.defineProperty(func.toString, 'name', { get: _ =>  orig_func.toString.name });
		Reflect.defineProperty(func, 'length', { get: _ => orig_func.length });
		func.__lookupGetter__ = func.toString.__lookupGetter__ = function(){ try{ Reflect.apply(orig_func, this, arguments) }catch(err){ throw err } }
		func.toString.__lookupGetter__.toString = Function.prototype.bind.apply(func.toString.__lookupGetter__.toString, [orig_func.__lookupGetter__]);
		
		return func
	},
	init = async () => {
		var values = await electron.ipcRenderer.invoke('sync_values').then(JSON.parse),
			config = values.config; // assign it too lazy to rewrite all stuff
		
		electron.ipcRenderer.on('receive_values', (event, data) => {
			values = JSON.parse(data);
			config = values.config;
		});
		
		cheat = {
			object_list: Object.keys(window).filter(label => window[label] && typeof window[label] == 'function' && String(window[label]) == 'function ' + label + '() { [native code] }'),
			vars_not_found: [],
			vars: [],
			symbols: new Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = Symbol();
					
					return target[prop];
				}
			}),
			randoms: new Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = [...Array(16)].map(() => Math.random().toString(36)[2]).join('').replace(/(\d|\s)/, 'V').toLowerCase().substr(0, 6);
					
					return target[prop];
				}
			}),
			objects: new Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = cheat.object_list[~~(Math.random() * cheat.object_list.length)];
					
					return target[prop];
				}
			}),
			key_press: (keycode, keyname, keycode2, keyud) => document.dispatchEvent(new KeyboardEvent(keyud,{altKey:false,bubbles:true,cancelBubble:false,cancelable:true,charCode:0,code:keyname,composed:true,ctrlKey:false,currentTarget:null,defaultPrevented:true,detail:0,eventPhase:0,explicitOriginalTarget:document.body,isComposing:false,isTrusted:true,key:keyname,keyCode:keycode,layerX:0,layerY:0,location:0,metaKey:false,originalTarget:document.body,rangeOffset:0,rangeParent:null,repeat:false,returnValue:false,shiftKey:false,srcElement:document.body,target:document.body,timeStamp:Date.now(),type:keyud,view:parent,which:keycode})),
			log(){
				if(values.consts.ss_dev || values.consts.ss_dev_debug)console.log('%cShitsploit', 'background: #27F; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', ...arguments);
				return true;
			},
			wrld2scrn(pos, aY = 0){
				if(!cheat.cas)return { x: 0, y: 0 };
				
				var camera = cheat.world.camera,
					frustum = cheat.world.frustum;
				
				camera.updateMatrix();
				camera.updateMatrixWorld();
				
				pos.y += aY;
				pos.project(cheat.world.camera);
				
				pos.x = (pos.x + 1) / 2;
				pos.y = (-pos.y + 1) / 2;
				
				pos.x *= cheat.cas.width;
				pos.y *= cheat.cas.height;
				
				var v2 = { x: pos.x, y: pos.y, distanceTo(p2){
							var dx = this.x - p2.x,
								dy = this.y - p2.y,
								dz = this.z - p2.z;
							
							return Math.hypot(dx, dy, dz);
					}, },
					cvpm = new THREE.Matrix4();
				
				camera.matrixWorldInverse.getInverse(camera.matrixWorld);
				cvpm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
				frustum.setFromMatrix(cvpm);
				
				v2.on_src = frustum.containsPoint(pos);
				
				return v2
			},
			getD3D(x1, y1, z1, x2, y2, z2){
				var dx = x1 - x2,
					dy = y1 - y2,
					dz = z1 - z2;
				
				return Math.sqrt(dx * dx + dy * dy + dz * dz);
			},
			getDir(x1, y1, x2, y2){
				return Math.atan2(y1 - y2, x1 - x2);
			},
			getXDire(x1, y1, z1, x2, y2, z2){
				var h = Math.abs(y1 - y2),
					dst = cheat.getD3D(x1, y1, z1, x2, y2, z2);
				
				return (Math.asin(h / dst) * ((y1 > y2) ? -1 : 1));
			},
			round: (n, r) => Math.round(n * Math.pow(10, r)) / Math.pow(10, r),
			ctr(label, args = []){ // ctx raw
				if(!cheat.ctx)return;
				
				try{ return Reflect.apply(CanvasRenderingContext2D.prototype[label], cheat.ctx, args);
				}catch(err){ console.error(err); return {};
				}
			},
			find_match: async () => {
				var new_match = null,
					games = [],
					region = ({
						SYD: 'au-syd',
						TOK: 'jb-hnd',
						MIA: 'us-fl',
						SV: 'us-ca-sv',
						FRA: 'de-fra',
						SIN: 'sgp',
						NY: 'us-nj',
					})[window.location.href.split('=')[1].split(':')[0]],
					data = await fetch('https://matchmaker.krunker.io/game-list?hostname=' + window.location.host, {
						headers: {
							'user-agent': navigator.userAgent,
						}
					}),
					body = await data.text();
				
				try{
					data = JSON.parse(body);
				}catch(err){
					data.error = err
				}
				
				if(data.error)return console.error(data, body, data.error);
				
				new_match = data.games
				.map(([ match_id, match_region, match_players, match_max_players, gamemode ]) => ({
					id: match_id,
					region: match_region,
					players: match_players,
					max_players: match_max_players,
					gamemode: {
						name: gamemode.i,
						game_id: gamemode.v,
						custom: gamemode.cs,
					}
				}))
				// modify a bit to join the smallest match, but do fullest for release
				.sort((prev_match, match) => ((match.players >= 6 ? 4 : match.players) / match.max_players) * 100 - ((prev_match.players >= 6 ? 4 : prev_match.players) / prev_match.max_players) * 100)
				.find(match => !match.gamemode.custom && match.region == region && (match.players <= match.max_players - 2 || match.players <= match.max_players - 1));
				
				return new_match ? window.location.href = 'https://krunker.io?game=' +  new_match.id : 'could not find match';
			},
			process_interval(){ // run every 500 ms
				var intxt = document.querySelector('#instructions').textContent;
				
				if(config.game.auto_respawn){
					if(/(disconnected|game is full|banned|kicked)/gi.test(intxt))cheat.find_match()
					else if(cheat.controls && (!cheat.player || !cheat.player.active) && /click to play/gi.test(intxt))cheat.controls.toggle(true);
				}
				
				document.querySelectorAll('#streamContainer, #aHolder, #endAHolderL, #endAHolderR').forEach(node => node.style.display = 'none');
				
				document.querySelectorAll('.streamItem').forEach(node => node.children[0].src = '');
			},
			procInputs(data){
				if(!cheat.controls || !cheat.player)return;
				
				var keys = {frame: 0, delta: 1, ydir: 2, xdir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, crouch: 8, reload: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12},
					move_dirs = { idle: -1, forward: 1, back: 5, left: 7, right: 3 };
				
				// skid bhop
				if(config.game.bhop != 'off'){
					if(cheat.inputs.Space || config.game.bhop == 'autojump' || config.game.bhop == 'autoslide'){
						cheat.controls.keys[cheat.controls.binds.jumpKey.val] ^= 1;
						if(cheat.controls.keys[cheat.controls.binds.jumpKey.val])cheat.controls.didPressed[cheat.controls.binds.jumpKey.val] = 1;
						
						if(document.activeElement.nodeName != 'INPUT' && config.game.bhop == 'keyslide' && cheat.inputs.Space || config.game.bhop == 'autoslide'){
							if(cheat.player[cheat.vars.yVel] < -0.02 && cheat.player.canSlide){
								setTimeout(() => cheat.controls.keys[cheat.controls.binds.crouchKey.val] = 0, 325);
								cheat.controls.keys[cheat.controls.binds.crouchKey.val] = 1;
							}
						}
					}
				}
				
				// auto reload, currentAmmo set earlier
				if(cheat.player && !cheat.player.currentAmmo && config.aim.auto_reload)data[keys.reload] = 1;
				
				// aiming
				if(cheat.target && !cheat.player[cheat.vars.reloadTimer]){
					var twoPI = Math.PI * 2,
						yVal = cheat.target.y + (1 - cheat.target[cheat.vars.crouchVal] * 3),
						// (cheat.target.isAI ? cheat.game.AI.ais[0].dat.mSize / 1.5 : 1 - cheat.target[cheat.vars.crouchVal] * 3),
						yDire = cheat.getDir(cheat.player.z || cheat.controls.object.position.z, cheat.player.x || cheat.controls.object.position.x, cheat.target.z, cheat.target.x),
						xDire = cheat.getXDire(cheat.player.x || cheat.controls.object.position.x, cheat.player.y || cheat.controls.object.position.y, cheat.player.z || cheat.controls.object.position.z, cheat.target.x, yVal, cheat.target.z),
						xD = cheat.round(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, xDire - cheat.player[cheat.vars.recoilAnimY] * 0.27 )) % twoPI, 3),
						yD = cheat.round(yDire % twoPI, 3),
						rot = { x: xD, y: yD };
					
					data[keys.delta] += 1;
					
					switch(config.aim.status){
						case'silent':
							// dont shoot if weapon is on shoot cooldown
							if(cheat.player.weapon.nAuto && cheat.player[cheat.vars.didShoot])data[keys.shoot] = data[keys.scope] = 0;
							else{
								data[keys.scope] = 1
								
								// if fully aimed or weapon cant even be aimed or weapon is melee and nearby, shoot
								if(!cheat.player[cheat.vars.aimVal] || cheat.player.weapon.noAim || (cheat.player.weapon.melee && cheat.player.pos.distanceTo(cheat.target.pos) <= 18))data[keys.shoot] = 1;
							}
							
							// wait until we are shooting to look at enemy
							if(data[keys.shoot] || cheat.player.weapon.melee){
								data[keys.xdir] = rot.x * 1000
								data[keys.ydir] = rot.y * 1000
							}
							
							break
						case'assist':
							if(cheat.controls[cheat.vars.mouseDownR] || cheat.controls.keys[cheat.controls.binds.aimKey.val]){
								cheat.controls[cheat.vars.pchObjc].rotation.x = rot.x
								cheat.controls.object.rotation.y = rot.y
							}
							
							break
						case'full':
							if(cheat.player.weapon.nAuto && cheat.player[cheat.vars.didShoot]){
								data[keys.shoot] = 0
								data[keys.scope] = 0
							}else{
								var dist = cheat.player.pos.distanceTo(cheat.target.pos);
								
								data[keys.scope] = 1
								
								// if fully aimed or weapon cant even be aimed or weapon is melee and nearby, shoot
								if(!cheat.player[cheat.vars.aimVal] || cheat.player.weapon.noAim || (cheat.player.weapon.melee && dist <= 18))data[keys.shoot] = 1;
							}
							
							if(data[keys.shoot] == 1 || cheat.player.weapon.melee){
								cheat.controls[cheat.vars.pchObjc].rotation.x = rot.x
								cheat.controls.object.rotation.y = rot.y
								data[keys.xdir] = rot.x * 1000
								data[keys.ydir] = rot.y * 1000
							}
							
							break
					}
				}else{
					// 0.27
					data[keys.xdir] = (cheat.controls[cheat.vars.pchObjc].rotation.x - cheat.player[cheat.vars.recoilAnimY] * 0.27) * 1000
					data[keys.ydir] = cheat.controls.object.rotation.y * 1000
				}
				
				if(config.game.delt)data[keys.delta] = -1;
				
				if((!cheat.player[cheat.vars.didShoot] && !data[keys.shoot] || cheat.player[cheat.vars.reloadTimer]) && config.game.pitch_mod && config.game.pitch_mod != 'off')switch(config.game.pitch_mod){
					case'random': cheat.ys = !cheat.ys; data[keys.xdir] = 10e3 * (cheat.ys ? 1 : -1); break
					case'up': data[keys.xdir] = 10e3 * 1; break
					case'down': data[keys.xdir] = 10e3 * -1; break
				}
			},
			process(){ try{
				if(!cheat.game)return;
				
				cheat.controls[cheat.vars.pchObjc].rotation.x -= cheat.inputs.ArrowDown ? 0.006 : 0;
				cheat.controls[cheat.vars.pchObjc].rotation.x += cheat.inputs.ArrowUp ? 0.006 : 0;
				
				cheat.controls.object.rotation.y -= cheat.inputs.ArrowRight ? 0.00675 : 0;
				cheat.controls.object.rotation.y += cheat.inputs.ArrowLeft ? 0.00675 : 0;
				
				cheat.server_vars.kickTimer = Infinity;
				
				cheat.game.config.deltaMlt = cheat.game.config.deltaMlt = config.game.speed ? 1.05 : 1;
				cheat.game.config.thirdPerson = config.game.thirdperson ? true : false;
				
				if(!cheat.controls || !cheat.world || !cheat.player)return;
				
				cheat.game.players.list.forEach(ent => {
					if(!ent.pos2D)Object.defineProperties(ent, {
						pos: { get: _ => ({
							distanceTo(p2){
								var dx = this.x - p2.x,
									dy = this.y - p2.y,
									dz = this.z - p2.z;
								
								return Math.hypot(dx, dy, dz);
							},
							x: ent.x != null ? ent.x : 0,
							y: ent.y != null ? ent.y : 0,
							z: ent.z != null ? ent.z : 0,
							project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)},
							applyMatrix4: function(t){var e=this.x,n=this.y,r=this.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,this},
							clone(){return Object.assign({}, this)},
						})},
						pos2D: { get: _ => ent.x != null ? cheat.wrld2scrn(Object.assign({}, ent.pos)) : { x: 0, y: 0, z: 0 } },
						canSee: { get: _ => ent.isActive && cheat.game[cheat.vars.canSee](cheat.player, ent.x, ent.y, ent.z) == null ? true : false },
						inFrustrum: { get: _ => ent.isActive && cheat.world.frustum.containsPoint(ent.pos) },
					});
					
					ent.isActive = ent.x != null && cheat.ctx && ent.objInstances && ent.health > 0;
					ent.isEnemy = !ent.team || ent.team != cheat.player.team;
					ent.isRisk = ent.isDev || ent.isMod || ent.isMapMod || ent.canGlobalKick || ent.canViewReports || ent.partnerApp || ent.canVerify || ent.canTeleport || ent.isKPDMode || ent.level >= 30;
					ent.objInstances = ent[cheat.vars.objInstances];
					ent.currentAmmo = ent[cheat.vars.ammos] ? ent[cheat.vars.ammos][ent[cheat.vars.weaponIndex]] : 1;
					
					if(!ent.isActive)return;
					
					// we are at fastest tick so we can do this
					if(ent.objInstances)ent.objInstances.visible = true;
					ent[cheat.vars.inView] = cheat.hide_nametags ? false : config.esp.nametags ? true : ent[cheat.vars.inView];
					
					if(ent.weapon && !ent.weapon[cheat.symbols.org_zoom])ent.weapon[cheat.symbols.org_zoom] = ent.weapon.zoom;
					
					if(ent.weapon && !ent.weapon[cheat.symbols.zoom])ent.weapon[cheat.symbols.zoom] = Reflect.defineProperty(ent.weapon, 'zoom', {
						get: _ => config.game.no_zoom ? 1 : ent.weapon[cheat.symbols.org_zoom],
						set: n => ent.weapon._zoom = n,
					});
				});
			}catch(err){ console.error('CAUGHT:', err) }},
			render(){ // rendering tasks
				if(!cheat.cas || !cheat.ctx){
					cheat.cas = document.querySelector('#game-overlay');
					cheat.ctx = document.querySelector('#game-overlay') ? document.querySelector('#game-overlay').getContext('2d', { alpha: true }) : {};
					
					cheat.center_vec = {
						x: window.innerWidth / 2,
						y: window.outerHeight / 2,
						distanceTo(p2){ return Math.hypot(this.x - p2.x, this.y - p2.y) }
					}
				}
				
				cheat.ctr('resetTransform');
				
				// draw overlay stuff
				if(config.game.overlay && cheat.game && cheat.ctx){
					cheat.ctx.strokeStyle = '#000'
					cheat.ctx.font = 'Bold 14px ' + cheat.font;
					cheat.ctx.textAlign = 'start';
					cheat.ctx.lineWidth = 2.6;
					
					[
						[['#BBB', 'Player: '], ['#FFF', cheat.player && cheat.player.pos ? ['x', 'y', 'z'].map(axis => axis + ': ' + cheat.player.pos[axis].toFixed(2)).join(', ') : 'N/A']],
						[['#BBB', 'Target: '], ['#FFF', cheat.target && cheat.target.isActive ? cheat.target.alias + ', ' + ['x', 'y', 'z'].map(axis => axis + ': ' + cheat.target.pos[axis].toFixed(2)).join(', ') : 'N/A']],
						[['#BBB', 'Hacker: '], [window.activeHacker ? '#0F0' : '#F00', window.activeHacker ? 'TRUE' : 'FALSE']],
					].forEach((line, index, lines) => {
						var text_xoffset = 0;
						
						line.forEach(([ color, string ], text_index) => {
							var textX = 12 + text_xoffset + text_index * 2,
								textY = (cheat.cas.height / 2) - ((lines.length * 30) / 2) + index * 20;
							
							cheat.ctx.fillStyle = color;
							
							cheat.ctr('strokeText', [string, textX, textY]);
							cheat.ctr('fillText', [string, textX, textY]);
							
							text_xoffset += cheat.ctr('measureText', [string]).width;
						});
					});
				}
				
				if(!cheat.game || !cheat.controls || !cheat.world)return;
				
				cheat.world.scene.children.forEach(item => {
					// return if item is not what we are looking for
					if(item.type != 'Mesh' || !item.dSrc)return;
					
					// store original material data
					if(!item.orig_mat)item.orig_mat = { ... item.material };
					
					item.material.transparent = config.esp.walls ? true : item.orig_mat.transparent;
					item.material.opacity = config.esp.walls ? item.orig_mat.opacity * config.esp.wall_opacity : item.orig_mat.opacity;
				});
				
				var targets;
				
				if(config.aim.target_ais && cheat.game.AI.ais.length){
					var ais = cheat.game.AI.ais.filter(ent => ent.mesh && ent.mesh.visible && ent.health && ent.x && ent.canBSeen);
					
					ais.forEach(ent => {
						ent.pos = {
							distanceTo(p2){
								var dx = this.x - p2.x,
									dy = this.y - p2.y,
									dz = this.z - p2.z;
								
								return Math.hypot(dx, dy, dz);
							},
							x: ent.x != null ? ent.x : 0,
							y: ent.y != null ? ent.y : 0,
							z: ent.z != null ? ent.z : 0,
							project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)},
							applyMatrix4: function(t){var e=this.x,n=this.y,r=this.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,this},
							clone(){return Object.assign({}, this)},
						};
						
						ent.canSee = cheat.game[cheat.vars.canSee](cheat.player, ent.x, ent.y, ent.z) == null ? true : false;
						ent.inFrustrum = cheat.world.frustum.containsPoint(ent.pos);
						ent.pos2D = ent.x != null ? cheat.wrld2scrn(Object.assign({}, ent.pos)) : { x: 0, y: 0, z: 0 };
					});
					
					targets = ais.filter(ent => ent.pos2D && ent.canSee && (config.aim.frustrum_check ? ent.inFrustrum : true));
					
				}else targets = cheat.game.players.list.filter(ent => !ent[cheat.vars.isYou] && ent.pos2D && ent.isActive && ent.canSee && ent.isEnemy && (config.aim.frustrum_check ? ent.inFrustrum : true));
				
				cheat.target = targets.sort((ent_1, ent_2) => ent_1.pos2D.distanceTo(cheat.center_vec) - ent_1.pos2D.distanceTo(cheat.center_vec))[0];
				
				cheat.game.players.list.filter(ent => ent.isActive && ent.inFrustrum && cheat.player.pos && !ent[cheat.vars.isYou]).forEach(ent => {
					var src_pos = cheat.wrld2scrn(ent.pos.clone()),
						src_pos_crouch = cheat.wrld2scrn(ent.pos.clone(), ent.height - ent[cheat.vars.crouchVal] * 3),
						esp_width = ~~((src_pos.y - cheat.wrld2scrn(ent.pos.clone(), ent.height).y) * 0.6),
						esp_height = src_pos.y - src_pos_crouch.y,
						esp_box_y = src_pos.y - esp_height,
						cham_color = ent.isEnemy ? ent.isRisk ? '#F70' : '#F00' : '#0F0',
						cham_color_full = parseInt(cham_color.substr(1).split('').map(e => e+e).join(''), 16); // turn #FFF into #FFFFFF
					
					// teammate = green, enemy = red, risk + enemy = orange
					
					// cham ESP & wireframe
					var chams_enabled = config.esp.status == 'chams' || config.esp.status == 'box_chams' || config.esp.status == 'full';
					if(ent[cheat.vars.objInstances])ent[cheat.vars.objInstances].traverse(obj => {
						if(obj.type != 'Mesh')return;
						
						obj.material.wireframe = Boolean(config.game.wireframe);
						
						if(ent[cheat.vars.isYou])return;
						
						if(chams_enabled && obj.material.type != 'MeshBasicMaterial'){ // set material
							if(!obj.orig_mat)obj.orig_mat = Object.assign(Object.create(Object.getPrototypeOf(obj.material)), obj.material);
							
							obj.material = new THREE.MeshBasicMaterial({
								transparent: true,
								fog: false,
								depthTest: false,
								color: cham_color,
							});
						// update color
						}else if(chams_enabled && obj.material.type == 'MeshBasicMaterial')obj.material.color.setHex(cham_color_full); // remove # at start
						// remove material
						else if(!chams_enabled && obj.orig_mat && obj.material.type == 'MeshBasicMaterial')obj.material = obj.orig_mat
					});
					
					// box ESP
					if(config.esp.status == 'box' || config.esp.status == 'box_chams' || config.esp.status == 'full'){
						cheat.ctx.strokeStyle = cham_color
						cheat.ctx.lineWidth = config.esp.thickness;
						cheat.ctr('strokeRect', [src_pos.x - esp_width / 2,  esp_box_y, esp_width, esp_height]);
					}
					
					// health bar, red - yellow - green gradient
					var hp_perc = (ent.health / ent[cheat.vars.maxHealth]) * 100;
					
					if(config.esp.status == 'full' || config.esp.health_bars){
						var hp_grad = cheat.ctr('createLinearGradient', [0, src_pos.y - esp_height, 0, src_pos.y - esp_height + esp_height]),
							box_ps = [src_pos.x - esp_width, src_pos.y - esp_height, esp_width / 4, esp_height];
						
						hp_grad.addColorStop(0, '#F00');
						hp_grad.addColorStop(0.5, '#FF0');
						hp_grad.addColorStop(1, '#0F0');
						
						// background of thing
						cheat.ctx.strokeStyle = '#000';
						cheat.ctx.lineWidth = 2;
						cheat.ctx.fillStyle = '#666';
						cheat.ctr('strokeRect', box_ps);
						
						// inside of it
						cheat.ctr('fillRect', box_ps);
						
						// colored part
						cheat.ctx.fillStyle = hp_grad
						cheat.ctr('fillRect', [box_ps[0], box_ps[1], box_ps[2], (hp_perc / 100) * esp_height]);
					}
					
					// full ESP
					cheat.hide_nametags = config.esp.status == 'full'
					if(config.esp.status == 'full'){
						// text stuff
						var hp_red = hp_perc < 50 ? 255 : Math.round(510 - 5.10 * hp_perc),
							hp_green = hp_perc < 50 ? Math.round(5.1 * hp_perc) : 255,
							hp_color = '#' + ('000000' + (hp_red * 65536 + hp_green * 256 + 0 * 1).toString(16)).slice(-6),
							player_dist = cheat.player.pos.distanceTo(ent.pos),
							text_x = src_pos_crouch.x + 12 + (esp_width / 2),
							text_y = src_pos.y - esp_height,
							yoffset = 0,
							font_size = 12 - (player_dist * 0.005);
						
						cheat.ctx.textAlign = 'middle';
						cheat.ctx.font = 'Bold ' + font_size + 'px ' + cheat.font;
						cheat.ctx.strokeStyle = '#000';
						cheat.ctx.lineWidth = 2.5;
						
						[
							[['#FB8', ent.alias], ent.clan ? ['#FFF', ' [' + ent.clan + ']'] : null],
								[[hp_color, ent.health + '/' + ent[cheat.vars.maxHealth] + ' HP']],
							// player weapon & ammo
							[['#FFF', ent.weapon.name ],
								['#BBB', '['],
								['#FFF', (ent.weapon.ammo ? ent.currentAmmo : 'N') + '/' + (ent.weapon.ammo ? ent.weapon.ammo : 'A') ],
								['#BBB', ']']],
							[['#BBB', 'Risk: '], [(ent.isRisk ? '#0F0' : '#F00'), ent.isRisk]],
							[['#BBB', '['], ['#FFF', (player_dist / 10).toFixed() + 'm'], ['#BBB', ']']],
						].forEach((line, text_index) => {
							var texts = line.filter(entry => entry),
								xoffset = 0;
							
							texts.forEach(([ color, text ]) => {
								cheat.ctx.fillStyle = color;
								
								cheat.ctr('strokeText', [text, text_x + xoffset, text_y + yoffset]);
								cheat.ctr('fillText', [text, text_x + xoffset, text_y + yoffset]);
								
								xoffset += cheat.ctr('measureText', [ text ]).width + 2;
							});
							
							yoffset += font_size + 2;
						});
					}
					
					// tracers
					if(config.esp.tracers){
						cheat.ctx.strokeStyle = cham_color
						cheat.ctx.lineWidth = 2
						cheat.ctx.lineCap = 'round'
						
						cheat.ctr('beginPath');
						cheat.ctr('moveTo', [cheat.cas.width / 2, cheat.cas.height]);
						cheat.ctr('lineTo', [src_pos.x, src_pos.y - esp_height / 2]);
						cheat.ctr('stroke');
					}
				});
			},
			ys: 0,
			inputs: [],
			find_vars: [
				['isYou', /this\['accid'\]=0x0,this\['(\w+)'\]=\w+,this\['isPlayer'\]/, 1],
				['objInstances', /this\['list']\[\w+]\['(\w+)']\['visible']=!0x1,this\['list']\[\w+]\['(\w+)']=!0x1;/, 1],
				['inView', /this\['list']\[\w+]\['(\w+)']\['visible']=!0x1,this\['list']\[\w+]\['(\w+)']=!0x1;/, 2],
				['camera', /\['(\w+)'\]=new q\['Object3D'\]\(\),this\['\1'\]/, 1],
				['pchObjc', /0x0,this\['(\w+)']=new \w+\['Object3D']\(\),this/, 1],
				['aimVal', /this\['(\w+)']-=0x1\/\(this\['weapon']\['aimSpd']/, 1],
				['crouchVal', /this\['(\w+)']\+=\w\['crouchSpd']\*\w+,0x1<=this\['\w+']/, 1],
				['recoilAnimY', /this\['(\w+)']=0x0,this\['recoilForce'\]=0x0/, 1],
				['canSee', /\w+\['(\w+)']\(\w+,\w+\['x'],\w+\['y'],\w+\['z']\)\)&&/, 1],
				['didShoot', /--,\w+\['(\w+)']=!0x0/, 1],
				['ammos', /\['length'];for\(\w+=0x0;\w+<\w+\['(\w+)']\['length']/, 1],
				['weaponIndex', /\['weaponConfig']\[\w+]\['secondary']&&\(\w+\['(\w+)']==\w+/, 1],
				['maxHealth', /\['regenDelay'],this\['(\w+)']=\w+\['mode'\]&&\w+\['mode']\['\1']/, 1],
				['nAuto', /!this\['doingInter']\){var \w+=this\['\w+']\|\|!this\['weapon']\['(\w+)']&&a0\[0x5];/, 1],
				['xVel', /this\['x']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedX']/, 1],
				['yVel', /this\['y']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedY']/, 1],
				['zVel', /this\['z']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedZ']/, 1],
				['reloadTimer', /this\['(\w+)']-=\w+,\w+\['reloadUIAnim']/, 1],
				['mouseDownR', /this\['(\w+)']=0x0,this\['keys']=/, 1], 
			],
			/*
			/this\['(\w+)']=\w+\['round']\(0x3\),this\['(\w+)']=\w+\['round']/
			1 xDire 2 yDire
			*/
			patches: new Map([
				// wallbangs
				[/\['noShoot']&&(\w+)\['active']&&\(!\1\['transparent']\|\|(\w+)\)/, '.noShoot && $1.active && ($1.transparent || $2 || (!ss_data.target().isAI && ss_data.config().aim.wallbangs && ss_data.player() && ss_data.player().weapon) ? (!$1.penetrable || !ss_data.player().weapon.pierce) : true)'],
				// get vars
				[/(this\['moveObj']=func)/, 'ss_data.game = this, $1'],
				[/(this\['backgroundScene']=)/, 'ss_data.world = this, $1'],
				[/((\w+)\['exports']\['enableHttps']=\w+\['exports']\['isProd'])/g, 'ss_data.server_vars = $2.exports, $1'],
				[/((\w+)\['exports']\['keyboardMap']=)/, ' ss_data.utils = $2.exports; $1'],
				
				[/(this\['\w+']=function\(\w+,\w+,\w+,\w+\){)(this\['recon'])/, '$1 { ss_data.procInputs(...arguments) }; $2'],
				
				// have a proper interval for rendering
				[/requestAnimFrame\(/g, 'ss_data.frame() && requestAnimFrame('],
				// fix fps count
				[/(\['push']\(\w+\),\w+=)(\w+\['length'])(,\w+&&0x)/, '$1 ~~(ss_data.game?.config?.deltaMlt * $2) $3'],
				// billboard fix
				[/(var \w+)=\(\w+\['exports']\['isString']\(\w+\)\?v:'.*?'\)/, '$1 = "Your Ad Here"'],
				
				// [/(function\(\w,\w,(\w)\){)'use strict';(\(function\((\w)\){)\//, '$1$3 ss_data.exports = $2.c; ss_data.modules = $2.m;/'],
			]),
			font: 'Inconsolata, monospace',
			storage: {
				/*modules: [],
				exports: [],*/
				config(){ return config },
				player(){ return cheat.player ? cheat.player : { weapon: { pierce: false } } },
				target(){ return cheat.target ? cheat.target : { isAI : false } },
				frame(){
					cheat.game = cheat.storage.game;
					cheat.world = cheat.storage.world;
					cheat.server_vars = cheat.storage.server_vars;
					cheat.player = cheat.game ? cheat.game.players.list.find(player => player[cheat.vars.isYou]) : null;
					cheat.controls = cheat.game ? cheat.game.controls : null;
					cheat.utils = cheat.storage.utils;
					/*cheat.modules = cheat.storage.modules;
					cheat.exports = cheat.storage.exports;*/
					
					
					
					if(cheat.world)cheat.world.scene.onBeforeRender = cheat.process;
					cheat.render();
					
					return true;
				},
				info(data, win){
					switch(data){
						case'injected':
							
							cheat.log('injected to game');
							
							// hide storage object now that it has been assigned
							cheat.log('hiding: ' + cheat.objects.storage + '.' + cheat.randoms.storage);
							win[cheat.objects.storage][cheat.randoms.storage] = void 0;
							
							break
					}
				},
			},
		};
		
		setInterval(cheat.process_interval, 1000);
		
		// pass storage object to game
		cheat.patches.set(/^/, '(ss_data => { ss_data.info("injected", window); return ');
		cheat.patches.set(/$/g, '})(' + cheat.objects.storage + '.' + cheat.randoms.storage + ')');
		
		cheat.storage.procInputs = cheat.procInputs;
		
		electron.ipcRenderer.on('esc', () => {
			document.exitPointerLock();
			
			cheat.key_press(18, 'Alt', 'AltLeft', 'keydown');
			cheat.key_press(18, 'Alt', 'AltLeft', 'keyup');
		});
		
		window.prompt = text => electron.ipcRenderer.sendSync('prompt', { type: 'text', data: text });
		
		var interval = setInterval(async () => { try{
			if(!document || !document.head)return;	
			else clearInterval(interval);	
			
			// load cheat font
			new window.FontFace('Inconsolata', 'url("https://fonts.gstatic.com/s/inconsolata/v20/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp4U8WR32lw.woff2")', {
				family: 'Inconsolata',
				style: 'normal',
				weight: 400,
				stretch: '100%',
				unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
			}).load().then(font => document.fonts.add(font));
			
			var dom_interval = setInterval(() => {
				if(!document.querySelector('#subLogoButtons'))return; else clearInterval(dom_interval);
				// add button
				document.querySelectorAll('.menuItemIcon').forEach(el => el.style.height = '60px');
				document.querySelectorAll('.downloadClient, #merchImg').forEach(node => node.remove());
				
				var button = document.querySelector('#subLogoButtons').appendChild(document.createElement('div'));
				button.setAttribute('class', 'button small buttonB');
				button.addEventListener('mouseenter', window.playTick);
				button.addEventListener('click', () => window.location.href = 'https://krunker.io');
				button.innerHTML = 'Find game';
			}, 50);
			
			// css and js
			var load_css = fs.readdirSync(values.folders.css).filter(file_name => path.extname(file_name).match(/\.css$/i)).map(file_name => window.URL.createObjectURL(new Blob([ fs.readFileSync(path.join(values.folders.css, file_name), 'utf8') ], { type: 'text/css' }))).map(blob => '@import url("' + blob + '");').join('\n'),
				load_js = fs.readdirSync(values.folders.js).filter(file_name => path.extname(file_name).match(/\.js$/i)).map(file_name => fs.readFileSync(path.join(values.folders.js, file_name), 'utf8'));
			
			// load js
			load_js.forEach(data => {
				var js_url = window.URL.createObjectURL(new window.Blob([ data ], { type: 'application/javascript' })),
					js_tag = document.head.appendChild(document.createElement('script'));
				
				js_tag.src = js_url;
				js_tag.addEventListener('load', () => window.URL.revokeObjectURL(js_url), js_tag.remove());
			});
			
			// load css 
			var css_tag = document.head.appendChild(document.createElement('link')),
				css_url = window.URL.createObjectURL(new window.Blob([ load_css ], { type: 'text/css' }));
			
			css_tag.href = css_url;
			css_tag.rel = 'stylesheet';	
			css_tag.addEventListener('load', () => window.URL.revokeObjectURL(css_url));
		}catch(err){ console.log(err) } }, 50);
	},
	jstr = JSON.stringify,
	super_serialize = (ob, proto) => Object.fromEntries(Object.keys(proto.prototype).map(key => [key, ob[key]]));
	inject = () => {
		window.addEventListener('keydown', event => (cheat.inputs[event.code] = true, electron.ipcRenderer.send('keydown', jstr({ ...super_serialize(event, KeyboardEvent), origin: 'game' }))));
		window.addEventListener('keyup', event => (cheat.inputs[event.code] = false, electron.ipcRenderer.send('keyup', jstr({ ...super_serialize(event, KeyboardEvent), origin: 'game' }))));
		
		// clear all inputs when window is not focused
		window.addEventListener('blur', () => cheat.inputs = []);
		
		window.HTMLBodyElement.prototype.appendChild = uhook(window.HTMLBodyElement.prototype.appendChild, (target, thisArg, [node]) => {
			var ret = Reflect.apply(target, thisArg, [node]);
			
			if(node.nodeName == 'IFRAME' && node.style.display == 'none'){
				node.contentWindow.WebAssembly = window.WebAssembly;
				node.contentWindow.Response.prototype.arrayBuffer = uhook(node.contentWindow.Response.prototype.arrayBuffer, (target_buf, thisArg, argArray) => Reflect.apply(target_buf, thisArg, argArray).then(ret => {
					var arr = new Uint8Array(ret),
						xor_key = arr[0]  ^ '!'.charCodeAt(),
						code = Array.from(arr).map(chr => String.fromCharCode(chr ^ xor_key)).join('');
					
					if(!code.includes('isProd'))return ret;
					
					// restore functions
					node.contentWindow.Response.prototype.arrayBuffer = target_buf;
					window.HTMLBodyElement.prototype.appendChild = target;
					
					// find stuff and patch stuff
					cheat.patches.forEach((replacement, regex) => code = code.replace(regex, replacement));
					cheat.find_vars.forEach(([ label, regex, pos ]) => {
						var match = code.match(regex);
						
						if(match && match[pos])cheat.vars[label] = match[pos];
						else cheat.vars_not_found.push(label);
					});
					
					if(cheat.vars_not_found.length)console.log('%c(shitsploit)\nCould not find: ' + cheat.vars_not_found.join(', '), 'color:#16D');
					
					window[cheat.objects.storage][cheat.randoms.storage] = cheat.storage;
						
					return new Promise((resolve, reject) => resolve(Uint8Array.from([...code].map(char => char.charCodeAt() ^ xor_key))));
				}));
			}
			
			return ret;
		});
	};

(async url => new Promise((resolve, reject) => fetch(url).then(res => res.text()).then(body => {
	var exports = {},
		module = new Proxy({}, {
			get: (obj, prop) => prop == 'exports' ? exports : Reflect.get(obj, prop),
			set: (obj, prop, value) => prop == 'exports' ? exports = value : Reflect.set(obj, prop, value)
		});
	
	new Function('module', 'exports', body)(module, exports);
	
	resolve(exports);
})))('https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js').then(exports => THREE = exports);

module.exports = require => (init(), inject());