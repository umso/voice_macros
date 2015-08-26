var currentRecording,
	isRecording = false,
	recordingTabID,
	startingURL,
	uid = 1,
	readContextMenu;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var action = request.action;
	if (action === 'start') {
		doStart(request.tab_id);
	} else if(action === 'get_status') {
		sendResponse(doGetStatus());
	} else if(action === 'stop') {
		doStop();
	} else if(action === 'append') {
		doAppend(request.obj);
	} else if(action === 'get_recording') {
		sendResponse(doGetRecording());
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
			"read this out loud": onRead
			"respond with this": onRead
		});

		annyang.addCallback('resultNoMatch', function() {
			console.log(arguments);
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
				console.log(name);
				nameMacro(name);
			}
		});
	};
	var stopRecording = function() {
		doStop();
	};

	return new Promise(function(resolve, reject) {
		var rv = annyang.addCommands({
			"create (a) (new) macro (called) (named) *name": startRecording,
			"start (a) recording (a) (new) macro (called) (named) *name": startRecording,
			"record (a) macro (called) (named) *name": startRecording,
			"create (a) new macro": startRecording,
			"start (a) recording": startRecording,
			"start recording (a) (new) macro": startRecording,
			"stop (a) (this) recording": stopRecording,
			"stop (this) macro": stopRecording,
			"end (this) macro": stopRecording
		});

		annyang.addCallback('resultNoMatch', function() {
			console.log(arguments);
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
	return beginSpeechRecognition();
});

var recordingPromise;
function doStart(tab_id) {
	if(!isRecording) {
		currentRecording = [];
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
			chrome.runtime.sendMessage({action: 'start'});
			chrome.tabs.sendMessage(recordingTabID, { action: 'start' });
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

	if(needsStartingURL) {
		currentRecording.unshift({

		});
	}
}

function doStop() {
	if(isRecording) {
		isRecording = false;

		addStartingURL(currentRecording);

		updateIcon();
		chrome.runtime.sendMessage({action: 'stop'});
		chrome.contextMenus.remove(readContextMenu);
		removeMacroRecordingCommands();
	}
}

function doGetRecording() {
	return currentRecording;
}

function doAppend(action) {
	action.uid = uid++;
	currentRecording.push(action);
}

function getTab(tab_id) {
	return new Promise(function(resolve, reject) {
		chrome.tabs.get(tab_id, function(tab) {
			resolve(tab);
		});
	});
}

function onRead() {
	chrome.tabs.sendMessage(recordingTabID, { action: 'tts_element' });
}

function nameMacro(name) {
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
