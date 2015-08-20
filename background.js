var currentRecording,
	isRecording = false,
	recordingTabID,
	startingURL,
	uid = 1;

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

function beginSpeechRecognition() {
	recognition = new webkitSpeechRecognition();
	var promise = new Promise(function(resolve, reject) {
		recognition.addEventListener('result', function(event) {
			console.log('result');
			console.log(event);
			resolve(event);
		});
	});
	recognition.addEventListener('error', function(event) {
		console.log(event);
		if(event.error === 'not-allowed') {
			requestSpeechPermission().then(function(hasPermission) {
				if(hasPermission) {
					console.log('done');
					recognition.start();
				}
			});
		}
	});
	recognition.start();
	console.log('start recognition')
	return promise;
}

function endSpeechRecognition(recognition) {
	recognition.end();
}

function requestSpeechPermission(ready) {
	return new Promise(function(resolve, reject) {
		var requestSpeechWindow = window.open('requestSpeechPermission.html');
		requestSpeechWindow.addEventListener("message", function(e) {
			console.log(e);
			requestSpeechWindow.close();
			resolve(true);
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

		beginSpeechRecognition();
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
