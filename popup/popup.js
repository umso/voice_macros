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
		postStop().then(function() {
			return renderCasper();
		}).then(function(casperScript) {
			//downloadJSFile(casperScript, 'casper_script.js');
		});
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
	$('#introduction_card').hide();
	$('#recording_card, #actions_card').show();
	updateHeight();
}
function enterIdleState() {
	$('#introduction_card').show();
	$('#recording_card, #actions_card').hide();
	updateHeight();
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var action = request.action;
	if(action === 'start') {
		enterRecordingState();
	} else if(action === 'stop') {
		enterIdleState();
	} else if(action === 'append') {
		$('#actionDisplay').actionDisplay('refresh');
	}
});
