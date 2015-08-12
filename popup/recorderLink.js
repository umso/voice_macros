function renderCasper() {
	return getCurrentRecording().then(function(recording) {
		return new Promise(function(resolve, reject) {
			var dt = new CasperRenderer(document);
			dt.items = recording;
			dt.render(false);
			resolve(dt.textContent);
		});
	});
}

function postStop() {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'stop'});
		resolve();
	});
}

function postStart() {
	return getSelectedTab().then(function(tab) {
		return new Promise(function(resolve, reject) {
			chrome.runtime.sendMessage({action: 'start', tab_id: tab.id});
			resolve();
		});
	});
}

function getSelectedTab() {
	return new Promise(function(resolve, reject) {
		chrome.tabs.getSelected(null, function(tab) {
			resolve(tab);
		});
	});
}

function getCurrentRecording() {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'get_recording'}, function(recording) {
			resolve(recording);
		});
	});
}

function getStatus() {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'get_status'}, function(status) {
			resolve(status);
		});
	});
}

function downloadJSFile(data, name) {
	downloadURI('data:text/javascript;charset=utf-8,' + encodeURIComponent(data), name);
}

function downloadURI(uri, name) {
	var link = document.createElement('a');
	link.download = name;
	link.href = uri;
	link.click();
}
