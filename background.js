var currentRecording,
	isRecording = false;

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

function doStart(tab_id) {
	if(!isRecording) {
		currentRecording = [];
		isRecording = true;
		chrome.tabs.sendMessage(tab_id, { action: 'start' });
	}
}

function doGetStatus() {
	return {
		isRecording: isRecording
	};
}

function doStop() {
	isRecording = false;
}

function doGetRecording() {
	return currentRecording;
}

fucntion doAppend(action) {
	currentRecording.push(action);
}
