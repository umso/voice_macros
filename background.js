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
