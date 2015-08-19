navigator.webkitGetUserMedia({
	audio: true,
}, function(stream) {
	stream.getAudioTracks().forEach(function(track) {
		track.stop();
	});
	// Now you know that you have audio permission. Do whatever you want...
}, function() {
	// Aw. No permission (or no microphone available).
});
