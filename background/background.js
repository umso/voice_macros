chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var action = request.action;

	if (action === 'request_start') {
		doStart(request.tab_id);
		sendResponse(doGetStatus());
	} else if(action === 'request_stop') {
		doStop(request.cancelled);
		sendResponse(doGetStatus());
	} else if(action === 'get_status') {
		sendResponse(doGetStatus());
	} else if(action === 'append') {
		var uid = doAppend(request.obj);
		sendResponse(uid);
	} else if(action === 'get_actions') {
		sendResponse(doGetActions());
	} else if(action === 'get_variables') {
		sendResponse(doGetVariables());
	} else if(action === 'get_name') {
		sendResponse(getName());
	} else if(action === 'get_display_name') {
		sendResponse(doGetSpecifiedName());
	} else if(action === 'get_variable_names') {
		sendResponse(doGetVariableNames());
	} else if(action === 'set_name') {
		nameMacro(request.value);
		sendResponse(getName());
	} else if(action === 'change_var_value') {
		setTemporaryValue(request.name, request.value);
		sendResponse(doGetVariables());
	} else if(action === 'change_var_name') {
		changeVarName(request.from, request.to);
		sendResponse(doGetVariables());
	} else if(action === 'add_var') {
		addVariable();
		sendResponse(doGetVariables());
	} else if(action === 'remove_var') {
		removeRecordingVar(request.name);
		sendResponse(doGetVariables());
	} else if(action === 'get_recording') {
		sendResponse(currentRecording);
	} else if(action === 'attach_image') {
		updateStep({
			uid: request.uid,
			imageURI: request.dataURI
		});
		console.log('attached image');
		sendResponse(currentRecording);
	} else if(action === 'update_step') {
		updateStep(request.step);
		sendResponse(currentRecording);
	}
});
