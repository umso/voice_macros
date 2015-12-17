var wasRecording = false;

$(function() {
	if(localStorage.getItem(LSKEY)) {
		doUploadScript();
	} else {
		enterCurrentStatusState();
	}

	$('#createCommand').on('click', requestStart);
	$('#stopRecording').on('click', requestStop);
	$('#cancelRecording').on('click', requestCancel);

	chrome.runtime.onMessage.addListener($.proxy(function(request, sender, sendResponse) {
		var action = request.action;
		if(action === 'stopped') {
			if(request.cancelled) {
				enterIdleState();
			} else {
				doUploadScript();
			}
		} else if(action === 'started') {
			enterRecordingState().then(function() {
				$('#macroName').macroName('startEditing');
			});
		}
	}, this));
});

var LSKEY = 'unuploadedRecording';

function stringifyRecording(rec) {
	var rv = _.extend({}, rec);

	rv.actions = _.map(rec.actions, function(action) {
		var altAction = _.extend({}, action);
		delete altAction.imageURI;
		return altAction;
	});
	return JSON.stringify(rv);
}

function doUploadScript(recording) {
	var currCasperScript;

	return enterUploadingState().then(function() {
		return getRecording();
	}).then(function(info) {
		localStorage.setItem(LSKEY, true);
		return uploadScript(info);
	}).then(function() {
		localStorage.removeItem(LSKEY);
		enterIdleState();
	}, function(err) {
		console.log(err.stack);
		return enterErrorState('Error uploading command', {
			'Retry': function() {
				doUploadScript();
			}, 'Download': function() {
				downloadJSFile(currCasperScript.body, 'casper_script.js');
				//localStorage.removeItem(LSKEY);
				//enterCurrentStatusState();
			}, 'Cancel': function() {
				localStorage.removeItem(LSKEY);
				enterCurrentStatusState();
			}
		});
	});
}

function enterCurrentStatusState() {
	getStatus().then(function(status) {
		if(status.isRecording) {
			enterRecordingState();
		} else {
			enterIdleState();
		}
	});
}

function updateHeight() {
	var cardHeight = 0;
	$('mdl-card').each(function() {
		cardHeight += $(this).height();
	})
	$('body, html').height(cardHeight);
}

function enterRecordingState() {
	return new Promise(function(resolve) {
		wasRecording = true;

		$('#introduction_card').hide();
		$('#actions_card').show();
		$('#uploading_card, #error_card').hide();

		$('#actionDisplay').actionDisplay();

		$('#macroName')	.macroName();
		updateHeight();

		resolve();
	});
}

function enterUploadingState() {
	return new Promise(function(resolve) {
		if(wasRecording) {
			$('#actionDisplay').actionDisplay("destroy");
			$('#macroName').macroName("destroy");
			wasRecording = false;
		}

		$('#introduction_card').hide();
		$('#actions_card').hide();
		$('#uploading_card').show();
		$('#error_card').hide();

		resolve();
	});
}

function enterErrorState(message, actions) {
	return new Promise(function(resolve) {
		$('#introduction_card').hide();
		$('#actions_card').hide();
		$('#uploading_card').hide();

		$("#error_card #errorMessage").text(message);

		$("#error_card").show();

		var errorActions = $('#error_card #errorActions');

		errorActions.children().remove();

		_.each(actions, function(onClick, actionName) {
			$('<a />')	.text(actionName)
						.appendTo(errorActions)
						.on('click', function() {
							onClick.apply(this, arguments);
						})
						.addClass('mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect');
		});

		resolve();
	});
}

function refreshActions() {
	$('#actionDisplay').actionDisplay('refresh');
}

function enterIdleState() {
	return new Promise(function(resolve) {
		if(wasRecording) {
			$('#actionDisplay').actionDisplay("destroy");
			$('#macroName').macroName("destroy");
			wasRecording = false;
		}

		$('#introduction_card').show();
		$('#actions_card').hide();
		$('#uploading_card, #error_card').hide();

		updateHeight();
		resolve();
	});
}