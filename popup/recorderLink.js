var RUNNER_PROTOCOL = 'http'
	RUNNER_HOST = 'localhost',
	RUNNER_PORT = 3000;

function renderCasper() {
	return getRecording().then(function(info) {
		var dt = new CasperRenderer(info.computedName, info.actions, info.varNames);
		return dt.render();
	});
	return Promise.all([getCurrentRecording(), getName(), getVariables()]).then(function(info) {
		var recording = info[0],
			title = info[1],
			variables = info[2];

	});
}

function requestStop() {
	return new Promise(function(resolve, reject) {
		chrome.runtime.sendMessage({action: 'request_stop'});
		resolve();
	});
}

function requestCancel() {
	return requestStop();
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

var getActions = fieldGetter('get_actions'),
	getVariables = fieldGetter('get_variables'),
	getName = fieldGetter('get_name'),
	getStatus = fieldGetter('get_status'),
	getRecording = fieldGetter('get_recording');

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
			url: RUNNER_PROTOCOL + '://' + RUNNER_HOST + ':' + RUNNER_PORT + '/api/v1/uploadCommand',
			method: 'POST',
			data: scriptInfo,
			success: function(response) {
				resolve(response);
			}
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

var numIndicies = 5;
function getVariableIndex(vars, varName) {
	var names = _.keys(vars).sort(),
		index = names.indexOf(varName);
	return index % numIndicies;
}
