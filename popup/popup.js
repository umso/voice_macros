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
		return requestStart().then(function(status) {
			return enterRecordingState();
		}).then(function() {
			$('#macroName').macroName('startEditing');
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
		wasRecording = true;

		$('#introduction_card').hide();
		$('#variables_card, #actions_card').show();

		$('#actionDisplay').actionDisplay();
		$('#variables_card').variableListDisplay();

		$('#macroName')	.macroName();
		updateHeight();

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

function handleTestCompilation() {
	var cmd_str = '{"specifiedName":"my command","vars":{"x":null},"actions":[{"type":0,"url":"http://umich.edu/","width":1044,"height":543,"uid":1},{"type":27,"var_name":"x","request_text":"what is x","uid":2}],"varNames":{},"computedName":"my command"}';
	var info = JSON.parse(cmd_str);
	var dt = new CasperRenderer(info.computedName, info.actions, info.varNames);
	dt.render().then(function(js_file) {
		return uploadScript(js_file);
	});
}

//handleTestCompilation();
