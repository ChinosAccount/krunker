(() => {

var n = Object.assign(document.documentElement.appendChild(document.createElement('iframe')), {
		style: 'display:none',
	}).contentWindow,
	add = Symbol(),
	add_ele = (node_name, parent, attributes) => Object.assign(parent.appendChild(document.createElement(node_name)), attributes),
	values = {
		version: '1.0.5',
		useragent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36 Edg/86.0.622.69',
		ui_visible: true,
		oconfig: {
			esp: {
				status: 'off',
				nametags: false,
				tracers: false,
				health_bar: false,
				wall_opacity: 0.6,
				walls: false,
				minimap: false,
			}, game: {
				bhop: 'off',
				pitch_mod: 'off',
				autoreload: false,
				overlay: false,
				wireframe: false,
				auto_respawn: false,
				skins: false,
			}, aim: {
				status: 'off',
				target: 'head',
				target_sorting: 'dist2d',
				frustrum_check: false,
				auto_reload: false,
				wallbangs: false,
				triggerbot: false,
				smooth: false,
				smoothn: 25,
			}, client: {
				unlimited_fps: true,
				adblock: true,
			}, kb: { // keybinds
				aim: 3,
				bhop: 4,
				esp: 5,
				tracers: 6,
				nametags: 7,
				overlay: 8,
				disable_settings: 9,
			},
		},
		consts: {
			ss_dev: true,
		},
	},
	cheat = {},
	config = {},
	uhook = (orig_func, handler) => {
		var func = n.Object.defineProperties(function(...args){ return n.Reflect.apply(handler, this, [orig_func, this, args]) }, n.Object.getOwnPropertyDescriptors(orig_func));
		
		n.Reflect.defineProperty(func, 'length', { value: orig_func.length, configurable: true, enumerable: false, writable: false });
		n.Reflect.defineProperty(func, 'name', { value: orig_func.name, configurable: true, enumerable: false, writable: false });
		func.toString = n.Reflect.apply(n.Function.prototype.bind, orig_func.toString, [orig_func]);
		func.toString.toString = orig_func.toString.toString;
		
		// function prototype usually undefined or void
		func.prototype = orig_func.prototype;
		
		return func
	},
	init = () => {
		cheat = {
			keybinds: [],
			wf: (check, timeout = 5000) => new Promise((resolve, reject) => {
				var interval = setInterval(() => {
					var checked = check();
					
					if(checked)clearInterval(interval); else return;
					
					resolve(checked);
					interval = null;
				}, 15);
				
				setTimeout(() => {
					if(interval)return clearInterval(interval), reject('timeout');
				}, timeout);
			}),
			syms: new n.Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = Symbol();
					
					return target[prop];
				}
			}),
			rnds: new n.Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = [...Array(16)].map(() => Math.random().toString(36)[2]).join('').replace(/(\d|\s)/, 'V').toLowerCase().substr(0, 6);
					
					return target[prop];
				}
			}),
			objs: new n.Proxy({}, {
				get(target, prop){
					if(!target[prop])target[prop] = cheat.object_list[~~(Math.random() * cheat.object_list.length)];
					
					return target[prop];
				}
			}),
			object_list: n.Object.keys(window).filter(label => window[label] && typeof window[label] == 'function' && String(window[label]) == 'function ' + label + '() { [native code] }'),
			vars_not_found: [],
			vars: {},
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
				
				var pos = Object.assign({}, pos, { y: pos.y + aY });
				
				cheat.world.camera.updateMatrix();
				cheat.world.camera.updateMatrixWorld();
				
				pos.project(cheat.world.camera);
				
				return {
					x: (pos.x + 1) / 2 * cheat.cas.width,
					y: (-pos.y + 1) / 2 * cheat.cas.height,
				}
			},
			util: {
				canSee(player, target, offset = 0){
					if(!player)return false;
					
					var d3d = cheat.util.getD3D(player.x, player.y, player.z, target.x, target.y, target.z),
						dir = cheat.util.getDir(player.z, player.x, target.z, target.x),
						dist_dir = cheat.util.getDir(cheat.util.getDistance(player.x, player.z, target.x, target.z), target.y, 0, player.y),
						ad = 1 / (d3d * Math.sin(dir - Math.PI) * Math.cos(dist_dir)),
						ae = 1 / (d3d * Math.cos(dir - Math.PI) * Math.cos(dist_dir)),
						af = 1 / (d3d * Math.sin(dist_dir)),
						height = player.y + (player.height || 0) - 1.15; // 1.15 = config.cameraHeight
					
					// iterate through game objects
					for(var ind in cheat.game.map.manager.objects){
						var obj = cheat.game.map.manager.objects[ind];
						
						if(
							!obj.noShoot &&
							obj.active &&
							(!obj.transparent || obj.penetrable && cheat.player.weapon.pierce)
						){
							var in_rect = cheat.util.lineInRect(player.x, player.z, height, ad, ae, af, obj.x - Math.max(0, obj.width - offset), obj.z - Math.max(0, obj.length - offset), obj.y - Math.max(0, obj.height - offset), obj.x + Math.max(0, obj.width - offset), obj.z + Math.max(0, obj.length - offset), obj.y + Math.max(0, obj.height - offset));
							
							if(in_rect && 1 > in_rect)return in_rect;
						}
					}
					
					// iterate through game terrain
					if(cheat.game.map.terrain){
						var al = cheat.game.map.terrain.raycast(player.x, -player.z, height, 1 / ad, -1 / ae, 1 / af);
						if(al)return cheat.util.getD3D(player.x, player.y, player.z, al.x, al.z, -al.y);
					}
					return null;
				},
				getDistance(x1, y1, x2, y2){
					return Math.sqrt((x2 -= x1) * x2 + (y2 -= y1) * y2);
				},
				getD3D(x1, y1, z1, x2, y2, z2){
					var dx = x1 - x2,
						dy = y1 - y2,
						dz = z1 - z2;
					
					return Math.sqrt(dx * dx + dy * dy + dz * dz);
				},
				getXDire: (x1, y1, z1, x2, y2, z2) => Math.asin(Math.abs(y1 - y2) / cheat.util.getD3D(x1, y1, z1, x2, y2, z2)) * ((y1 > y2) ? -1 : 1),
				getDir: (x1, y1, x2, y2) => Math.atan2(y1 - y2, x1 - x2),
				lineInRect(lx1, lz1, ly1, dx, dz, dy, x1, z1, y1, x2, z2, y2){
					var t1 = (x1 - lx1) * dx,
						t2 = (x2 - lx1) * dx,
						t3 = (y1 - ly1) * dy,
						t4 = (y2 - ly1) * dy,
						t5 = (z1 - lz1) * dz,
						t6 = (z2 - lz1) * dz,
						tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6)),
						tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));
					
					return (tmax < 0 || tmin > tmax) ? false : tmin;
				},
			},
			round: (n, r) => Math.round(n * Math.pow(10, r)) / Math.pow(10, r),
			ctr(label, args = []){ // ctx raw
				if(!cheat.ctx)return;
				
				try{ return n.Reflect.apply(n.CanvasRenderingContext2D.prototype[label], cheat.ctx, args) }catch(err){ cheat.err(err); return {} }
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
					})[('' + window.location.search).match(/\?game=(\w+)/)[1]],
					data = await fetch('https://matchmaker.krunker.io/game-list?hostname=' + window.location.host, { headers: { 'user-agent': navigator.userAgent } }),
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
					else if(cheat.controls && (!cheat.player || !cheat.player[add].active) && /click to play/gi.test(intxt))cheat.controls.toggle(true);
				}
				
				document.querySelectorAll('.streamItem *').forEach(node => node.src = '');
			},
			find_target(){
				var targets = cheat.game.players.list.filter(ent => ent[add] && !ent[add].is_you && ent[add].canSee && ent[add].active && ent[add].enemy && (config.aim.frustrum_check ? ent[add].frustum : true)),
					target;
				
				switch(config.aim.target_sorting){
					case'dist3d':
						target = targets.sort((ent_1, ent_2) => ent_1[add].pos.distanceTo(ent_2) * (ent_1[add].frustum == ent_2[add].frustum ? 1 : 0.5) )[0];
						break
					case'hp':
						target = targets.sort((ent_1, ent_2) => (ent_1.health - ent_2.health) * (ent_1.inFrustrum == ent_2[add].frustum ? 1 : 0.5) )[0];
						break
					case'dist2d':
					default:
						target = targets.sort((ent_1, ent_2) => (cheat.center_vec.distanceTo(ent_1[add].pos2D) - cheat.center_vec.distanceTo(ent_2[add].pos2D)) * (ent_1[add].frustum == ent_2[add].frustum ? 1 : 0.5) )[0];
						break
				}
				
				return target;
			},
			procInputs(data){
				if(!cheat.controls || !cheat.player || !cheat.player[add])return;
				
				var keys = {frame: 0, delta: 1, xdir: 2, ydir: 3, moveDir: 4, shoot: 5, scope: 6, jump: 7, reload: 8, crouch: 9, weaponScroll: 10, weaponSwap: 11, moveLock: 12},
					move_dirs = { idle: -1, forward: 1, back: 5, left: 7, right: 3 },
					target = cheat.target = cheat.find_target();
				
				cheat.game.config.inc_deltaMlt = 0;
				cheat.moving_camera = false;
				
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
				
				if(config.aim.triggerbot && cheat.player[add].aiming){
					cheat.mid = new cheat.three.Vector2(0, 0);
					var pm = cheat.game.players.list.filter(ent => ent[add] && ent[add].obj && ent[add].enemy && ent[add].canSee && ent.health).map(ent => ent[add].obj);
					
					cheat.raycaster.setFromCamera(cheat.mid, cheat.world.camera), cheat.raycaster.intersectObjects(pm, true).length && (data[keys.shoot] = cheat.player[cheat.vars.didShoot] ? 0 : 1);
				}
				
				// aiming
				if(cheat.target && cheat.player.health && !data[keys.reload]){
					var yVal = target.y
							+ (target[cheat.syms.isAI] ? -(target.dat.mSize / 2) : (target.jumpBobY * cheat.gconfig.jumpVel) + 1 - target[add].crouch * 3),
						yDire = cheat.util.getDir(cheat.player[add].pos.z, cheat.player[add].pos.x, target.z, target.x),
						xDire = cheat.util.getXDire(cheat.player[add].pos.x, cheat.player[add].pos.y, cheat.player[add].pos.z, target.x, yVal, target.z),
						xv = xDire - cheat.player[cheat.vars.recoilAnimY] * 0.27,
						rot = {
							x: cheat.round(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, xv )) % (Math.PI * 2), 3) || 0,
							y: cheat.round(yDire % (Math.PI * 2), 3) || 0,
						};
					
					// if fully aimed or weapon cant even be aimed or weapon is melee and nearby, shoot
					if(
						(config.aim.status == 'silent' || config.aim.status == 'full') && cheat.player[add].aiming
					)(cheat.player[cheat.vars.ammos][cheat.player[cheat.vars.weaponIndex]] || cheat.player.weapon.ammo == null) ? data[keys.shoot] = 1 : data[keys.reload] = 1;
					
					if(config.aim.smooth)switch(config.aim.status){
						case'assist':
							
							if(cheat.controls[cheat.vars.mouseDownR] || cheat.controls.keys[cheat.controls.binds.aimKey.val])cheat.moving_camera = {
								xD: rot.x,
								yD: rot.y,
							}
							
							break
						case'full':
						case'silent':
							
							if(cheat.player.weapon.nAuto && cheat.player[add].did_shoot)data[keys.shoot] = data[keys.scope] = 0;
							else data[keys.scope] = 1;
							
							if(data[keys.shoot] || cheat.player.weapon.melee)cheat.moving_camera = {
								xD: rot.x,
								yD: rot.y,
							}
							
							break
					}else switch(config.aim.status){
						case'silent':
							// dont shoot if weapon is on shoot cooldown
							if(cheat.player.weapon.nAuto && cheat.player[cheat.vars.didShoot])data[keys.shoot] = data[keys.scope] = 0;
							else data[keys.scope] = 1;
							
							// wait until we are shooting to look at enemy
							if(!data[keys.reload] && (data[keys.shoot] || cheat.player.weapon.melee)){
								data[keys.xdir] = rot.x * 1000;
								data[keys.ydir] = rot.y * 1000;
							}
							
							break
						case'assist':
							
							if(cheat.controls[cheat.vars.mouseDownR] || cheat.controls.keys[cheat.controls.binds.aimKey.val]){
								cheat.controls[cheat.vars.pchObjc].rotation.x = rot.x
								cheat.controls.object.rotation.y = rot.y
								
								data[keys.xdir] = rot.x * 1000;
								data[keys.ydir] = rot.y * 1000;
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
					}
				}
			},
			process(){ try{
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
					if(!ent[add])ent[add] = {
						pos: {
							distanceTo(p2){return Math.hypot(this.x - p2.x, this.y - p2.y, this.z - p2.z)},
							get x(){ return ent.x || 0 },
							get y(){ return ent.y || 0 },
							get z(){ return ent.z || 0 },
							project(t){ return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)},
							applyMatrix4: function(t){var e=this.x,n=this.y,r=this.z,i=t.elements,a=1/(i[3]*e+i[7]*n+i[11]*r+i[15]);return this.x=(i[0]*e+i[4]*n+i[8]*r+i[12])*a,this.y=(i[1]*e+i[5]*n+i[9]*r+i[13])*a,this.z=(i[2]*e+i[6]*n+i[10]*r+i[14])*a,this},
						},
						get aiming(){
							return !ent[cheat.vars.aimVal] || ent.weapon.noAim || cheat.target && cheat.target[add] && ent.weapon.melee && ent[add].pos.distanceTo(cheat.target[add].pos) <= 18;
						},
						get crouch(){ return ent[cheat.vars.crouchVal] },
						get obj(){ return ent?.lowerBody?.parent?.parent },
						// [cheat.vars.objInstances] },
						get max_health(){ return ent[cheat.vars.maxHealth] },
						get pos2D(){ return ent.x != null ? cheat.wrld2scrn(ent[add].pos) : { x: 0, y: 0 } },
						get canSee(){
							return ent[add].active && cheat.util.canSee(cheat.player, ent) == null ? true : false;
						},
						get frustum(){ return ent[add].active && n.Reflect.apply(cheat.three.Frustum.prototype.containsPoint, cheat.world.frustum, [ ent[add].pos ]); },
						get active(){ return ent.x != null && cheat.ctx && ent[add].obj && ent.health > 0 },
						get enemy(){ return !ent.team || ent.team != cheat.player.team },
						get did_shoot(){ return ent[cheat.vars.didShoot] },
						risk: ent.isDev || ent.isMod || ent.isMapMod || ent.canGlobalKick || ent.canViewReports || ent.partnerApp || ent.canVerify || ent.canTeleport || ent.isKPDMode || ent.level >= 30,
						is_you: ent[cheat.vars.isYou],
						get inview(){
							return ent[cheat.vars.inView];
						},
						set inview(v){
							ent[cheat.vars.inView] = v;
						},
					}
					
					if(!ent[add].active)return;
					
					// we are at fastest tick so we can do this
					if(ent[add].obj)ent[add].obj.visible = true;
					
					ent[add].inview = cheat.hide_nametags ? false : config.esp.nametags ? ent[add].frustum : ent[add].enemy ? ent[add].canSee : true;
				});
			}catch(err){ cheat.err('CAUGHT:', err) }},
			render(){ try{ // rendering tasks
				if(!cheat.cas || !cheat.ctx){
					cheat.cas = document.querySelector('#game-overlay');
					cheat.ctx = cheat.cas ? cheat.cas.getContext('2d', { alpha: true }) : {};
					
					cheat.center_vec = {
						x: window.innerWidth / 2,
						y: window.outerHeight / 2,
						distanceTo(p2){return Math.hypot(this.x - p2.x, this.y - p2.y)}
					}
				}
				
				cheat.ctr('resetTransform');
				
				if(config.esp.minimap){
					var cm = cheat.game.map.maps[cheat.game.map.lastGen];
					
					if(!cm)return;
					
					if(!cm.mm || !cm.dims){
						cm.mm = {
							scale: 6,
							offset: {
								x: 100,
								y: 75,
							},
							player_size: {
								w: 5,
								h: 5
							},
						};
						
						cm.objs = cm.objects.map(obj => ({ collision: !(obj.l || obj.col), pos: { x: obj.p[0], y: obj.p[1], z: obj.p[2] }, size: { x: obj.s[0], y: obj.s[1], z: obj.s[2] }, color: obj.c, opacity: obj.o == null ? 1 : obj.o  })).filter(obj =>
							obj.collision &&
							obj.opacity &&
							obj.color &&
							obj.size.x &&
							obj.size.y && 
							obj.size.z &&
							obj.pos.y);
						
						cm.dims = { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } };
						
						cm.objs.forEach(obj => {
							cm.dims.min.x = obj.pos.x < cm.dims.min.x ? obj.pos.x : cm.dims.min.x;
							cm.dims.max.x = obj.pos.x > cm.dims.min.x ? obj.pos.x : cm.dims.min.x;
							
							cm.dims.min.z = obj.pos.z < cm.dims.min.z ? obj.pos.z : cm.dims.min.z;
							cm.dims.max.z = obj.pos.z > cm.dims.min.z ? obj.pos.z : cm.dims.min.z;
						});
						
						cm.dims.size = {
							w: Math.abs(cm.dims.min.x) + Math.abs(cm.dims.max.x),
							h: Math.abs(cm.dims.min.z) + Math.abs(cm.dims.max.z),
						};
						
						cm.dims.min.x_abs = Math.abs(cm.dims.min.x);
						cm.dims.min.z_abs = Math.abs(cm.dims.min.z);
						
						cm.objs = cm.objs.sort((pobj, obj) => (pobj.pos.y + pobj.size.y) - (obj.pos.y + obj.size.y));
						
						cm.obj_calc = cm.objs.map(obj => {
							var cth = c => ((~~c).toString(16) + '').padStart(2, '0'),
								htc = h => {
									var [r, g, b] = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h).slice(1).map(n => parseInt(n, 16));
									
									return { r: r, g: g, b: b };
								},
								color = htc(obj.color.length == 4 ? '#' + obj.color.substr(1).split('').map(e => e+e).join('') : obj.color),
								inc = (obj.pos.y + obj.size.y) / 3;
							
							return [
								'#' + cth(color.r - inc) + cth(color.g - inc) + cth(color.b - inc),
								[
									~~(cm.mm.offset.x + ((cm.dims.min.x_abs + obj.pos.x) / cm.mm.scale)),
									~~(cm.mm.offset.y + ((cm.dims.min.z_abs + obj.pos.z) / cm.mm.scale)),
									~~(obj.size.x / cm.mm.scale),
									~~(obj.size.z / cm.mm.scale)
								],
							];
						});
					}
					
					cm.obj_calc.forEach(calculated => (cheat.ctx.fillStyle = calculated[0], cheat.ctr('fillRect', calculated[1])));
					
					cheat.game.players.list.filter(ent => ent[add] && ent[add].active).forEach(ent => {
						var wp = cm.dims.min.x_abs + ent[add].pos.x,
							hp = cm.dims.min.z_abs + ent[add].pos.z,
							cham_color = ent[add].is_you ? '#FFF' : (ent[add].enemy ? ent[add].risk ? '#F70' : '#F00' : '#0F0');
						
						cheat.ctx.fillStyle = cheat.ctx.strokeStyle = cham_color;
						
						cheat.ctr('beginPath');
						cheat.ctr('arc', [ cm.mm.offset.x + (wp / cm.mm.scale), cm.mm.offset.y + (hp / cm.mm.scale), 3, 0, 2 * Math.PI ]);
						cheat.ctr('fill');
						
						if(ent[add].is_you){
							cheat.ctr('beginPath');
							cheat.ctr('moveTo', [ cm.mm.offset.x + (wp / cm.mm.scale), cm.mm.offset.y + (hp / cm.mm.scale) ]);
							
							var scalar = -250,
								x = 0,
								y = 0,
								z = 1,
								qx = ent[add].obj.quaternion.x,
								qy = ent[add].obj.quaternion.y,
								qz = ent[add].obj.quaternion.z,
								qw = ent[add].obj.quaternion.w, // calculate quat * vector
								ix = qw * x + qy * z - qz * y,
								iy = qw * y + qz * x - qx * z,
								iz = qw * z + qx * y - qy * x,
								iw = -qx * x - qy * y - qz * z, // calculate result * inverse quat
								nwp = cm.dims.min.x_abs + ent[add].pos.x + (ix * qw + iw * -qx + iy * -qz - iz * -qy) * scalar,
								nhp = cm.dims.min.z_abs + ent[add].pos.z + (iz * qw + iw * -qz + ix * -qy - iy * -qx) * scalar;
							
							cheat.ctx.strokeStyle = cham_color;
							cheat.ctx.lineWidth = 1.75;
							cheat.ctx.lineCap = 'round';
							
							cheat.ctr('lineTo', [ cm.mm.offset.x + (nwp / cm.mm.scale) - cm.mm.player_size.w / 2, cm.mm.offset.y + (nhp / cm.mm.scale) - cm.mm.player_size.h / 2 ]);
							cheat.ctr('stroke');
						}
					});
				}
				
				// draw overlay stuff
				if(config.game.overlay && cheat.game && cheat.ctx){
					cheat.ctx.strokeStyle = '#000'
					cheat.ctx.font = 'Bold 14px Inconsolata, monospace';
					cheat.ctx.textAlign = 'start';
					cheat.ctx.lineWidth = 2.6;
					
					[
						[['#BBB', 'Player: '], ['#FFF', cheat.player && cheat.player[add] && cheat.player[add].pos ? ['x', 'y', 'z'].map(axis => axis + ': ' + cheat.player[add].pos[axis].toFixed(2)).join(', ') : 'N/A']],
						[['#BBB', 'Target: '], ['#FFF', cheat.target && cheat.target.isActive ? cheat.target.alias + ', ' + ['x', 'y', 'z'].map(axis => axis + ': ' + cheat.target.pos[axis].toFixed(2)).join(', ') : 'N/A']],
						[['#BBB', 'Hacker: '], [window.activeHacker ? '#0F0' : '#F00', window.activeHacker ? 'TRUE' : 'FALSE']],
						[['#BBB', 'Aiming: '], [cheat.player && cheat.player[add] && cheat.player[add].aiming ? '#0F0' : '#F00', cheat.player && cheat.player[add] && cheat.player[add].aiming ? 'TRUE' : 'FALSE']],
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
				
				cheat.game.players.list.filter(ent => ent[add] && ent[add].active && ent[add].frustum && !ent[add].is_you).forEach(ent => {
					var src_pos = cheat.wrld2scrn(ent[add].pos),
						src_pos_crouch = cheat.wrld2scrn(ent[add].pos, ent.height - ent[add].crouch * 3),
						esp_width = ~~((src_pos.y - cheat.wrld2scrn(ent[add].pos, ent.height).y) * 0.7),
						esp_height = src_pos.y - src_pos_crouch.y,
						esp_box_y = src_pos.y - esp_height,
						// teammate = green, enemy = red, risk + enemy = orange
						cham_color = ent[add].is_you ? '#FFF' : ent[add].enemy ? ent[add].risk ? '#F70' : '#F00' : '#0F0',
						cham_color_full = parseInt(cham_color.substr(1).split('').map(e => e+e).join(''), 16), // turn #FFF into #FFFFFF
						chams_enabled = config.esp.status == 'chams' || config.esp.status == 'box_chams' || config.esp.status == 'full';
					
					if(ent[add].obj)ent[add].obj.traverse(obj => {
						if(obj.type != 'Mesh')return;
						
						obj.material.wireframe = !!config.game.wireframe;
						
						if(ent[add].is_you)return;
						
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
					var hp_perc = (ent.health / ent[add].max_health) * 100;
					
					if(config.esp.status == 'full' || config.esp.health_bars){
						var hp_grad = cheat.ctr('createLinearGradient', [0, src_pos.y - esp_height, 0, src_pos.y - esp_height + esp_height]),
							box_ps = [src_pos.x - esp_width, src_pos.y - esp_height, esp_width / 4, esp_height];
						
						if(typeof hp_grad.addColorStop != 'function')return;
						
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
							player_dist = cheat.player[add].pos.distanceTo(ent[add].pos),
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
								[[hp_color, ent.health + '/' + ent[add].max_health + ' HP']],
							// player weapon & ammo
							[['#FFF', ent.weapon.name ],
								['#BBB', '['],
								['#FFF', (ent.weapon.ammo || 'N') + '/' + (ent.weapon.ammo || 'A') ],
								['#BBB', ']']],
							[['#BBB', 'Risk: '], [(ent[add].risk ? '#0F0' : '#F00'), ent[add].risk]],
							[['#BBB', 'Shootable: '], [(ent[add].canSee ? '#0F0' : '#F00'), ent[add].canSee]],
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
			find_vars: [
				['isYou', /this\['accid'\]=0x0,this\['(\w+)'\]=\w+,this\['isPlayer'\]/, 1],
				['inView', /&&!\w\['\w+']&&\w\['\w+'\]&&\w\['(\w+)']\){/, 1],
				['pchObjc', /0x0,this\['(\w+)']=new \w+\['Object3D']\(\),this/, 1],
				['aimVal', /this\['(\w+)']-=0x1\/\(this\['weapon']\['aimSpd']/, 1],
				['crouchVal', /this\['(\w+)']\+=\w\['crouchSpd']\*\w+,0x1<=this\['\w+']/, 1],
				// ['canSee', /\w+\['(\w+)']\(\w+,\w+\['x'],\w+\['y'],\w+\['z']\)\)&&/, 1],
				['didShoot', /--,\w+\['(\w+)']=!0x0/, 1],
				['ammos', /\['length'];for\(\w+=0x0;\w+<\w+\['(\w+)']\['length']/, 1],
				['weaponIndex', /\['weaponConfig']\[\w+]\['secondary']&&\(\w+\['(\w+)']==\w+/, 1],
				['maxHealth', /\['regenDelay'],this\['(\w+)']=\w+\['mode'\]&&\w+\['mode']\['\1']/, 1],
				['yVel', /this\['y']\+=this\['(\w+)']\*\w+\['map']\['config']\['speedY']/, 1],
				['mouseDownR', /this\['(\w+)']=0x0,this\['keys']=/, 1], 
				['recoilAnimY', /this\['reward']=0x0,this\['\w+']=0x0,this\['(\w+)']=0x0,this\['\w+']=0x0,this\['\w+']=0x1,this\['slideLegV']/, 1],
			],
			patches: new Map([
				// wallbangs
				// [/\['noShoot']&&(\w+)\['active']&&\(!\1\['transparent']\|\|(\w+)\)/, '.noShoot && $1.active && ($1.transparent || $2 || (ssd.config.aim.wallbangs && ssd.player && ssd.player.weapon) ? (!$1.penetrable || !ssd.player.weapon.pierce) : true)'],
				
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
				skins: [...new Uint8Array(5e2)].map((e, i) => ({ ind: i, cnt: 1 })),
				get config(){ return config },
				get player(){ return cheat.player || { weapon: {} } },
				get target(){ return cheat.target || {} },
				set __webpack_require__(nv){
					cheat.__webpack_require__ = nv;
					
					cheat.wf(() => cheat.__webpack_require__.c).then(exports => n.Object.entries({
						// util: ['hexToRGB', 'keyboardMap'],
						gconfig: [ 'isNode', 'isComp', 'isProd' ],
						ws: ['ahNum', 'connected', 'socketId', 'send', 'trackPacketStats'],
						overlay: ['render', 'canvas'],
						colors: ['challLvl', 'getChallCol', 'premium', 'partner'],
						shop: ['purchases', 'previews', 'premium', 'events'],
					}).forEach(([ label, entries ]) => Object.values(exports).filter(mod => mod && mod.exports).forEach(mod => (!entries.some(entry => !n.Reflect.apply(n.Object.prototype.hasOwnProperty, mod.exports, [ entry ])) && (cheat[label] = mod.exports)))));
				},
				set game(nv){
					cheat.game = nv;
				},
				set world(nv){
					cheat.world = nv;
				},
				skin(player){
					return config.game.skins ? Object.assign(cheat.storage.skins, player.skins) : player.skins;
				},
				frame(frame, func){
					cheat.player = cheat.game ? cheat.game.players.list.find(player => player[cheat.vars.isYou]) : null;
					cheat.controls = cheat.game ? cheat.game.controls : null;
					
					if(cheat.world)cheat.world.scene.onBeforeRender = cheat.process;
					
					if(cheat.ws && !cheat.ws[cheat.syms.hooked]){
						cheat.ws[cheat.syms.hooked] = true;
						
						cheat.ws.send = uhook(cheat.ws.send, (target, that, [label, ...data]) => {
							if(label == 'ent' && config.game.skins)cheat.skin_conf = {
								weapon: data[0][2],
								hat: data[0][3],
								body: data[0][4],
								knife: data[0][9],
								dye: data[0][14],
								waist: data[0][17],
							};
							
							return n.Reflect.apply(target, that, [label, ...data]);
						});
						
						cheat.ws._dispatchEvent = uhook(cheat.ws._dispatchEvent, (target, that, [ label, data ]) => {
							if(config.game.skins && label[0] == 0 && cheat.skin_conf){
								// sending server player data
								var player_size = 38,
									pd = data[0];
								
								for(;pd.length % player_size != 0;)player_size++;
								
								for(var i = 0; i < pd.length; i += player_size)if(pd[i] == cheat.ws.socketId){
									pd[i + 12] = cheat.skin_conf.weapon;
									pd[i + 13] = cheat.skin_conf.hat;
									pd[i + 14] = cheat.skin_conf.body;
									pd[i + 19] = cheat.skin_conf.knife;
									pd[i + 25] = cheat.skin_conf.dye;
									pd[i + 33] = cheat.skin_conf.waist;
								}
							}
							
							return n.Reflect.apply(target, that, [ label, data ]);
						});
					}
					
					if(cheat.controls && cheat.gconfig && !cheat.gconfig[cheat.syms.hooked]){
						cheat.gconfig[cheat.syms.hooked] = true;
						
						var orig_camChaseTrn = cheat.gconfig.camChaseTrn,
							orig_target = cheat.controls.target;
						
						// 0.025
						
						n.Reflect.defineProperty(cheat.gconfig, 'camChaseTrn', {
							get: _ => cheat.moving_camera ? ((50 - config.aim.smoothn) / 1000) : orig_camChaseTrn,
							set: v => orig_camChaseTrn = v,
						});
						
						n.Reflect.defineProperty(cheat.controls, 'target', {
							get: _ => cheat.moving_camera ? cheat.moving_camera : orig_target,
							set: v => orig_target = v,
						});
					}
					
					cheat.render();
					
					return n.Reflect.apply(frame, window, [ func ]);
				},
				proxy: class {
					constructor(input){
						return input;
					}
				},
				get log(){ return cheat.log },
				get err(){ return cheat.err },
				info(data){
					switch(data){
						case'injected':
							
							cheat.log('injected to game');
							
							cheat.log('hiding: ' + cheat.objs.storage + '.' + cheat.rnds.storage, window[cheat.objs.storage][cheat.rnds.storage]);
							window[cheat.objs.storage][cheat.rnds.storage] = void 0;
							
							break
					}
				},
			},
			inputs: [],
			three: {},
		};
		
		fetch('https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.1/howler.min.js').then(res => res.text()).then(text => new Function(text)());
		
		fetch('https://cdnjs.cloudflare.com/ajax/libs/three.js/r123/three.min.js').then(res => res.text()).then(text => {
			var args = {
					exports: {},
					module: { get exports(){ return args.exports; }, set exports(v){ return args.exports = v; }},
				};
			
			Reflect.apply(new Function(Object.keys(args), text + '\n//# sourceURL=three.min.js'), args.module, Object.values(args));
			
			cheat.three = args.exports;
			
			cheat.raycaster = new cheat.three.Raycaster();
		});
		
		// pass storage object to game
		cheat.patches.set(/^/, '((ssd, Proxy) => { return ');
		cheat.patches.set(/$/g, '})(' + cheat.objs.storage + '.' + cheat.rnds.storage + '(), ' + cheat.objs.storage + '.' + cheat.rnds.storage + '().proxy)');
		
		setInterval(cheat.process_interval, 1000);
		
		cheat.storage.procInputs = cheat.procInputs;
		
		// clear all inputs when window is not focused
		window.addEventListener('blur', () => cheat.inputs = []);
		
		// load cheat font
		new FontFace('Inconsolata', 'url("https://fonts.gstatic.com/s/inconsolata/v20/QldgNThLqRwH-OJ1UHjlKENVzkWGVkL3GZQmAwLYxYWI2qfdm7Lpp4U8WR32lw.woff2")', {
			family: 'Inconsolata',
			style: 'normal',
			weight: 400,
			stretch: '100%',
			unicodeRange: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
		}).load().then(font => document.fonts.add(font));
	},
	inject = () => window.HTMLBodyElement.prototype.appendChild = uhook(window.HTMLBodyElement.prototype.appendChild, (target, that, [ node ]) => {
		var ret = n.Reflect.apply(target, that, [node]);
		
		if(node.nodeName == 'IFRAME' && node.style.display == 'none'){
			node.contentWindow.Response.prototype.arrayBuffer = uhook(node.contentWindow.Response.prototype.arrayBuffer, (target_buf, that, args) => n.Reflect.apply(target_buf, that, args).then(ret => {
				var arr = new Uint8Array(ret),
					// first character of game is !
					xor_key = arr[0] ^ '!'.charCodeAt(),
					code = Array.from(arr).map(chr => String.fromCharCode(chr ^ xor_key)).join('');
				
				// if another piece of code is fetched
				if(!code.includes('isProd'))return ret;
				
				// restore functions
				node.contentWindow.Response.prototype.arrayBuffer = target_buf;
				window.HTMLBodyElement.prototype.appendChild = target;
				
				// find stuff and patch stuff
				cheat.patches.forEach((replacement, regex) => code = code.replace(regex, replacement));
				cheat.find_vars.forEach(([ label, regex, pos ]) => {
					var match = code.match(regex);
					
					if(match && match[pos])cheat.vars[label] = match[pos];
					else cheat.vars_not_found.push(label), cheat.vars[label] = label;
				});
				
				if(cheat.vars_not_found.length)cheat.err('Could not find: ' + cheat.vars_not_found.join(', '));
				
				window[cheat.objs.storage][cheat.rnds.storage] = uhook(window[cheat.objs.storage], () => cheat.storage);
				
				return new Promise((resolve, reject) => resolve(Uint8Array.from([...code].map(char => char.charCodeAt() ^ xor_key))));
			}));
		}
		
		return ret;
	}),
	base_css = `
.con {
	z-index: 9000000;
	position: absolute;
	display: flex;
	width: 400px;
	height: 350px;
	background: #112;
	border: none;
	flex-direction: column;
	transition: opacity .15s ease-in-out, color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
	user-select: none;
}

.con, .con * {
	color: #eee;
	font: 13px Inconsolata, monospace;
}

.cons {
	display: flex;
	flex: 1 1 0;
}
 
.bar {
	border-top-left-radius: 2px;
	border-top-right-radius: 2px;
	-webkit-app-region: drag;
}

.bar {
	height: 30px;
	min-height: 30px;
	line-height: 28px;
	text-align: center;
}

.bar-top {
	transition: opacity .15s ease-in-out, color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out;
	border: 2px solid #eee;
}

.bar-top:hover {
	border-color: #29F;
}

.bar-top:active {
	background: #224;
}

.main-border {
	display: flex;
	flex-direction: column;
	height: 100%;
	border: 2px solid #eee;
	border-top: none;
	border-bottom-left-radius: 3px;
	border-bottom-right-radius: 3px;
	overflow: hidden;
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
	transition: color .15s ease-in-out,background-color .15s ease-in-out, border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

.tab-button:hover {
	background: #666;
}

.tab-button:active {
	background: #333;
	box-shadow: -3px -1px 0px 3px #CCC6;
}

.content-con {
	flex: 1 1 0;
	display: flex;
	flex-direction: column;
	height: 100%;
}

.content-con::-webkit-scrollbar {
	width: 10px;
}

.content-con::-webkit-scrollbar-thumb {
	background-color: #EEE;
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
	transition: color .15s ease-in-out,background-color .15s ease-in-out, border-color .15s ease-in-out,box-shadow .15s ease-in-out;
}

.control-button:hover {
	background: #333;
	filter: brightness(125%)
}

.control-button:active {
	box-shadow: 0px 0px 0px 3px #CCC6;
}

.control-button.true {
	background: #2A0;
}

.control-button.true:active {
	box-shadow: 0px 0px 0px 3px #2A06;
}

.control-button.false {
	background: #A00;
}

.control-button.false:active {
	box-shadow: 0px 0px 0px 3px #A006;
}

.control-textbox {
	height: 28px;
	display: block;
	font: 14px Inconsolata, monospace;
	padding: 0px .75rem 0px 0px;
	text-align: right;
	transition: color .15s ease-in-out,background-color .15s ease-in-out, border-color .15s ease-in-out,box-shadow .15s ease-in-out;
	border: 1px solid #2B4194;
	margin: auto 3px;
}

.control-textbox:focus {
	box-shadow: 0px 0px 0px 3px #037;
}

.control-label {
	flex: 1 1 0;
	padding-left: 15px;
	line-height: 36px;
	border-left: 2px solid #445;
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
	text-align: center;
	font-size: 12px;
	width: 100%;
	line-height: 34px;
	height: 34px;
}

.ver {
	position: absolute;
	top: 0px;
	right: 0px;
	width: 60px;
	margin: auto;
	line-height: 34px;
	height: 34px;
	text-align: center;
}

.log {
	padding: 4px;
	user-select: text;
	border-bottom: 2px solid #445;
	min-height: 20px;
	overflow: hidden;
	line-height: 19px;
	font-size: 13px;
	flex: none;
}

.log-badge {
	display: inline;
	background: #FFF;
	color: black;
	border-radius: 30%;
	width: 14px;
	height: 14px;
	padding: 2px;
	margin: auto 5px;
	text-align: center;
	font-size: 11px;
	line-height: 13px;
	user-select: none;
}

.log-timestamp::before {
	content: '[';
}

.log-timestamp::after {
	content: ']';
}

.log-timestamp {
	display: inline;
	margin-right: 5px;
	user-select: none;
}

.log-text {
	display: inline;
}

* {
	outline: none;
}
`,
	init_ui = (title, footer, array) => {
		var con = add_ele('div', document.body, { className: 'con' }),
			titlebar = add_ele('div', con, { innerHTML: title, className: 'bar bar-top' }),
			main_border = add_ele('div', con, { className: 'main-border' }),
			cons = add_ele('div', main_border, { className: 'cons' }),
			sidebar_con = add_ele('div', cons, { className: 'sidebar-con' }),
			style = add_ele('link', document.head, { rel: 'stylesheet', href: URL.createObjectURL(new window.Blob([ base_css ], { type: 'text/css' })) }),
			tab_nodes = [],
			process_controls = (control, tab, tab_button, tab_ele) => {
				if(control.type == 'nested_menu'){
					control.tab_ele = add_ele('div', cons, { className: 'content-con', style: 'display: none' });
					
					tab_nodes.push(control.tab_ele);
					
					control.val.forEach(controle => process_controls(controle, tab, tab_button, control.tab_ele));
					
					if(control.load)control.load(control.tab_ele);
				}
				
				var content = tab_ele.appendChild(document.createElement('div')),
					content_name = document.createElement('div'), // append after stuff
					label_appended = false;
				
				content.className = 'content';
				
				control.interact = data => {
					switch(control.type){
						case'bool':
							control.val_set(!control.val_get())
							break
						case'bool_rot':
							control.aval = control.aval + 1
							if(control.aval >= control.vals.length)control.aval = 0 // past length
							control.val_set(control.vals[control.aval].val);
							break
						case'function':
							control.val_get()();
							break
						case'function_inline':
							control.val();
							break
						case'nested_menu':
							tab_nodes.forEach(ele => ele.style.display = 'none');
							control.tab_ele.removeAttribute('style');
							break
						case'textbox':
							control.val_set(control.input.value.substr(0, control.max_length));
							break
					}
					control.update();
				};
				
				control.update = _ => {
					switch(control.type){
						case'bool':
							control.button.className = 'control-button ' + !!control.val_get();
							break
						case'bool_rot':
							content_name.innerHTML = control.name + ': ' + control.vals[control.aval].display;
							break
						case'text':
							break
						case'text-small':
							content_name.style.border = 'none';
							content_name.style['font-size'] = '12px';
							content_name.style['padding-left'] = '8px';
							break
						case'text-medium':
							content_name.style.border = 'none';
							content_name.style['font-size'] = '13px';
							content_name.style['padding-left'] = '8px';
							break
						case'text-bold':
							content_name.style.border = 'none';
							content_name.style['font-weight'] = '600';
							content_name.style['padding-left'] = '8px';
							break
						case'text-small-bold':
							content_name.style['font-size'] = '12px';
							content_name.style['font-weight'] = '600';
							content_name.style['padding-left'] = '8px';
							break
						case'textbox':
							control.input.value = control.input.value.substr(0, control.max_length);
							break
					}
				};
				
				if(control.key){
					control.button = content.appendChild(document.createElement('div'));
					control.button.addEventListener('click', control.interact);
					control.button.className = 'control-button'
					if(control.key != 'unset')control.button.innerHTML = '[' + control.key + ']'
					else control.button.innerHTML = '[-]'
				}
				
				
				switch(control.type){
					case'textbox':
						
						Object.assign(content.appendChild(content_name), {
							className: 'control-label',
							innerHTML: control.name,
						});
						
						content_name.style.padding = '0px 10px';
						content_name.style['border-left'] = 'none';
						content_name.style['border-right'] = '2px solid #445';
						
						control.input = add_ele('input', content, { className: 'control-textbox', placeholder: control.placeholder, spellcheck: false, value: control.val_get() });
						
						// .style.display = 'none';
						label_appended = true;
						
						control.input.addEventListener('input', control.interact);
						
						break
					case'slider':
						var movement = { tb: { value: false, } };
						
						movement.sd = { held: false, x: 0, y: 0 };
						
						var rtn = (number, unit) => (number / unit).toFixed() * unit,
							update_slider = event => {
								if(!movement.sd.held)return;
								
								var slider_box = control.slider.getBoundingClientRect(),
									perc = (event.offsetX / control.slider.offsetWidth * 100).toFixed(2),
									perc_rounded = rtn(perc, control.unit / 10).toFixed(2),
									value = ((control.max_val / 100) * perc_rounded).toFixed(2);
								
								if(event.clientX <= slider_box.x){
									value = 0;
									perc_rounded = 0;
								}else if(event.clientX >= slider_box.x + slider_box.width){
									value = control.max_val;
									perc_rounded = 100;
								}
								
								if(perc_rounded <= 100 && value >= control.min_val){
									control.slider_bg.style.width = perc_rounded + '%'
									control.slider.setAttribute('data', Number(value.toString().substr(0,10)));
									
									control.val_set(Number(value));
								}
							};
						
						control.slider = content.appendChild(document.createElement('div'));
						control.slider_bg = control.slider.appendChild(document.createElement('div'));
						control.slider.className = 'control-slider'
						control.slider_bg.className = 'control-slider-bg'
						
						control.slider_bg.style.width = control.val_get() / control.max_val * 100 + '%'
						control.slider.setAttribute('data', control.val_get());
						
						control.slider.addEventListener('mousedown', event=>{
							movement.sd = { held: true, x: event.layerX, y: event.layerY }
							update_slider(event);
						});
						
						window.addEventListener('mouseup', _=> movement.sd.held = false );
						
						window.addEventListener('mousemove', event=> update_slider(event));
						
						break
					case'bool_rot':
						
						control.vals.forEach((entry, index) =>{ if(entry.val == control.val_get())control.aval = index })
						if(!control.aval)control.aval = 0
						
						break
				}
				
				if(!label_appended){
					content.appendChild(content_name);
					content_name.className = 'control-label'
					content_name.innerHTML = control.name;
				}
				
				control.update();
				
				if(control.key && control.key != 'unset')cheat.keybinds.push({
					code: !isNaN(Number(control.key)) ? 'Digit' + control.key : 'Key' + control.key.toUpperCase(),
					interact: control.interact,
				});
			},
			align_con = () => (con.style.top = (window.innerHeight / 2) - (con.getBoundingClientRect().height / 2) + 'px', con.style.left = '20px');
		
		window.addEventListener('keydown', event => {
			cheat.inputs[event.code] = true;
			
			var keybind = cheat.keybinds.find(keybind => typeof keybind.code == 'string'
					? keybind.code == event.code || keybind.code.replace('Digit', 'Numpad') == event.code
					: keybind.code.some(keycode => keycode == event.code || keycode.replace('Digit', 'Numpad') == event.code));
			
			if(!keybind || event.repeat)return;
			
			keybind.interact(event); // call the keybind callback
		});
		
		window.addEventListener('keyup', event => {
			cheat.inputs[event.code] = false;
		});
		
		cheat.keybinds.push({
			code: ['KeyC', 'F1'],
			interact: () => con.style.display = (values.ui_visible ^= 1) ? 'block' : 'none',
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
			
			if(tab.load)tab.load(tab_ele);
			
			tab.contents.forEach(control => { try{
				process_controls(control, tab, tab_button, tab_ele);
			}catch(err){ console.error('Encountered error at %c' + control.name + ' (' + control.val + ')', 'color: #FFF', err) }});
			
			if(tab.bottom_text){
				var bottom_text = tab_ele.appendChild(document.createElement('div'));
				
				bottom_text.className = 'tab-desc'
				bottom_text.innerHTML = tab.bottom_text;
			}
		});
		
		add_ele('div', main_border, { className: 'bar', innerHTML: footer });
		add_ele('div', titlebar, { className: 'ver', innerHTML: 'v' + values.version });
		
		// IMAGINE BEING FUCKING CHROME AND NEEDING TO WAIT A TICK TO GET HEIGHT
		setTimeout(align_con);
	};

values.config = config = JSON.parse(JSON.stringify(values.oconfig));

init();
inject();

cheat.wf(() => document && document.body).then(() => init_ui('Shitsploit', 'Press [F1] or [C] to toggle menu', [{
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
		key: values.config.kb.aim || values.oconfig.kb.aim,
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
		key: values.config.kb.bhop || values.oconfig.kb.bhop,
	},{
		name: 'ESP mode',
		type: 'bool_rot',
		val_get: _ => values.config.esp.status,
		val_set: v => values.config.esp.status = v,
		vals: [{
			val: 'off',
			display: 'Off',
		},{
			val: 'box',
			display: 'Box',
		},{
			val: 'chams',
			display: 'Chams',
		},{
			val: 'box_chams',
			display: 'Box & chams',
		},{
			val: 'full',
			display: 'Full',
		}],
		key: values.config.kb.esp || values.oconfig.kb.esp,
	},{
		name: 'Tracers',
		type: 'bool',
		val_get: _ => values.config.esp.tracers,
		val_set: v => values.config.esp.tracers = v,
		key: values.config.kb.tracers || values.oconfig.kb.tracers,
	},{
		name: 'Nametags',
		type: 'bool',
		val_get: _ => values.config.esp.nametags,
		val_set: v => values.config.esp.nametags = v,
		key: values.config.kb.nametags || values.oconfig.kb.nametags,
	},{
		name: 'Overlay',
		type: 'bool',
		val_get: _ => values.config.game.overlay,
		val_set: v => values.config.game.overlay = v,
		key: values.config.kb.overlay || values.oconfig.kb.overlay,
	}],
},{
	name: 'Game',
	contents: [{
		name: 'You need to be signed in for the skin hack',
		type: 'text-small',
	},{
		name: 'Skins',
		type: 'bool',
		val_get: _ => values.config.game.skins,
		val_set: v => values.config.game.skins = v,
		key: 'unset',
	},{
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
	}],
},{
	name: 'Aim',
	contents: [{
		name: 'Target sorting',
		type: 'bool_rot',
		val_get: _ => values.config.game.target_sorting,
		val_set: v => values.config.game.target_sorting = v,
		vals: [{
			val: 'dist2d',
			display: 'Distance (2D)',
		},{
			val: 'dist3d',
			display: 'Distance (3D)',
		},{
			val: 'hp',
			display: 'Health',
		}],
		key: 'unset',
	},{
		name: 'Smoothness',
		type: 'slider',
		val_get: _ => values.config.aim.smoothn,
		val_set: v => values.config.aim.smoothn = v,
		min_val: 0,
		max_val: 50,
		unit: 10,
	},{
		name: 'Smooth',
		type: 'bool',
		val_get: _ => values.config.aim.smooth,
		val_set: v => values.config.aim.smooth = v,
		key: 'unset',
	},{
		name: 'Triggerbot',
		type: 'bool',
		val_get: _ => values.config.aim.triggerbot,
		val_set: v => values.config.aim.triggerbot = v,
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
	}],
},{
	name: 'Esp',
	contents: [{
		name: 'Minimap',
		type: 'bool',
		val_get: _ => values.config.esp.minimap,
		val_set: v => values.config.esp.minimap = v,
		key: 'unset',
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
		min_val: 0.1,
		max_val: 1,
		unit: 1,
	}]
},{
	name: 'Keybinds',
	contents: [{
		name: 'Aim',
		placeholder: 'Aim keybind',
		type: 'textbox',
		max_length: 1,
		val_get: _ => values.config.kb.aim,
		val_set: v => (values.config.kb.aim = v, electron.ipcRenderer.send('reload_cheat')),
	},{
		name: 'Bhop',
		placeholder: 'Bhop keybind',
		type: 'textbox',
		max_length: 1,
		val_get: _ => values.config.kb.bhop,
		val_set: v => (values.config.kb.bhop = v, electron.ipcRenderer.send('reload_cheat')),
	},{
		name: 'ESP',
		placeholder: 'ESP keybind',
		type: 'textbox',
		max_length: 1,
		val_get: _ => values.config.kb.esp,
		val_set: v => (values.config.kb.esp = v, electron.ipcRenderer.send('reload_cheat')),
	},{
		name: 'Tracers',
		placeholder: 'Tracers keybind',
		type: 'textbox',
		max_length: 1,
		val_get: _ => values.config.kb.tracers,
		val_set: v => (values.config.kb.tracers = v, electron.ipcRenderer.send('reload_cheat')),
	},{
		name: 'Overlay',
		placeholder: 'Overlay keybind',
		type: 'textbox',
		max_length: 1,
		val_get: _ => values.config.kb.overlay,
		val_set: v => (values.config.kb.overlay = v, electron.ipcRenderer.send('reload_cheat')),
	},{
		name: 'ASAP toggle',
		placeholder: 'ASAP toggle keybind',
		type: 'textbox',
		max_length: 1,
		val_get: _ => values.config.kb.disable_settings,
		val_set: v => (values.config.kb.disable_settings = v, electron.ipcRenderer.send('reload_cheat')),
	},{
		name: 'ASAP toggle',
		type: 'function_inline',
		val(){
			values.config.aim.status = values.oconfig.aim.status;
			values.config.game.bhop = values.oconfig.game.bhop;
			values.config.esp.status = values.oconfig.esp.status;
			values.config.esp.tracers = values.oconfig.esp.tracers;
			values.config.esp.nametags = values.oconfig.esp.nametags;
			values.config.esp.minimap = values.oconfig.esp.minimap;
			values.config.esp.walls = values.oconfig.esp.walls;
			values.config.esp.health_bars = values.oconfig.esp.health_bars;
			values.config.game.overlay = values.oconfig.game.overlay;
			values.config.aim.triggerbot = values.oconfig.aim.triggerbot;
			values.config.aim.auto_reload = values.oconfig.aim.auto_reload;
			
			// Object.entries(values.config).forEach(([ key, val ]) => Object.entries(val).forEach(([ sub_key, sub_val ]) => ['string', 'boolean'].includes(typeof sub_val) && (values.config[key][sub_key] = values.oconfig[key][sub_key])));
			
			electron.ipcRenderer.send('reload_cheat');
		},
		key: values.config.kb.disable_settings || values.oconfig.kb.disable_settings,
	},{
		name: 'Reset settings',
		type: 'function_inline',
		val: _ => (values.config = Object.assign({}, values.oconfig), electron.ipcRenderer.send('reload_cheat')),
		key: 'unset',
	}],
}]));

})();