function uploadScript(info) {
	return new Promise(function(resolve, reject) {
		console.log(info);
		resolve(info);
	});
}
/*
function uploadScript(scriptInfo) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			url: RUNNER_PROTOCOL + '://' + RUNNER_HOST + ':' + RUNNER_PORT + '/api/v1/uploadCommand',
			method: 'POST',
			data: scriptInfo,
			success: function(response) {
				resolve(response);
			},
			error: function(response) {
				reject(response);
			}
		});
	});
}

*/