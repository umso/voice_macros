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

function requestStop() {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'request_stop'});
		resolve();
	});
}

function requestStart() {
	return getSelectedTab().then(function(tab) {
		return new Promise(function(resolve, reject) {
			chrome.runtime.sendMessage({action: 'request_start', tab_id: tab.id});
			resolve();
		});
	});
}

function postNewName(newName) {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'set_name', value: newName});
		resolve();
	});
}

function getSelectedTab() {
	return new Promise(function(resolve, reject) {
		chrome.tabs.getSelected(null, function(tab) {
			resolve(tab);
		});
	});
}

var getCurrentRecording = fieldGetter('get_recording'),
	getVariables = fieldGetter('get_variables'),
	getName = fieldGetter('get_name'),
	getStatus = fieldGetter('get_status');

function fieldGetter(fieldName) {
	return function() {
		return new Promise(function(resolve, reject) {
			chrome.runtime.sendMessage({action: fieldName}, function(response) {
				resolve(response);
			});
		});
	}
}
/*

var HIGHLIGHTER_COLORS = ['E2FF00', 'FF8800', 'FF008E', '00FF00', '00CFFF'];
function assignVariableColors(variables) {
	for(var key in variables) {
		if(variables.hasOwnProperty(key)) {

		}
	}
}
*/

function downloadJSFile(data, name) {
	downloadURI('data:text/javascript;charset=utf-8,' + encodeURIComponent(data), name);
}

function downloadURI(uri, name) {
	var link = document.createElement('a');
	link.download = name;
	link.href = uri;
	link.click();
}
