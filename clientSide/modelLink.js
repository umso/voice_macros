function getStatus() {
	return new Promise(function(resolve) {
		chrome.runtime.sendMessage({action: "get_status"}, function(response) {
			resolve(response);
		});
	});
}

function isRecording() {
	return getStatus().then(function(status) {
		return status.isRecording;
	});
}
