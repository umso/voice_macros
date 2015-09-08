var currentRecording,
	isRecording = false,
	recordingTabID,
	uid = 1,
	readContextMenu;

var TMP_VAR_PREFIX = '_VAR_'
	TMP_VAR_POSTFIX = '_VAR_',
	VAR_PREFIX = '$',
	VAR_POSTFIX = '';

function updateComputedNameAndVars() {
	var name = doGetSpecifiedName(),
		vars = doGetVariables(),
		varNames = Object.keys(vars);
	var varIndicies = {};

	varNames.forEach(function(varName) {
		var regex = new RegExp('(^|\\s)' + preg_quote(varName) + '($|\\s)', 'gi'),
			newVarName = ' ' + TMP_VAR_PREFIX + varName + TMP_VAR_POSTFIX + ' ';

		name = name.replace(regex, newVarName);
	});

	varNames.forEach(function(varName) {
		var newVarName = ' ' + TMP_VAR_PREFIX + varName + TMP_VAR_POSTFIX + ' ';
		varIndicies[varName] = name.indexOf(newVarName);
	});

	varNames = varNames.sort(function(a, b) {
		return varIndicies[a] - varIndicies[b];
	});

	var counter = 1;
	var varKeys = {};
	varNames.forEach(function(varName) {
		var varIndex = varIndicies[varName];
		if(varIndex >= 0) {
			var tmpVarName = TMP_VAR_PREFIX + varName + TMP_VAR_PREFIX,
				newVarName = VAR_PREFIX + counter + VAR_POSTFIX;

			name = replaceAll(name, tmpVarName, newVarName);

			varKeys[newVarName] = varName;

			counter++;
		}
	});

	name = name.trim();

	if(currentRecording) {
		currentRecording.computedName = name;
		currentRecording.varNames = varKeys;
	}
}

function escapeRegExp(string) {
	return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

function replaceAll(string, find, replace) {
	return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function preg_quote(str) {
	// http://kevin.vanzonneveld.net
	// +   original by: booeyOH
	// +   improved by: Ates Goral (http://magnetiq.com)
	// +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// +   bugfixed by: Onno Marsman
	// *     example 1: preg_quote("$40");
	// *     returns 1: '\$40'
	// *     example 2: preg_quote("*RRRING* Hello?");
	// *     returns 2: '\*RRRING\* Hello\?'
	// *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
	// *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'

	return (str+'').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
}

function doGetStatus() {
	return {
		isRecording: isRecording
	};
}

function addStartingURL(recording) {
	var needsStartingURL = false;

	if(recording.length === 0) {
		needsStartingURL = true;
	}
}

function doStart(tab_id) {
	if(!isRecording) {
		currentRecording = {
			specifiedName: "my command",
			vars: { },
			actions: [],
			varNames: false,
			computedName: false
		};
		isRecording = true;
		updateComputedNameAndVars();

		updateIcon();
		recordingTabID = tab_id;

		readContextMenu = chrome.contextMenus.create({
			"title": "Read This",
			"contexts": ["page", "selection", "image", "link"],
			"onclick" : onRead
		});

		recordingPromise = getTab(recordingTabID).then(function(tab) {
			startingURL = tab.url;
		}).then(function() {
			chrome.runtime.sendMessage({action: 'started'});
			chrome.tabs.sendMessage(recordingTabID, { action: 'started' });
		}).then(function() {
			return addMacroRecordingCommands();
		});
	}

	return recordingPromise;
}

function doStop() {
	if(isRecording) {
		isRecording = false;

		addStartingURL(currentRecording);

		updateIcon();
		chrome.runtime.sendMessage({action: 'stopped'});
		chrome.contextMenus.remove(readContextMenu);
		removeMacroRecordingCommands();
	}
}

function updateStep(step) {
	var actions = doGetActions();
	actions.forEach(function(action) {
		if(action.uid === step.uid) {
			
		}
	});
}

function doGetVariables() { return currentRecording.vars; }
function doGetActions() { return currentRecording.actions; }
function doGetSpecifiedName() { return currentRecording.specifiedName; }
function doGetComputedName() { return currentRecording.computedName; }
function doGetVariableNames() { return currentRecording.varNames; }

function getName() {
	return {
		name: doGetComputedName(),
		varNames: doGetVariableNames()
	};
}

function doSetName(name) {
	currentRecording.specifiedName = processScriptName(name);
	updateComputedNameAndVars();
}

function doAppend(action) {
	action.uid = uid++;
	currentRecording.actions.push(action);
}

function getTab(tab_id) {
	return new Promise(function(resolve, reject) {
		chrome.tabs.get(tab_id, function(tab) {
			resolve(tab);
		});
	});
}

var GREEKLETTERS = ['alpha', 'beta', 'gamma', 'delta',
		'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
		'lamda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho',
		'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];

function addVariable() {
	var j = 0;
	var name;

	outer: while(true) {
		var appendix = (j<1) ? '' : ('_'+j);

		for(var i = 0; i<GREEKLETTERS.length; i++) {
			name = GREEKLETTERS[i] + appendix;

			if(!hasRecordingVar(name)) {
				break outer;
			}
		}
	}
	return setRecordingVar(name, 'value');
}

function getRecordingVar(name) {
	return currentRecording.vars[name];
}

function setRecordingVar(name, value) {
	currentRecording.vars[processVariableName(name)] = value;
	updateComputedNameAndVars();
}

function removeRecordingVar(name, avoid_notify) {
	delete currentRecording.vars[processVariableName(name)];
	updateComputedNameAndVars();
	if(!avoid_notify) {
		notifyVarChanged();
	}
}

function setRecordingVarIfUndefined(name, value) {
	if(!hasRecordingVar(name)) {
		setRecordingVar(name, value);
	}
}

function hasRecordingVar(name) {
	return currentRecording.vars.hasOwnProperty(processVariableName(name));
}

function onRead() {
	chrome.tabs.sendMessage(recordingTabID, { action: 'tts_element' });
}

function nameMacro(name) {
	doSetName(name);
	chrome.runtime.sendMessage({action: 'nameMacro', name: name});
}

function clickWhenValue(var_name, value) {
	chrome.tabs.sendMessage(recordingTabID, { action: 'clickWhen', var_name: var_name , value: value});
}

function enterVar(var_name) {
	chrome.tabs.sendMessage(recordingTabID, { action: 'enterVar', var_name: var_name });
}

function setVarValueToSelection(var_name) {
	chrome.tabs.sendMessage(recordingTabID, { action: 'setVarValueToSelection', var_name: var_name });
}

function getSelectedTab() {
	return new Promise(function(resolve, reject) {
		chrome.tabs.getSelected(null, function(tab) {
			resolve(tab);
		});
	});
}

function askForValue(var_name, requestText) {
	if(!requestText) {
		requestText = "What is " + var_name;
	}

	setRecordingVarIfUndefined(var_name, null);
	doAppend({
		type: VOICE_COMMANDER_EVENT_CODE.RequestVarValue,
		var_name: var_name,
		request_text: requestText
	});
	notifyVarChanged();
}

function changeVarName(fromName, toName) {
	setRecordingVar(toName, getRecordingVar(fromName));
	removeRecordingVar(fromName, true);
	notifyVarChanged();
}

function setTemporaryValue(var_name, value) {
	setRecordingVar(var_name, value);
	notifyVarChanged();
}

function processVariableName(var_name) { return var_name.trim().toLowerCase(); }
function processScriptName(script_name) { return script_name.trim().toLowerCase(); }
function notifyVarChanged() {
	chrome.runtime.sendMessage({
		action: 'varChanged'
	});
}
