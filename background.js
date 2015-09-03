var currentRecording,
	isRecording = false,
	recordingTabID,
	startingURL,
	uid = 1,
	readContextMenu;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var action = request.action;
	if (action === 'request_start') {
		doStart(request.tab_id);
	} else if(action === 'get_status') {
		sendResponse(doGetStatus());
	} else if(action === 'request_stop') {
		doStop();
	} else if(action === 'append') {
		doAppend(request.obj);
	} else if(action === 'get_recording') {
		sendResponse(doGetRecording());
		console.log(doGetRecording());
	} else if(action === 'get_variables') {
		sendResponse(doGetVariables());
	} else if(action === 'get_name') {
		sendResponse(doGetName());
	} else if(action === 'set_name') {
		nameMacro(request.value);
	} else if(action === 'change_var_value') {
		setTemporaryValue(request.name, request.value);
		sendResponse(doGetVariables());
	} else if(action === 'change_var_name') {
		changeVarName(request.from, request.to);
		sendResponse(doGetVariables());
	} else if(action === 'add_var') {
		addVariable();
		sendResponse(doGetVariables());
	} else if(action === 'remove_var') {
		removeRecordingVar(request.name);
		sendResponse(doGetVariables());
		chrome.runtime.sendMessage({action: 'varChanged'});
	}
});

// If the user starts recording and closes the browser
// then when they restart the browser, the icon indicates recording
// update the icon to prevent that from happening
updateIcon();

function updateIcon() {
	var status = doGetStatus();
	var iconFilename = status.isRecording ? 'icon_active' : 'icon_idle';
	chrome.browserAction.setIcon({
		path: {
			'19': 'icons/' + iconFilename + '19.png',
			'38': 'icons/' + iconFilename + '38.png'
		}
	});
}

function addMacroRecordingCommands() {
	return new Promise(function(resolve, reject) {
		var rv = annyang.addCommands({
			"Culver's macro *name": nameMacro,
			"name this macro *name": nameMacro,
			"all this macro *name": nameMacro,
			"call this macro *name": nameMacro,
			"call does macro *name": nameMacro,
			"call this mac *name": nameMacro,
			"call this microbe *name": nameMacro,
			"call is macro *name": nameMacro,
			"harvest macro *name": nameMacro,
			"(and) when (the) :var is *value_and_action": function(var_name, value_and_action) {
				var clickIndex = Math.max(value_and_action.indexOf('click'),
											value_and_action.indexOf('clip'));
				var value = value_and_action.substring(0, clickIndex).trim();

				if(clickIndex >= 0) {
					clickWhenValue(var_name, value);
				}
			},
			"enter :var here": enterVar,
			":var is this": setVarValueToSelection,
			"this is :var": setVarValueToSelection,
			"read this (aloud)": onRead,
			"read this out loud": onRead,
			"respond with this": onRead,
			"read (this) (back) to (the) user": onRead,
			"ask the user for :var": askForValue,
			"ask the user for :var (as) (and) *requestText": askForValue,
			"for now set :var to *value": setTemporaryValue,
			"for now set :var as *value": setTemporaryValue
		});

		resolve(rv);
	});
}

function removeMacroRecordingCommands() {
	annyang.removeCommands();
	addCoreCommands();
}

function addCoreCommands() {
	var startRecording = function(name) {
		getSelectedTab().then(function(tab) {
			return doStart(tab.id);
		}).then(function() {
			if(name) {
				nameMacro(name);
			}
		});
	};
	var stopRecording = function() {
		doStop();
	};

	return new Promise(function(resolve, reject) {
		var rv = annyang.addCommands({
			"create (a) (new) background (called) (named) *name": startRecording,
			"create (a) (new) macro (called) (named) *name": startRecording,
			"start (a) recording (a) (new) macro (called) (named) *name": startRecording,
			"record (a) (new) macro (called) (named) *name": startRecording,
			"create (a) new macro": startRecording,
			"start (a) recording": startRecording,
			"start recording (a) (new) macro": startRecording,
			"stop (a) (this) recording": stopRecording,
			"stop (this) macro": stopRecording,
			"end (this) macro": stopRecording,
			"end (this) recording": stopRecording
		});

		resolve(rv);
	});
}

function beginSpeechRecognition(onResult) {
	var onHasPermission = function() {
		annyang.start();
		//recognition = new webkitSpeechRecognition();
		//recognition.continuous = true;
		//recognition.addEventListener('result', function(event) {
		//});
		//recognition.start();
		return true;
	};

	return new Promise(function(resolve, reject) {
		navigator.webkitGetUserMedia({
			audio: true,
		}, function(stream) {
			stream.getAudioTracks().forEach(function(track) {
				track.stop();
			});
			resolve(onHasPermission());
		}, function(event) {
			if(event.error === 'not-allowed') {
				resolve(requestSpeechPermission().then(function(hasPermission) {
					if(hasPermission) {
						return onHasPermission();
					} else {
						throw new Error("Permission Denied by user");
					}
				}));
			} else {
				reject(event);
			}
		});
	});
}

function endSpeechRecognition() {
	annyang.abort();
	//recognition.end();
}

function requestSpeechPermission(ready) {
	return new Promise(function(resolve, reject) {
		var requestSpeechWindow = window.open('requestSpeechPermission.html');
		requestSpeechWindow.addEventListener("message", function(e) {
			if(event.data === "granted") {
				resolve(true);
				requestSpeechWindow.close();
			} else {
				resolve(false);
			}
		});
	});
}

addCoreCommands().then(function() {
	annyang.addCallback('resultNoMatch', function() {
		console.log(arguments);
	});
	return beginSpeechRecognition();
});

var recordingPromise;
function doStart(tab_id) {
	if(!isRecording) {
		currentRecording = {
			name: "My Command",
			vars: { },
			actions: []
		};
		isRecording = true;

		updateIcon();
		recordingTabID = tab_id;

		readContextMenu = chrome.contextMenus.create({
			"title": "Read This",
			"contexts": ["page", "selection", "image", "link"],
			"onclick" : onRead
		});

		recordingPromise = getTab(recordingTabID).then(function(tab) {
			startingURL = tab.url;
		}).then(function() {
			chrome.runtime.sendMessage({action: 'started'});
			chrome.tabs.sendMessage(recordingTabID, { action: 'started' });
		}).then(function() {
			return addMacroRecordingCommands();
		});
	}

	return recordingPromise;
}

function doGetStatus() {
	return {
		isRecording: isRecording
	};
}

function addStartingURL(recording) {
	var needsStartingURL = false;

	if(recording.length === 0) {
		needsStartingURL = true;
	}
}

function doStop() {
	if(isRecording) {
		isRecording = false;

		addStartingURL(currentRecording);

		updateIcon();
		chrome.runtime.sendMessage({action: 'stopped'});
		chrome.contextMenus.remove(readContextMenu);
		removeMacroRecordingCommands();
	}
}

function doGetRecording() {
	return currentRecording.actions;
}

function doGetVariables() {
	return currentRecording.vars;
}

function doGetName() {
	return currentRecording.name;
}

function doSetName(name) {
	currentRecording.name = name;
}

function doAppend(action) {
	action.uid = uid++;
	currentRecording.actions.push(action);
}

function getTab(tab_id) {
	return new Promise(function(resolve, reject) {
		chrome.tabs.get(tab_id, function(tab) {
			resolve(tab);
		});
	});
}

var GREEKLETTERS = ['alpha', 'beta', 'gamma', 'delta',
		'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
		'lamda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho',
		'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];

function addVariable() {
	var j = 0;
	var name;

	outer: while(true) {
		var appendix = (j<1) ? '' : ('_'+j);

		for(var i = 0; i<GREEKLETTERS.length; i++) {
			name = GREEKLETTERS[i] + appendix;

			if(!hasRecordingVar(name)) {
				break outer;
			}
		}
	}
	return setRecordingVar(name, 'value');
}

function getRecordingVar(name) {
	return currentRecording.vars[name];
}

function setRecordingVar(name, value) {
	currentRecording.vars[name] = value;
}

function removeRecordingVar(name) {
	delete currentRecording.vars[name];
}

function setRecordingVarIfUndefined(name, value) {
	if(!hasRecordingVar(name)) {
		setRecordingVar(name, value);
	}
}

function hasRecordingVar(name) {
	return currentRecording.vars.hasOwnProperty(name);
}

function onRead() {
	chrome.tabs.sendMessage(recordingTabID, { action: 'tts_element' });
}

function nameMacro(name) {
	doSetName(name);
	chrome.runtime.sendMessage({action: 'nameMacro', name: name});
}

function clickWhenValue(var_name, value) {
	chrome.tabs.sendMessage(recordingTabID, { action: 'clickWhen', var_name: var_name , value: value});
}

function enterVar(var_name) {
	chrome.tabs.sendMessage(recordingTabID, { action: 'enterVar', var_name: var_name });
}

function setVarValueToSelection(var_name) {
	chrome.tabs.sendMessage(recordingTabID, { action: 'setVarValueToSelection', var_name: var_name });
}

function getSelectedTab() {
	return new Promise(function(resolve, reject) {
		chrome.tabs.getSelected(null, function(tab) {
			resolve(tab);
		});
	});
}

function askForValue(var_name, requestText) {
	if(!requestText) {
		requestText = "What is " + var_name;
	}

	setRecordingVarIfUndefined(var_name, null);
	doAppend(RequestVarValue);
	chrome.runtime.sendMessage({action: 'varChanged'});
}

function changeVarName(fromName, toName) {
	setRecordingVar(toName, getRecordingVar(fromName));
	removeRecordingVar(fromName);
	chrome.runtime.sendMessage({action: 'varChanged'});
}

function setTemporaryValue(var_name, value) {
	setRecordingVar(var_name, value);

	chrome.runtime.sendMessage({action: 'varChanged'});
}
