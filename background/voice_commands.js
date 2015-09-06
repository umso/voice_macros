var recordingPromise;

function addMacroRecordingCommands() {
	return new Promise(function(resolve, reject) {
		var rv = annyang.addCommands({
			"Culver's macro *name": nameMacro,
			"name this macro *name": nameMacro,
			"all this macro *name": nameMacro,
			"call this macro *name": nameMacro,
			"call does macro *name": nameMacro,
			"call this mac *name": nameMacro,
			"call this microbe *name": nameMacro,
			"harvest macro *name": nameMacro,

			"Culver's command *name": nameMacro,
			"name this command *name": nameMacro,
			"all this command *name": nameMacro,
			"call this command *name": nameMacro,
			"call does command *name": nameMacro,
			"harvest command *name": nameMacro,

			"(and) when (the) :var is *value_and_action": function(var_name, value_and_action) {
				var clickIndex = Math.max(value_and_action.indexOf('click'),
											value_and_action.indexOf('clip'));
				var value = value_and_action.substring(0, clickIndex).trim();

				if(clickIndex >= 0) {
					clickWhenValue(var_name, value);
				}
			},

			"type (the) :var (here)": enterVar,
			"enter (the) :var (here)": enterVar,


			":var is this": setVarValueToSelection,
			"this is :var": setVarValueToSelection,

			"ask the user for :var": askForValue,
			"ask the user for :var (as) (and) *requestText": askForValue,

			"for now set :var to *value": setTemporaryValue,
			"for now set :var as *value": setTemporaryValue,

			"read this (aloud)": onRead,
			"read this out loud": onRead,
			"respond with this": onRead,
			"read (this) (back) to (the) user": onRead,

		});

		resolve(rv);
	});
}

function removeMacroRecordingCommands() {
	annyang.removeCommands();
	addCoreCommands();
}

function addCoreCommands() {
	var startRecording = function(name) {
		getSelectedTab().then(function(tab) {
			return doStart(tab.id);
		}).then(function() {
			if(name) {
				nameMacro(name);
			}
		});
	};
	var stopRecording = function() {
		doStop();
	};

	return new Promise(function(resolve, reject) {
		var rv = annyang.addCommands({
			"create (a) (new) background (called) (named) *name": startRecording,
			"create (a) (new) macro (called) (named) *name": startRecording,
			"start (a) recording (a) (new) macro (called) (named) *name": startRecording,
			"record (a) (new) macro (called) (named) *name": startRecording,
			"create (a) new macro": startRecording,
			"start (a) recording": startRecording,
			"start recording (a) (new) macro": startRecording,
			"create (a) (new) command (called) (named) *name": startRecording,
			"start (a) recording (a) (new) command (called) (named) *name": startRecording,
			"record (a) (new) command (called) (named) *name": startRecording,
			"create (a) new command": startRecording,
			"start (a) command": startRecording,
			"start recording (a) (new) command": startRecording,

			"stop (a) (this) recording": stopRecording,
			"stop (this) macro": stopRecording,
			"end (this) macro": stopRecording,
			"end (this) recording": stopRecording,
			"stop (this) command": stopRecording,
			"end (this) command": stopRecording,
			"upload (this) command": stopRecording
		});

		resolve(rv);
	});
}

function beginSpeechRecognition(onResult) {
	var onHasPermission = function() {
		annyang.start();
		return true;
	};

	return new Promise(function(resolve, reject) {
		navigator.webkitGetUserMedia({
			audio: true,
		}, function(stream) {
			stream.getAudioTracks().forEach(function(track) {
				track.stop();
			});
			resolve(onHasPermission());
		}, function(event) {
			if(event.error === 'not-allowed') {
				resolve(requestSpeechPermission().then(function(hasPermission) {
					if(hasPermission) {
						return onHasPermission();
					} else {
						throw new Error("Permission Denied by user");
					}
				}));
			} else {
				reject(event);
			}
		});
	});
}

function endSpeechRecognition() {
	annyang.abort();
}

function requestSpeechPermission(ready) {
	return new Promise(function(resolve, reject) {
		var requestSpeechWindow = window.open('requestSpeechPermission.html');
		requestSpeechWindow.addEventListener("message", function(e) {
			if(event.data === "granted") {
				resolve(true);
				requestSpeechWindow.close();
			} else {
				resolve(false);
			}
		});
	});
}

addCoreCommands().then(function() {
	annyang.addCallback('resultNoMatch', function() {
		//console.log(arguments);
	});
	return beginSpeechRecognition();
});
