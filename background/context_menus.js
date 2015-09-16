var contextMenus = {};
var variableContextMenus = {};

function addRecordingContextMenus() {
	_.extend(contextMenus, {
		read: chrome.contextMenus.create({
			"title": "Read This",
			"contexts": ["page", "selection", "image", "link"],
			"onclick" : onRead
		}),
		show: chrome.contextMenus.create({
			"title": "Show This",
			"contexts": ["page", "selection", "image", "link"],
			"onclick" : onShow
		}),
		fillInputs: chrome.contextMenus.create({
			"title": "Ask user to fill",
			"contexts": ["editable"],
			"onclick": requestInput
		}),
		clickOne: chrome.contextMenus.create({
			"title": "Ask user to click",
			"contexts": ["page", "selection", "image", "link"],
			"onclick": requestClick
		})
	});
}
function addVariableContextMenu(varName) {
	var varContextMenus = {
		insert: chrome.contextMenus.create({
			"parentId": contextMenus.insert,
			"title": "Insert " + varName + " here",
			"contexts": ["editable"],
			"onclick" : _.bind(enterVar, this, varName)
		}),
		clickWhen: chrome.contextMenus.create({
			"parentId": contextMenus.clickWhen,
			"title": "Click when " + varName + " is...",
			"contexts": ["page", "selection", "image", "link"],
			"onclick" : _.bind(clickWhenValue, this, varName, undefined)
		}),
		setValue: chrome.contextMenus.create({
			"parentId": contextMenus.setValue,
			"title": "Set " + varName + " to this",
			"contexts": ["page", "selection", "image", "link"],
			"onclick" : _.bind(setVarValueToSelection, this, varName)
		})
	};

	variableContextMenus[varName] = varContextMenus;

	return varContextMenus;
}

function addVariableParents() {
	if(!contextMenus.hasOwnProperty('insert')) {
		contextMenus.insert = chrome.contextMenus.create({
			"title": "Insert Variable",
			"contexts": ["editable"]
		});
	}

	if(!contextMenus.hasOwnProperty('clickWhen')) {
		contextMenus.clickWhen = chrome.contextMenus.create({
			"title": "Click When Variable is...",
			"contexts": ["page", "selection", "image", "link"]
		});
	}

	if(!contextMenus.hasOwnProperty('setValue')) {
		contextMenus.setValue = chrome.contextMenus.create({
			"title": "Set Variable",
			"contexts": ["page", "selection", "image", "link"]
		});
	}
}

function removeVariableParents() {
	_.each(contextMenus, function(contextMenu, key) {
		if(key === 'insert' || key === 'clickWhen' || key === 'setValue') {
			chrome.contextMenus.remove(contextMenu);
			delete contextMenus[key];
		}
	});
}

function removeVariableContextMenu(varName) {
	var contextMenus = variableContextMenus[varName];

	if(contextMenus) {
		_.each(contextMenus, function(contextMenu) {
			chrome.contextMenus.remove(contextMenu);
		});
		delete variableContextMenus[varName];
	}
}

function updateVariableContextMenus(varNames) {
	if(varNames.length > 0) {
		addVariableParents();
	}

	var fulfilledNames = _.extend({}, variableContextMenus);

	_.each(variableContextMenus, function(contextMenus, varName) {
		if(!varNames.hasOwnProperty(varName)) {
			removeVariableContextMenu(varName);
		}
	});

	_.each(varNames, function(varName) {
		if(!variableContextMenus.hasOwnProperty(varName)) {
			addVariableContextMenu(varName);
		}
	});

	if(varNames.length === 0) {
		removeVariableParents();
	}
}
function removeAllVariableContextMenus() {
	updateVariableContextMenus([]);
}
function removeRecordingContextMenus() {
	removeAllVariableContextMenus();

	_.each(contextMenus, function(contextMenu, key) {
		chrome.contextMenus.remove(contextMenu);
		delete contextMenus[key];
	});
}
