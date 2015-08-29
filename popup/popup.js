var wasRecording = false;

$(function() {
	getStatus().then(function(status) {
		if(status.isRecording) {
			enterRecordingState();
		} else {
			enterIdleState();
		}
	});

	$('#createCommand').on('click', requestStart);
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
		$('#variables_card, #actions_card').show();

		$('#actionDisplay').actionDisplay();
		$('#variables_card').variableListDisplay();
		$('#macroName').macroName();

		updateHeight();

		wasRecording = true;

		resolve();
	});
}
function enterIdleState() {
	return new Promise(function(resolve) {
		if(wasRecording) {
			$('#actionDisplay').actionDisplay("destroy");
			$('#variables_card').variableListDisplay("destroy");
			$('#macroName').macroName("destroy");
		}

		$('#introduction_card').show();
		$('#variables_card, #actions_card').hide();

		updateHeight();
		resolve();
	});
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var action = request.action;
	if(action === 'started') {
		enterRecordingState();
	} else if(action === 'stopped') {
		enterIdleState().then(function() {
			return renderCasper();
		}).then(function(casperScript) {
			//downloadJSFile(casperScript, 'casper_script.js');
		});
	} else if(action === 'append') { // handled by action display
	} else if(action === 'nameMacro') { // handled by macroName
	} else if(action === 'set_name') {
	} else if(action === 'request_start') {
	} else if(action === 'request_stop') {
	} else {
		console.log(action);
	}
});
