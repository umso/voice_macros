var wasRecording = false;

$(function() {
	getStatus().then(function(status) {
		if(status.isRecording) {
			enterRecordingState();
		} else {
			enterIdleState();
		}
	});

	$('#createCommand').on('click', function() {
		return requestStart().then(function() {
			return enterRecordingState();
		});
	});
	$('#stopRecording').on('click', function() {
		return requestStop().then(function() {
			return enterIdleState();
		}).then(function() {
			return renderCasper();
		}).then(function(casperScript) {
			//downloadJSFile(casperScript.body, 'casper_script.js');
			return uploadScript(casperScript);
		});
	});
	$('#cancelRecording').on('click', function() {
		return requestCancel().then(function() {
			return enterIdleState();
		});
	});
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

		$('#macroName').macroName();
		$('#actionDisplay').actionDisplay();
		$('#variables_card').variableListDisplay();

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
			//downloadJSFile(casperScript.body, 'casper_script.js');
			return uploadScript(casperScript);
		});
	}
});
