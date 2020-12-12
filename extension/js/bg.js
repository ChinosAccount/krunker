var sploit = {
	target: '/libs/howler.min.js',
	replace: chrome.runtime.getURL('js/sploit.js'),
};

chrome.webRequest.onBeforeRequest.addListener(details => ({ redirectUrl: new URL(details.url).pathname == sploit.target ? sploit.replace : null }), { urls: ['https://krunker.io/libs/*' ] }, [ 'blocking' ]);