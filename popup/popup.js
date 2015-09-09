var wasRecording = false;

$(function() {
	var unuploadedRecording = localStorage.getItem(LSKEY);
	if(unuploadedRecording) {
		var recording;
		try {
			recording = JSON.parse(unuploadedRecording);
		} catch(e) {
			console.error(e);
		}
	}
	if(recording) {
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
		delete altAction.dataURI;
		return altAction;
	})
	return JSON.stringify(rv);
}

function doUploadScript() {
	var currCasperScript;

	return enterUploadingState().then(function() {
		return getRecording();
	}).then(function(info) {
		localStorage.setItem(LSKEY, stringifyRecording(info));
		var dt = new CasperRenderer(info.computedName, info.actions, info.varNames);
		return dt.render();
	}).then(function(casperScript) {
		currCasperScript = casperScript;
		return uploadScript(casperScript);
	}).then(function() {
		localStorage.removeItem(LSKEY);
		enterIdleState();
	}, function(err) {
		return enterErrorState('Error uploading command', {
			'Retry': function() {
				doUploadScript();
			}, 'Download': function() {
				downloadJSFile(currCasperScript.body, 'casper_script.js');
				localStorage.removeItem(LSKEY);
				enterCurrentStatusState();
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
		$('#variables_card, #actions_card').show();
		$('#uploading_card, #error_card').hide();

		$('#actionDisplay').actionDisplay();
		$('#variables_card').variableListDisplay();

		$('#macroName')	.macroName();
		updateHeight();

		resolve();
	});
}

function enterUploadingState() {
	return new Promise(function(resolve) {
		if(wasRecording) {
			$('#actionDisplay').actionDisplay("destroy");
			$('#variables_card').variableListDisplay("destroy");
			$('#macroName').macroName("destroy");
			wasRecording = false;
		}

		$('#introduction_card').hide();
		$('#variables_card, #actions_card').hide();
		$('#uploading_card').show();
		$('#error_card').hide();

		resolve();
	});
}

function enterErrorState(message, actions) {
	return new Promise(function(resolve) {
		$('#introduction_card').hide();
		$('#variables_card, #actions_card').hide();
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
			$('#variables_card').variableListDisplay("destroy");
			$('#macroName').macroName("destroy");
			wasRecording = false;
		}

		$('#introduction_card').show();
		$('#variables_card, #actions_card').hide();
		$('#uploading_card, #error_card').hide();

		updateHeight();
		resolve();
	});
}

function handleTestCompilation() {
	var cmd_str = '{"specifiedName":"my command","vars":{"x":null},"actions":[{"type":0,"url":"http://umich.edu/","width":1044,"height":543,"uid":1},{"type":27,"var_name":"x","request_text":"what is x","uid":2}],"varNames":{},"computedName":"my command"}';
	var info = JSON.parse(cmd_str);
	var dt = new CasperRenderer(info.computedName, info.actions, info.varNames);
	dt.render().then(function(js_file) {
		return uploadScript(js_file);
	});
}

//handleTestCompilation();
