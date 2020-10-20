var electron = require('electron');

electron.ipcRenderer.on('text', (event, data) => {
	var opt = JSON.parse(data);
	
	promptText.innerText = '' + opt.data;
	switch (opt.type) {
		case 'select':
			type_frame.innerHTML = '<select id="prompt_input"><option value=" ">Homepage</option><option value="social.html">Social</option><option value="viewer.html">Viewer</option><option value="editor.html">Editor</option></select><br>'
			break;
		case 'login':
			type_frame.innerHTML = '<input id="userInput" type="text" placeholder="Username" style="margin-bottom: 10px"><input id="passInput" type="password" placeholder="Password"><br>';
			break;
		case 'text':
		default:
			type_frame.innerHTML = '<input id="prompt_input" placeholder="Enter Input"><br>';
			break;
	}
	
	electron.ipcRenderer.send('prompt_size', document.querySelector('#prompt_menu').getBoundingClientRect().height + 7);
});

var document_load_interval = setInterval(() => {
	if(!document.querySelector('.cancel'))return; else clearInterval(document_load_interval);
	
	document.querySelector('.cancel').addEventListener('click', () => window.close());

	document.querySelector('.submit').addEventListener('click', () => (
		electron.ipcRenderer.send('prompt-response',
			document.querySelector('#prompt_input')
			? document.querySelector('#prompt_input').value
			: {user: document.querySelector('#userInput').value, pass: document.querySelector('#passInput').value}
		), window.close())
	);
}, 50);