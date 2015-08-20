navigator.webkitGetUserMedia({
	audio: true,
}, function(stream) {
	stream.getAudioTracks().forEach(function(track) {
		track.stop();
	});
	postMessage('granted', '*');
	// Now you know that you have audio permission. Do whatever you want...
}, function() {
	postMessage('denied', '*');
	// Aw. No permission (or no microphone available).
});
