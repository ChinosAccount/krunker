'use strict';
var fs = require('fs'),
	path = require('path'),
	cheat = {},
	n = { Function_prototype: Object.defineProperties({}, Object.getOwnPropertyDescriptors(Function.prototype)), Object: Object.defineProperties({}, Object.getOwnPropertyDescriptors(Object)), Reflect: Object.defineProperties({}, Object.getOwnPropertyDescriptors(Reflect)) },
	uhook = (orig_func, handler) => {
		var func = Object.defineProperties(function(...args){ return n.Reflect.apply(handler, this, [orig_func, this, args]) }, Object.getOwnPropertyDescriptors(orig_func));
		
		n.Reflect.defineProperty(func, 'length', { value: orig_func.length, configurable: true, enumerable: false, writable: false });
		n.Reflect.defineProperty(func, 'name', { value: orig_func.name, configurable: true, enumerable: false, writable: false });
		func.toString = n.Reflect.apply(n.Function_prototype.bind, orig_func.toString, [orig_func]);
		func.toString.toString = orig_func.toString.toString;
		
		// function prototype usually undefined or void
		func.prototype = orig_func.prototype;
		
		return func
	},
	init = async () => {
		var electron = require('electron'),
			values = await electron.ipcRenderer.invoke('sync_values').then(JSON.parse),
			config = values.config; // assign it too lazy to rewrite all stuff
		
		electron.ipcRenderer.on('receive_values', (event, data) => {
			values = JSON.parse(data);
			config = values.config;
		});
		
		cheat = {
			event: new (require('events'))(),
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
			materials_esp: new Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = new cheat.three.MeshBasicMaterial({
						transparent: true,
						fog: false,
						depthTest: false,
						color: prop,
					});
					
					return target[prop];
				},
			}),
			key_press: (keycode, keyname, keycode2, keyud) => document.dispatchEvent(new KeyboardEvent(keyud,{altKey:false,bubbles:true,cancelBubble:false,cancelable:true,charCode:0,code:keyname,composed:true,ctrlKey:false,currentTarget:null,defaultPrevented:true,detail:0,eventPhase:0,explicitOriginalTarget:document.body,isComposing:false,isTrusted:true,key:keyname,keyCode:keycode,layerX:0,layerY:0,location:0,metaKey:false,originalTarget:document.body,rangeOffset:0,rangeParent:null,repeat:false,returnValue:false,shiftKey:false,srcElement:document.body,target:document.body,timeStamp:Date.now(),type:keyud,view:parent,which:keycode})),
			log(...args){
				if(values.consts.ss_dev)console.log('%cShitsploit', 'background: #27F; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', ...args);
				else console.log('%cDEBUG', 'background: #F72; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', ...args);
				return true;
			},
			err(...args){
				if(values.consts.ss_dev)console.error('%cShitsploit', 'background: #F22; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', '\n', ...args);
				else console.error('%cDEBUG', 'background: #F62; color: white; border-radius: 3px; padding: 3px 2px; font-weight: 600', '\n', ...args);
				return true;
			},
			wrld2scrn(pos, aY = 0){
				if(!cheat.cas)return { x: 0, y: 0 };
				
				var pos = { ...pos, y: pos.y + aY };
				
				cheat.world.camera.updateMatrix();
				cheat.world.camera.updateMatrixWorld();
				
				pos.project(cheat.world.camera);
				
				return {
					x: (pos.x + 1) / 2 * cheat.cas.width,
					y: (-pos.y + 1) / 2 * cheat.cas.height,
				}
			},
			getD3D(x1, y1, z1, x2, y2, z2){
				var dx = x1 - x2,
					dy = y1 - y2,
					dz = z1 - z2;
				
				return Math.sqrt(dx * dx + dy * dy + dz * dz);
			},
			getDir: (x1, y1, x2, y2) => Math.atan2(y1 - y2, x1 - x2),
			getXDire(x1, y1, z1, x2, y2, z2){
				var h = Math.abs(y1 - y2),
					dst = cheat.getD3D(x1, y1, z1, x2, y2, z2);
				
				return (Math.asin(h / dst) * ((y1 > y2) ? -1 : 1));
			},
			round: (n, r) => Math.round(n * Math.pow(10, r)) / Math.pow(10, r),
			ctr(label, args = []){ // ctx raw
				if(!cheat.ctx)return;
				
				try{ return n.Reflect.apply(CanvasRenderingContext2D.prototype[label], cheat.ctx, args) }catch(err){ cheat.err(err); return {} }
			},
			find_match: async () => {
				if(cheat.finding_match)return;
				cheat.finding_match = true;
				
				var new_match,
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
				
				if(data.error)return cheat.err(data, body, data.error);
				
				new_match = data.games.map(([ match_id, match_region, match_players, match_max_players, gamemode ]) => ({
					id: match_id,
					region: match_region,
					players: match_players,
					max_players: match_max_players,
					gamemode: { name: gamemode.i, game_id: gamemode.v, custom: gamemode.cs }
				}))
				.sort((prev_match, match) => ((match.players >= 6 ? 4 : match.players) / match.max_players) * 100 - ((prev_match.players >= 6 ? 4 : prev_match.players) / prev_match.max_players) * 100)
				.find(match => !match.gamemode.custom && match.region == region && (match.players <= match.max_players - 2 || match.players <= match.max_players - 1));
				
				return new_match ? window.location.href = 'https://krunker.io?game=' +  new_match.id : 'could not find match';
			},
			process_interval: async () => { // run every 1000 ms
				if(!document.querySelector('#instructions'))return;
				
				var intxt = document.querySelector('#instructions').textContent;
				
				if(config.game.auto_respawn){
					if(/(disconnected|game is full|banned|kicked)/gi.test(intxt))cheat.find_match()
					else if(cheat.controls && (!cheat.player || !cheat.player.active) && /click to play/gi.test(intxt))cheat.controls.toggle(true);
				}
				
				document.querySelectorAll('#streamContainer, #aHolder, #endAHolderL, #endAHolderR').forEach(node => node.style.display = 'none');
				
				document.querySelectorAll('.streamItem').forEach(node => node.children[0].src = '');
			},
			find_target: async () => {
				var targets = cheat.game.players.list.filter(ent => !ent[cheat.vars.isYou] && ent.pos2D && ent.canSee && ent.isActive && ent.isEnemy && (config.aim.frustrum_check ? ent.inFrustrum : true));
				
				if(config.aim.target_ais && cheat.game.AI.ais.length){
					var ais = cheat.game.AI.ais.filter(ent => ent.mesh && ent.mesh.visible && ent.health && ent.x);
					
					ais.forEach(ent => {
						if(!ent[cheat.symbols.added_data])Object.defineProperties(ent, {
							[cheat.symbols.added_data]: { get: _ => true },
							pos: { get: _ => ({
								distanceTo(p2){return Math.hypot(this.x - p2.x, this.y - p2.y, this.z - p2.z)},
								x: ent.x || 0,
								y: ent.y || 0,
								z: ent.z || 0,
								project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)},
								applyMatrix4: function(t){var e=this.x,n=this.y,r=this.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,this},
							})},
							isActive: { get: _ => ent.mesh && ent.mesh.visible && ent.health && ent.x },
							pos2D: { get: _ => ent.x != null ? cheat.wrld2scrn(ent.pos) : { x: 0, y: 0, z: 0 } },
							canSee: { get: _ => ent.isActive && cheat.game[cheat.vars.canSee](cheat.player, ent.x, ent.y, ent.z) == null ? true : false },
							inFrustrum: { get: _ => ent.isActive && cheat.world.frustum.containsPoint(ent.pos) },
							[cheat.symbols.isAI]: { get: _ => true },
							[cheat.vars.crouchVal]: { get: _ => 1 },
							weapon: { get: _ => ({ name: 'ghost powers' }) },
							objInstances: { get: _ => ent.mesh },
							isEnemy: { get: _ => true },
							isRisk: { get: _ => false },
							alias: { get: _ => ent.name },
							height: { get: _ => ent.dat.mSize },
						});
					});
					
					targets = targets.concat(ais.filter(ent => ent.pos2D && ent.canSee && (config.aim.frustrum_check ? ent.inFrustrum : true)));
				}
				
				if(targets)switch(config.aim.target_sorting){
					case'dist3d':
						cheat.target = targets.sort((ent_1, ent_2) => ent_1.pos.distanceTo(ent_2) * (ent_1.inFrustrum == ent_2.inFrustrum ? 1 : 0.5) )[0];
						break
					case'hp':
						cheat.target = targets.sort((ent_1, ent_2) => (ent_1.pos2D.health - ent_2.pos2D.health) * (ent_1.inFrustrum == ent_2.inFrustrum ? 1 : 0.5) )[0];
						break
					case'dist2d':
					default:
						cheat.target = targets.sort((ent_1, ent_2) => (cheat.center_vec.distanceTo(ent_1.pos2D) - cheat.center_vec.distanceTo(ent_2.pos2D)) * (ent_1.inFrustrum == ent_2.inFrustrum ? 1 : 0.5) )[0];
						break
				}
			},
			procInputs(data){
				if(!cheat.controls || !cheat.player)return;
				
				var keys = {frame: 0, delta: 1, ydir: 2, xdir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, crouch: 8, reload: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12},
					move_dirs = { idle: -1, forward: 1, back: 5, left: 7, right: 3 };
				
				// skid bhop
				if(config.game.bhop != 'off' && (cheat.inputs.Space || config.game.bhop == 'autojump' || config.game.bhop == 'autoslide')){
					cheat.controls.keys[cheat.controls.binds.jumpKey.val] ^= 1;
					if(cheat.controls.keys[cheat.controls.binds.jumpKey.val])cheat.controls.didPressed[cheat.controls.binds.jumpKey.val] = 1;
					
					if((document.activeElement.nodeName != 'INPUT' && config.game.bhop == 'keyslide' && cheat.inputs.Space || config.game.bhop == 'autoslide') && cheat.player[cheat.vars.yVel] < -0.02 && cheat.player.canSlide){
						setTimeout(() => cheat.controls.keys[cheat.controls.binds.crouchKey.val] = 0, 325);
						cheat.controls.keys[cheat.controls.binds.crouchKey.val] = 1;
					}
				}
				
				// auto reload, currentAmmo set earlier
				if(cheat.player && !cheat.player[cheat.vars.ammos][cheat.player[cheat.vars.weaponIndex]] && config.aim.auto_reload)data[keys.reload] = 1;
				
				cheat.game.config.inc_deltaMlt = 0;
				
				cheat.find_target();
				
				// aiming
				if(cheat.target && !cheat.player[cheat.vars.reloadTimer]){
					var yVal = cheat.target.y
							+ (cheat.target[cheat.symbols.isAI] ? -(cheat.target.dat.mSize / 2) : (cheat.target.jumpBobY * cheat.gconfig.jumpVel) + 1 - cheat.target[cheat.vars.crouchVal] * 3),
						yDire = cheat.getDir(cheat.player.z, cheat.player.x, cheat.target.z, cheat.target.x),
						xDire = cheat.getXDire(cheat.player.x, cheat.player.y, cheat.player.z, cheat.target.x, yVal, cheat.target.z),
						xv = xDire - cheat.player[cheat.vars.recoilAnimY] * 0.27,
						rot = {
							x: cheat.round(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, xv )) % (Math.PI * 2), 3),
							y: cheat.round(yDire % (Math.PI * 2), 3),
						};
					
					cheat.game.config.inc_deltaMlt += 0.2;
					
					if(!rot.x)rot.x = 0;
					if(!rot.y)rot.y = 0;
					
					// if fully aimed or weapon cant even be aimed or weapon is melee and nearby, shoot
					if((config.aim.status == 'silent' || config.aim.status == 'full') && (!cheat.player[cheat.vars.aimVal] || cheat.player.weapon.noAim || (cheat.player.weapon.melee && cheat.player.pos.distanceTo(cheat.target.pos) <= 18)))cheat.player[cheat.vars.ammos][cheat.player[cheat.vars.weaponIndex]] ? data[keys.shoot] = 1 : data[keys.reload] = 1;
					
					var set_rot = rot => { switch(config.aim.status){
						case'silent':
							// dont shoot if weapon is on shoot cooldown
							if(cheat.player.weapon.nAuto && cheat.player[cheat.vars.didShoot])data[keys.shoot] = data[keys.scope] = 0;
							else data[keys.scope] = 1;
							
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
							if(cheat.player.weapon.nAuto && cheat.player[cheat.vars.didShoot])data[keys.scope] = data[keys.shoot] = 0;
							else data[keys.scope] = 1;
							
							if(data[keys.shoot] || cheat.player.weapon.melee){
								cheat.controls[cheat.vars.pchObjc].rotation.x = rot.x
								cheat.controls.object.rotation.y = rot.y
								data[keys.xdir] = rot.x * 1000
								data[keys.ydir] = rot.y * 1000
							}
							
							break
					} };
		
					// create new tween if previous tween wasnt playing or there wasn't previous tween
					if(config.aim.smooth && (!cheat.tt || !cheat.tt._isPlaying))cheat.tt = new TWEEN.Tween({
						x: data[keys.xdir] / 1000,
						y: data[keys.ydir] / 1000,
					}).onUpdate(set_rot).easing(TWEEN.Easing.Quadratic.Out);
					/*else if(cheat.tt)cheat.tt._valuesStart = {
						x: data[keys.xdir] / 1000,
						y: data[keys.ydir] / 1000,
					};*/
					
					if(config.aim.smooth){
						cheat.tt.to({ x: rot.x, y: rot.y }, 60);
						
						if(!cheat.tt._isPlaying)cheat.tt.start();
					}else set_rot({ x: rot.x, y: rot.y });
				}
			},
			process(){ try{
				cheat.event.player = cheat.player;
				
				if(!cheat.game)return;
				
				if(!cheat.game.config.deltaMlt_hooked){
					cheat.game.config.deltaMlt_hooked = 1;
					
					setTimeout(() => {
						var orig_delta = cheat.game.config.deltaMlt || 1;
						Object.defineProperty(cheat.game.config, 'deltaMlt', {
							get: _ => orig_delta + (cheat.game.config.inc_deltaMlt ? cheat.game.config.inc_deltaMlt : 0),
							set: n => orig_delta = n,
						});
					}, 1000);
				}
				
				cheat.controls[cheat.vars.pchObjc].rotation.x -= cheat.inputs.ArrowDown ? 0.006 : 0;
				cheat.controls[cheat.vars.pchObjc].rotation.x += cheat.inputs.ArrowUp ? 0.006 : 0;
				
				cheat.controls.object.rotation.y -= cheat.inputs.ArrowRight ? 0.00675 : 0;
				cheat.controls.object.rotation.y += cheat.inputs.ArrowLeft ? 0.00675 : 0;
				
				cheat.controls.idleTimer = 0;
				
				cheat.game.config.thirdPerson = config.game.thirdperson ? true : false;
				
				if(!cheat.controls || !cheat.world || !cheat.player)return;
				
				cheat.game.players.list.forEach(ent => {
					if(!ent[cheat.symbols.added_data])Object.defineProperties(ent, {
						[cheat.symbols.added_data]: { get: _ => true },
						pos: { get: _ => ({
							distanceTo(p2){return Math.hypot(this.x - p2.x, this.y - p2.y, this.z - p2.z)},
							x: ent.x || 0,
							y: ent.y || 0,
							z: ent.z || 0,
							project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)},
							applyMatrix4: function(t){var e=this.x,n=this.y,r=this.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,this},
						})},
						pos2D: { get: _ => ent.x != null ? cheat.wrld2scrn(ent.pos) : { x: 0, y: 0, z: 0 } },
						canSee: { get: _ => ent.isActive && cheat.game[cheat.vars.canSee](cheat.player, ent.x, ent.y, ent.z) == null ? true : false },
						inFrustrum: { get: _ => ent.isActive && cheat.world.frustum.containsPoint(ent.pos) },
					});
					
					ent.isActive = ent.x != null && cheat.ctx && ent.objInstances && ent.health > 0;
					ent.isEnemy = !ent.team || ent.team != cheat.player.team;
					ent.isRisk = ent.isDev || ent.isMod || ent.isMapMod || ent.canGlobalKick || ent.canViewReports || ent.partnerApp || ent.canVerify || ent.canTeleport || ent.isKPDMode || ent.level >= 30;
					ent.objInstances = ent[cheat.vars.objInstances];
					
					if(!ent.isActive)return;
					
					// we are at fastest tick so we can do this
					if(ent.objInstances)ent.objInstances.visible = true;
					ent[cheat.vars.inView] = cheat.hide_nametags ? false : config.esp.nametags ? true : ent[cheat.vars.inView];
					
					if(ent.weapon && !ent.weapon[cheat.symbols.org_zoom])ent.weapon[cheat.symbols.org_zoom] = ent.weapon.zoom;
					
					if(ent.weapon && !ent.weapon[cheat.symbols.zoom])ent.weapon[cheat.symbols.zoom] = n.Reflect.defineProperty(ent.weapon, 'zoom', {
						get: _ => config.game.no_zoom ? 1 : ent.weapon[cheat.symbols.org_zoom],
						set: n => ent.weapon._zoom = n,
					});
				});
				
				cheat.event.emit('process');
			}catch(err){ cheat.err('CAUGHT:', err) }},
			render(){ try{ // rendering tasks
				if(cheat.player){
					if(cheat.player.prev_health == null)cheat.player.prev_health = 0;
					
					if(cheat.player.prev_health != cheat.player[cheat.vars.maxHealth] && cheat.player.health == cheat.player[cheat.vars.maxHealth]){
						cheat.event.emit('client-spawn', cheat.player);
					}else if(cheat.player.prev_health && !cheat.player.health){
						cheat.event.emit('client-died');
					}
					
					cheat.player.prev_health = cheat.player.health;
				}
				
				if(!cheat.cas || !cheat.ctx){
					cheat.cas = document.querySelector('#game-overlay');
					cheat.ctx = cheat.cas ? cheat.cas.getContext('2d', { alpha: true }) : {};
					
					cheat.event.canvas = cheat.canvas;
					cheat.event.ctx = cheat.ctx;
					
					cheat.center_vec = {
						x: window.innerWidth / 2,
						y: window.outerHeight / 2,
						distanceTo(p2){return Math.hypot(this.x - p2.x, this.y - p2.y)}
					}
				}
				
				cheat.ctr('resetTransform');
				
				// draw overlay stuff
				if(config.game.overlay && cheat.game && cheat.ctx){
					cheat.ctx.strokeStyle = '#000'
					cheat.ctx.font = 'Bold 14px Inconsolata, monospace';
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
				
				(config.aim.target_ais ? cheat.game.players.list.concat(cheat.game.AI.ais) : cheat.game.players.list).filter(ent => ent.isActive && ent.inFrustrum && !ent[cheat.vars.isYou]).forEach(ent => {
					var src_pos = cheat.wrld2scrn(ent.pos),
						src_pos_crouch = cheat.wrld2scrn(ent.pos, ent.height - ent[cheat.vars.crouchVal] * 3),
						esp_width = ~~((src_pos.y - cheat.wrld2scrn(ent.pos, ent.height).y) * 0.7),
						esp_height = src_pos.y - src_pos_crouch.y,
						esp_box_y = src_pos.y - esp_height,
						// teammate = green, enemy = red, risk + enemy = orange
						cham_color = ent.isEnemy ? ent.isRisk ? '#F70' : '#F00' : '#0F0',
						cham_color_full = parseInt(cham_color.substr(1).split('').map(e => e+e).join(''), 16), // turn #FFF into #FFFFFF
						chams_enabled = config.esp.status == 'chams' || config.esp.status == 'box_chams' || config.esp.status == 'full';
					
					if(ent.objInstances)ent.objInstances.traverse(obj => {
						if(obj.type != 'Mesh')return;
						
						obj.material.wireframe = !!config.game.wireframe;
						
						if(ent[cheat.vars.isYou])return;
						
						if(chams_enabled && obj.material.type != 'MeshBasicMaterial'){ // set material
							if(!obj.orig_mat)obj.orig_mat = Object.assign(Object.create(Object.getPrototypeOf(obj.material)), obj.material);
							
							obj.material = cheat.materials_esp[cham_color];
						// update color
						}else if(chams_enabled && obj.material.type == 'MeshBasicMaterial')obj.material.color.setHex(cham_color_full)
						// remove material
						else if(!chams_enabled && obj.orig_mat && obj.material.type == 'MeshBasicMaterial')obj.material = obj.orig_mat
					});
					
					// box ESP
					if(config.esp.status == 'box' || config.esp.status == 'box_chams' || config.esp.status == 'full'){
						cheat.ctx.strokeStyle = cham_color
						cheat.ctx.lineWidth = 1.5;
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
							font_size = 11 - (player_dist * 0.005);
						
						cheat.ctx.textAlign = 'middle';
						cheat.ctx.font = 'Bold ' + font_size + 'px Tahoma';
						cheat.ctx.strokeStyle = '#000';
						cheat.ctx.lineWidth = 2.5;
						
						[
							[['#FB8', ent.alias], ent.clan ? ['#FFF', ' [' + ent.clan + ']'] : null],
								[[hp_color, ent.health + '/' + ent[cheat.vars.maxHealth] + ' HP']],
							// player weapon & ammo
							[['#FFF', ent.weapon.name ],
								['#BBB', '['],
								['#FFF', (ent.weapon.ammo || 'N') + '/' + (ent.weapon.ammo || 'A') ],
								['#BBB', ']']],
							[['#BBB', 'Risk: '], [(ent.isRisk ? '#0F0' : '#F00'), ent.isRisk]],
							[['#BBB', 'Shootable: '], [(ent.canSee ? '#0F0' : '#F00'), ent.canSee]],
							[['#BBB', '['], ['#FFF', ~~(player_dist / 10) + 'm'], ['#BBB', ']']],
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
						cheat.ctx.strokeStyle = cham_color;
						cheat.ctx.lineWidth = 1.75;
						cheat.ctx.lineCap = 'round';
						
						cheat.ctr('beginPath');
						cheat.ctr('moveTo', [cheat.cas.width / 2, cheat.cas.height]);
						cheat.ctr('lineTo', [src_pos.x, src_pos.y - esp_height / 2]);
						cheat.ctr('stroke');
					}
				});
			}catch(err){ cheat.err(err) }},
			wf: (check, timeout = 5000) => new Promise((resolve, reject) => {
				var interval = setInterval(() => {
					var checke = check();
					
					if(checke)clearInterval(interval); else return;
					
					resolve(checke);
					interval = null;
				}, 15);
				
				setTimeout(() => {
					if(interval)return clearInterval(interval), reject('timeout');
				}, timeout);
			}),
			find_vars: [
				['isYou', /this\['accid'\]=0x0,this\['(\w+)'\]=\w+,this\['isPlayer'\]/, 1],
				['objInstances', /continue;if\(\S+\['\S+']\|\|!U\['(\S+)']\)continue;if\(!\S+\['(\S+)']\)continue/, 1],
				['inView', /continue;if\(\S+\['\S+']\|\|!\S+\['(\S+)']\)continue;if\(!\S+\['(\S+)']\)continue/, 2],
				['pchObjc', /0x0,this\['(\w+)']=new \w+\['Object3D']\(\),this/, 1],
				['aimVal', /this\['(\w+)']-=0x1\/\(this\['weapon']\['aimSpd']/, 1],
				['crouchVal', /this\['(\w+)']\+=\w\['crouchSpd']\*\w+,0x1<=this\['\w+']/, 1],
				['canSee', /\w+\['(\w+)']\(\w+,\w+\['x'],\w+\['y'],\w+\['z']\)\)&&/, 1],
				['didShoot', /--,\w+\['(\w+)']=!0x0/, 1],
				['ammos', /\['length'];for\(\w+=0x0;\w+<\w+\['(\w+)']\['length']/, 1],
				['weaponIndex', /\['weaponConfig']\[\w+]\['secondary']&&\(\w+\['(\w+)']==\w+/, 1],
				['maxHealth', /\['regenDelay'],this\['(\w+)']=\w+\['mode'\]&&\w+\['mode']\['\1']/, 1],
				['yVel', /this\['y']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedY']/, 1],
				['reloadTimer', /this\['(\w+)']-=\w+,\w+\['reloadUIAnim']/, 1],
				['mouseDownR', /this\['(\w+)']=0x0,this\['keys']=/, 1], 
				['recoilAnimY', /this\['(\w+)']=0x0,this\['recoilForce'\]=0x0/, 1],
				['noclip', /Noclip\\x20-\\x20'\+\(\w+\['(\w+)']\?'Enabled/, 1],
				/*
				['nAuto', /!this\['doingInter']\){var \w+=this\['\w+']\|\|!this\['weapon']\['(\w+)']&&a0\[0x5];/, 1],
				['xVel', /this\['x']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedX']/, 1],
				['zVel', /this\['z']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedZ']/, 1],*/
				['xDire', /this\['(\w+)']=\w+\['round']\(0x3\),this\['(\w+)']=\w+\['round']/, 1],
				['yDire', /this\['(\w+)']=\w+\['round']\(0x3\),this\['(\w+)']=\w+\['round']/, 2],
				
			],
			patches: new Map([
				// wallbangs
				[/\['noShoot']&&(\w+)\['active']&&\(!\1\['transparent']\|\|(\w+)\)/, '.noShoot && $1.active && ($1.transparent || $2 || (!ssd.target.isAI && ssd.config.aim.wallbangs && ssd.player && ssd.player.weapon) ? (!$1.penetrable || !ssd.player.weapon.pierce) : true)'],
				// get vars
				[/(this\['moveObj']=func)/, 'ssd.game = this, $1'],
				[/(this\['backgroundScene']=)/, 'ssd.world = this, $1'],
				[/(this\['\w+']=function\(\w+,\w+,\w+,\w+\){)(this\['recon'])/, '$1 { ssd.procInputs(...arguments) }; $2'],
				
				// have a proper interval for rendering
				[/requestAnimFrame\(/g, 'ssd.frame(requestAnimFrame, '],
				[/requestAnimFrameF\(/g, 'ssd.frame(requestAnimFrameF, '],
				
				[/function \w+\(\w+\){if\(\w+\[\w+]\)return \w+\[\w+]\['exp/, 'ssd.__webpack_require__ = c; $&'],
				
				[/^/, 'ssd.info("injected"), '],
				
				[/(\w+)\['skins'](?!=)/g, 'ssd.skin($1)'],
				
				[/aHolder\['style']\['display']/, 'aHolder.style.piss'],
			]),
			storage: {
				skins: [...new Uint8Array(5e3)].map((a, i) => ({ ind: i, cnt: 100 })),
				get config(){ return config },
				get player(){ return cheat.player || { weapon: {} } },
				get target(){ return cheat.target || {} },
				set THREE(nv){
					cheat.three = nv;
				},
				set __webpack_require__(nv){
					cheat.__webpack_require__ = nv;
					
					cheat.wf(() => cheat.__webpack_require__.c).then(exports => Object.entries({
						three: ['Box3', 'Vector3', 'Line3'],
						util: ['getAnglesSSS', 'hexToRGB', 'keyboardMap'],
						gconfig: [ 'isNode', 'isComp', 'isProd', 'kickTimer'],
						ws: ['ahNum', 'connected', 'socketId', 'sendQueue', 'trackPacketStats'],
						overlay: ['render', 'canvas'],
						colors: ['challLvl', 'getChallCol', 'premium', 'partner'],
						ui: ['loading', 'menu2'],
						shop: ['purchases', 'wheels', 'events', 'freeKR'],
					}).forEach(([ label, entries ]) => Object.values(exports).filter(mod => mod && mod.exports).map(mod => mod.exports).forEach(exp => (entries.some(entry => n.Reflect.apply(Object.prototype.hasOwnProperty, exp, [ entry ])) && (cheat[label] = exp)))));
				},
				set game(nv){
					cheat.game = nv;
				},
				set world(nv){
					cheat.world = nv;
				},
				skin(player){
					return config.game.skins ? cheat.storage.skins : player.skins;
				},
				frame(frame, func){
					cheat.player = cheat.game ? cheat.game.players.list.find(player => player[cheat.vars.isYou]) : null;
					cheat.controls = cheat.game ? cheat.game.controls : null;
					
					if(cheat.world)cheat.world.scene.onBeforeRender = cheat.process;
					cheat.render();
					
					cheat.event.emit('render');
					
					if(cheat.ws && !cheat.ws[cheat.symbols.hooked]){
						cheat.ws[cheat.symbols.hooked] = true;
						
						cheat.ws.send = uhook(cheat.ws.send, (target, thisArg, [label, ...data]) => {
							switch(label){
								case'ent':
			 						cheat.skin_conf = {
										main: data[2][0],
										secondary: data[2][1],
										hat: data[3],
										body: data[4],
										knife: data[9],
										dye: data[14],
										waist: data[17],
									};
									break
							}
							
							
							return n.Reflect.apply(target, thisArg, [label, ...data]);
						});
						
						cheat.ws._dispatchEvent = uhook(cheat.ws._dispatchEvent, (target, thisArg, argArray) => {
							if(argArray[0] == 0 && cheat.skin_conf){
								// sending server player data
								var player_size = 38,
									pd = argArray[1][0];
								
								while(pd.length % player_size != 0)player_size++;
								
								for(var i = 0; i < pd.length; i += player_size)if(pd[i] === cheat.ws.socketId){
									pd[i + 12] = [cheat.skin_conf.main, cheat.skin_conf.secondary];
									pd[i + 13] = cheat.skin_conf.hat;
									pd[i + 14] = cheat.skin_conf.body;
									pd[i + 19] = cheat.skin_conf.knife;
									pd[i + 25] = cheat.skin_conf.dye;
									pd[i + 33] = cheat.skin_conf.waist;
								}
							}
							
							return n.Reflect.apply(target, thisArg, argArray);
						});
					}	
					
					try{
						return n.Reflect.apply(frame, window, [(...args) => {
							try{
								return n.Reflect.apply(func, window, args);
							}catch(err){
								cheat.err(err);
								return true;
							}
						}]);
					}catch(err){
						cheat.err(err);
						return 1;
					}
				},
				get log(){ return cheat.log },
				get err(){ return cheat.err },
				info(data){
					switch(data){
						case'injected':
							
							cheat.wf(() => cheat.game).then(game => {
								cheat.event.game = game;
								cheat.event.players = cheat.game.players.list;
								cheat.event.emit('game-load', game)
							});
							
							cheat.log('injected to game');
							
							cheat.log('hiding: ' + cheat.objects.storage + '.' + cheat.randoms.storage, window[cheat.objects.storage][cheat.randoms.storage]);
							window[cheat.objects.storage][cheat.randoms.storage] = void 0;
							
							break
					}
				},
			},
			inputs: [],
		};
		
		// pass storage object to game
		cheat.patches.set(/^/, '(ssd => { return ');
		cheat.patches.set(/$/g, '})(' + cheat.objects.storage + '.' + cheat.randoms.storage + '())');
		
		setInterval(cheat.process_interval, 1000);
		
		cheat.storage.procInputs = cheat.procInputs;
		
		electron.ipcRenderer.on('esc', () => {
			document.exitPointerLock();
			
			cheat.key_press(18, 'Alt', 'AltLeft', 'keydown');
			cheat.key_press(18, 'Alt', 'AltLeft', 'keyup');
		});
		
		window.prompt = text => electron.ipcRenderer.sendSync('prompt', { type: 'text', data: text });
		
		window.addEventListener('keydown', event => (document.activeElement ? document.activeElement.nodeName != 'INPUT' : true) && (cheat.inputs[event.code] = true, electron.ipcRenderer.send('keydown', jstr({ ...super_serialize(event, KeyboardEvent), origin: 'game' }))));
		window.addEventListener('keyup', event => (document.activeElement ? document.activeElement.nodeName != 'INPUT' : true) && (cheat.inputs[event.code] = false, electron.ipcRenderer.send('keyup', jstr({ ...super_serialize(event, KeyboardEvent), origin: 'game' }))));
		
		// clear all inputs when window is not focused
		window.addEventListener('blur', () => cheat.inputs = []);
		
		// remove later
		window.cheese = cheat;
		
		// dont pass the fucking object again
		cheat.event.vars = {...cheat.vars};
		
		cheat.event.load_css_url = new Proxy(()=>{}, { apply(a,b, [ url = '' ]){
			try{ var url = new URL(url) }catch(err){ return 'invalid URL' };
			
			var css_tag = document.head.appendChild(document.createElement('link')),
				css_url = window.URL.createObjectURL(new window.Blob([ '@import url("' + url.href + '");' ], { type: 'text/css' }));
			
			css_tag.href = css_url;
			css_tag.rel = 'stylesheet';	
			css_tag.addEventListener('load', () => window.URL.revokeObjectURL(css_url));
			
			return true;
		}});
		
		cheat.event.load_css_raw = new Proxy(()=>{}, { apply(a,b, [ content = '' ]){
			var css_tag = document.head.appendChild(document.createElement('link')),
				css_url = window.URL.createObjectURL(new window.Blob([ content ], { type: 'text/css' }));
			
			css_tag.href = css_url;
			css_tag.rel = 'stylesheet';	
			css_tag.addEventListener('load', () => window.URL.revokeObjectURL(css_url));
			
			return true;
		}});
		
		cheat.wf(() => document && document.head).then(() => { try{
			// load cheat font
			new window.FontFace('Inconsolata', 'url("https://fonts.gstatic.com/s/inconsolata/v20/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp4U8WR32lw.woff2")', {
				family: 'Inconsolata',
				style: 'normal',
				weight: 400,
				stretch: '100%',
				unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
			}).load().then(font => document.fonts.add(font));
			
			cheat.wf(() => document.querySelector('#subLogoButtons')).then(() => {
				// add button
				document.querySelectorAll('.menuItemIcon').forEach(el => el.style.height = '60px');
				document.querySelectorAll('.downloadClient, #merchImg').forEach(node => node.remove());
				
				var button = document.querySelector('#subLogoButtons').appendChild(document.createElement('div'));
				button.setAttribute('class', 'button small buttonB');
				button.addEventListener('mouseenter', window.playTick);
				button.addEventListener('click', () => window.location.href = 'https://krunker.io');
				button.innerHTML = 'Find game';
			}, 7500);
			
			var clean_func = func => new Proxy(()=>{}, { apply: (bad_func, ...args) => n.Reflect.apply(func, ...args) }),
				sanitize = str => [...str].map(char => '&#' + char.charCodeAt() + ';').join(''),
				util = require('util'),
				log_func = (...args) => electron.ipcRenderer.send('add_log', {
					log: sanitize(util.format(...args)),
					color: '#FFF',
				}),
				err_func = (...args) => electron.ipcRenderer.send('add_log', {
					log: sanitize(util.format(...args)),
					color: '#F33',
				}),
				sploit_safe = new Proxy({}, {
					get: (obj, prop) => { try{
						if(Object.getOwnPropertyNames(Object.prototype).some(blocked => prop == blocked))return void'';
						var ret = n.Reflect.get(cheat.event, prop),
							ret1 = ret;
						
						if(ret && ret.constructor == Function)ret = new Proxy(()=>{}, { apply: (target, thisArg, argArray) => n.Reflect.apply(ret1, thisArg, argArray) });
						
						return ret;
					}catch(err){ err_func(err) }},
					set: (obj, prop, value) => n.Reflect.set(cheat.event, prop, value),
				});
			
			// load js
			fs.readdirSync(values.folders.js).filter(file_name => path.extname(file_name).match(/\.js$/i)).map(file_name => fs.readFileSync(path.join(values.folders.js, file_name), 'utf8')).forEach(data => { try{
				n.Reflect.apply(n.Reflect.construct(window.Function, ['unsafeWindow', 'sploit', 'console', data]), window, [
					window,
					sploit_safe, 
					{ log: clean_func(log_func), error: clean_func(err_func) },
				]);
			}catch(err){ err_func(err) }});
			
			// load css 
			var css_tag = document.head.appendChild(document.createElement('link')),
				css_url = window.URL.createObjectURL(new window.Blob([ fs.readdirSync(values.folders.css).filter(file_name => path.extname(file_name).match(/\.css$/i)).map(file_name => window.URL.createObjectURL(new Blob([ fs.readFileSync(path.join(values.folders.css, file_name), 'utf8') ], { type: 'text/css' }))).map(blob => '@import url("' + blob + '");').join('') ], { type: 'text/css' }));
			
			css_tag.href = css_url;
			css_tag.rel = 'stylesheet';	
			css_tag.addEventListener('load', () => window.URL.revokeObjectURL(css_url));
		}catch(err){ console.trace(err) } });
	},
	jstr = JSON.stringify,
	super_serialize = (ob, proto) => Object.fromEntries(Object.keys(proto.prototype).map(key => [key, ob[key]])),
	inject = () => {
		window.HTMLBodyElement.prototype.appendChild = uhook(window.HTMLBodyElement.prototype.appendChild, (target, thisArg, [node]) => {
			var ret = n.Reflect.apply(target, thisArg, [node]);
			
			if(node.nodeName == 'IFRAME' && node.style.display == 'none'){
				node.contentWindow.WebAssembly = window.WebAssembly;
				node.contentWindow.Response.prototype.arrayBuffer = uhook(node.contentWindow.Response.prototype.arrayBuffer, (target_buf, thisArg, argArray) => n.Reflect.apply(target_buf, thisArg, argArray).then(ret => {
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
					
					if(cheat.vars_not_found.length)cheat.err('Could not find: ' + cheat.vars_not_found.join(', '));
					
					window[cheat.objects.storage][cheat.randoms.storage] = uhook(window[cheat.objects.storage], () => cheat.storage);
					
					return new Promise((resolve, reject) => resolve(Uint8Array.from([...code].map(char => char.charCodeAt() ^ xor_key))));
				}));
			}
			
			return ret;
		});
	};

init();
inject();