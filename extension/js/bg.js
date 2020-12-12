(async () => {
	var require = mod => new Promise((resolve, reject) => fetch(chrome.runtime.getURL(mod)).then(res => res.text()).then(text => {
			var args = {
					exports: {},
					module: { get exports(){ return args.exports; }, set exports(v){ return args.exports = v; }},
					require: require,
					process: { cwd(){ return '/'; }, },
				};
			
			Reflect.apply(new Function(Object.keys(args), text + '\n//# sourceURL=' + mod), args.module, Object.values(args));
			
			resolve(args.exports);
		}).catch(reject)),
		events = await require('js/events.js'),
		ipc = new events();
	
	if(!localStorage.getItem('config'))localStorage.setItem('config', '{}');
	
	ipc.on('get_config', () => ipc.send('config', JSON.parse(localStorage.getItem('config'))));
	ipc.on('set_config', value => console.log(value) + localStorage.setItem('config', value));
	
	ipc.send = (name, ...data) => {
		chrome.extension.sendMessage(JSON.stringify({ from: 'content', data: [ name, ...data ] }));
	};
	
	chrome.extension.onMessage.addListener(data => {
		try{ data = JSON.parse(data) }catch(err){ return 0; }
		
		if(data.from != 'sploit')return;
		
		ipc.emit(...data.data);
	});
	
	chrome.webRequest.onBeforeRequest.addListener(details => {
		if(new URL(details.url).pathname == '/libs/howler.min.js'){
			chrome.tabs.executeScript(details.tabId, {
				code: `
chrome.extension.onMessage.addListener(data => {
	console.log(data, 'h', 'j');
	
	try{ data = JSON.parse(data) }catch(err){ return; }
	
	if(Array.isArray(data) || data.from != 'background')return;
	
	window.postMessage(JSON.stringify({ from: 'content', data: data.data }), '*');
});

window.addEventListener('message', data => {
	try{ data = JSON.parse(data.data); }catch(err){ return null; };
	
	if(data.from != 'sploit')return;
	
	chrome.extension.sendMessage(JSON.stringify(data));
});
				`,
			});
			
			return { redirectUrl: chrome.runtime.getURL('js/sploit.js') };	
		}
	}, { urls: ['https://krunker.io/libs/*' ] },[ 'blocking' ]);
})();