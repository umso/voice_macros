var RUNNER_PROTOCOL = 'http'
	RUNNER_HOST = 'localhost',
	RUNNER_PORT = 3000;

function renderCasper() {
	return Promise.all([getCurrentRecording(), getName()]).then(function(info) {
		var recording = info[0],
			title = info[1];

		var dt = new CasperRenderer(title, recording);
		return dt.render();
	});
}

function requestStop() {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'request_stop'});
		resolve();
	});
}

function addVariable() {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'add_var'}, function(response) {
			resolve(response);
		});
	});
}
function removeVariable(name) {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'remove_var', name: name}, function(response) {
			resolve(response);
		});
	});
}
function changeVarName(fromName, toName) {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'change_var_name', from: fromName, to: toName}, function(response) {
			resolve(response);
		});
	});
}

function changeVarValue(varName, value) {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'change_var_value', name: varName, value: value}, function(response) {
			resolve(response);
		});
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

function uploadScript(scriptInfo) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			url: RUNNER_PROTOCOL + '://' + RUNNER_HOST + ':' + RUNNER_PORT + '/uploadScript',
			method: 'POST',
			data: scriptInfo,
			success: function(response) {
				resolve(response);
			}
		});
	});
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

var numIndicies = 5;
function getVariableIndex(vars, varName) {
	var names = _.keys(vars).sort(),
		index = names.indexOf(varName);
	return index % numIndicies;
}
