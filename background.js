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

var recognition;

function addCommands() {
	return new Promise(function(resolve, reject) {
		var rv = annyang.addCommands({
			"testing": function() {
				console.log('did it!');
			}
		});

		resolve(rv);
	});
}

function beginSpeechRecognition(onResult) {
	return new Promise(function(resolve, reject) {
		navigator.webkitGetUserMedia({
			audio: true,
		}, function(stream) {
			stream.getAudioTracks().forEach(function(track) {
				track.stop();
			});
			resolve(annyang.start());
		}, function(event) {
			if(event.error === 'not-allowed') {
				resolve(requestSpeechPermission().then(function(hasPermission) {
					if(hasPermission) {
						return annyang.start();
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

function endSpeechRecognition(recognition) {
	recognition.end();
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

function doStart(tab_id) {
	if(!isRecording) {
		currentRecording = [];
		isRecording = true;

		updateIcon();
		recordingTabID = tab_id;

		getTab(recordingTabID).then(function(tab) {
			startingURL = tab.url;
		}).then(function() {
			chrome.tabs.sendMessage(recordingTabID, { action: 'start' });
		});

		addCommands().then(function() {
			return beginSpeechRecognition();
		});

		readContextMenu = chrome.contextMenus.create({
			"title": "Read This",
			"contexts": ["page", "selection", "image", "link"],
			"onclick" : onRead
		});
	}
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
		chrome.tabs.sendMessage(recordingTabID, { action: 'stop' });
		chrome.contextMenus.remove(readContextMenu);
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

var onRead = function() {
	chrome.tabs.sendMessage(recordingTabID, { action: 'tts_element' });
};
