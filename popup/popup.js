$(function() {
	getStatus().then(function(status) {
		if(status.isRecording) {
			enterRecordingState();
		} else {
			enterIdleState();
		}
	});

	$('#createCommand').on('click', function() {
		postStart();
	});

	$('#stop_recording').on('click', function() {
		postStop();
	});

	$('#actionDisplay').actionDisplay();
});

function updateHeight() {
	var cardHeight = 0;
	$('mdl-card').each(function() {
		cardHeight += $(this).height();
	})
	$('body, html').height(cardHeight);
}

function enterRecordingState() {
	return new Promise(function(resolve) {
		$('#introduction_card').hide();
		$('#recording_card, #actions_card').show();
		updateHeight();
		resolve();
	});
}
function enterIdleState() {
	return new Promise(function(resolve) {
		$('#introduction_card').show();
		$('#recording_card, #actions_card').hide();
		updateHeight();
		resolve();
	});
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var action = request.action;
	if(action === 'start') {
		enterRecordingState();
	} else if(action === 'stop') {
		enterIdleState().then(function() {
			return renderCasper();
		}).then(function(casperScript) {
			//downloadJSFile(casperScript, 'casper_script.js');
		});
	} else if(action === 'append') {
		$('#actionDisplay').actionDisplay('refresh');
	} else {
		console.log(action);
	}
});
