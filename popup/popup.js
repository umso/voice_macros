$(function(){
	$('button#start_recording').on('click', function() {
		chrome.tabs.getSelected(null, function(tab) {
			console.log('Send Start Message');
			chrome.runtime.sendMessage({action: "start", tab_id: tab.id});
		});
	});
});
