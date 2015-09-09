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

			"read this (aloud)": onRead,
			"read this out loud": onRead,
			"respond with this": onRead,
			"read (this) (back) to (the) user": onRead,

			"(the) :var_name is (a) variable": function(var_name) {
				setTemporaryValue(var_name, 'value');
			}
		});

		resolve(rv);
	});
}

function addVariableCommands(varNames) {
	return Promise.all(_.map(varNames, addVariableCommand));
}

function addVariableCommand(varName) {
	var doEnterVar = function() { return enterVar(varName); },
		doSetVarValueToSelection = function() { return setVarValueToSelection(varName); },
		doAskForValue = function (requestText) { return askForValue(varName, requestText); },
		doSetTemporaryValue = function(value) { return setTemporaryValue(varName, value); },
		doRenameVariable = function(newName) { return changeVarName(varName, newName); };

	return new Promise(function(resolve, reject) {
		var commands = {};
		commands["(and) when (the) " + varName + " is *value_and_action"] = function(var_name, value_and_action) {
			var clickIndex = Math.max(value_and_action.indexOf('click'),
										value_and_action.indexOf('clip'));
			var value = value_and_action.substring(0, clickIndex).trim();

			if(clickIndex >= 0) {
				clickWhenValue(varName, value);
			}
		};

		commands["type (the) " + varName + " (here)"] =
			commands["enter (the) :var (here)"] = doEnterVar;

		commands[varName + " is this"] =
			commands["this is " + varName] = doSetVarValueToSelection;

		commands["ask the user for " + varName] =
			commands["ask the user for " + varName + " (as) (and) *requestText"] = doAskForValue;

		commands["(no) not " + varName + " (but) :newVarName"] =
			commands["rename " + varName + " (to) :newVarName"] = doRenameVariable;

		commands["(for) (now) set " + varName + " to *value"] =
			commands["pronounce (a) set " + varName + " as *value"] =
			commands["pronounce (a) 8 " + varName + " 2 *value"] =
			commands["(for) (now) set " + varName + " 2 *value"] =
			commands["(for) (now) set " + varName + " - *value"] =
			commands["4 now set " + varName + " - *value"] =
			commands["pnau set " + varName + " to "] =
			commands["(for) (now) set " + varName + " as *value"] = doSetTemporaryValue;

		rv = annyang.addCommands(commands);

		resolve(rv);
	});
}

function removeVariableCommands() {
	annyang.removeCommands();
	return addCoreCommands().then(function() {
		return addMacroRecordingCommands();
	});
}

function updateVariableCommands(varNames) {
	return removeVariableCommands().then(function() {
		return addVariableCommands(varNames);
	});
}

function removeMacroRecordingCommands() {
	annyang.removeCommands();
	return addCoreCommands();
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
	var stopRecording = function() { doStop(); };
	var cancelRecording = function() { doCancel(); };

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
			"create (a) new recording": startRecording,
			"start (a) command": startRecording,
			"start recording (a) (new) command": startRecording,

			"stop (a) (this) recording": stopRecording,
			"end (this) macro": stopRecording,
			"end (this) recording": stopRecording,
			"stop (this) command": stopRecording,
			"end (this) command": stopRecording,
			"upload (this) command": stopRecording,

			"cancel (a) (this) recording": cancelRecording,
			"cancel (a) (this) macro": cancelRecording,
			"cancel (a) (this) command": cancelRecording
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
		console.log(arguments);
	});
	return beginSpeechRecognition();
});
