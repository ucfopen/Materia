
export function playerRenderer(model) {

	function playerInit(contentId = '') {
		H5P.preventInit = true

		if (H5PIntegration) {
			// perform a postMessage to the widget to ask for the qset
			// TODO add this url to a config somewhere?
			console.log("ready for qset!")
			window.parent.postMessage({ message: 'ready_for_qset' }, "http://localhost:8118")

			// Adds listener to talk to the widget frame above us
			window.addEventListener("message", receiveMessage, false);

			// postMessage handler for talking to Materia
			function receiveMessage(event)
			{
				let params = event.data.params.params
				H5PIntegration.contents[`cid-${contentId}`].jsonContent = JSON.stringify(params)
				// this actually inits the player when we're ready
				H5P.init(document.getElementById('h5p-player'))
				return event.preventDefault()
			}

			H5P.externalDispatcher.on('xAPI', function(event) {
				console.log("bruh")
				console.log(event)
			})
		}
	}

	var initAsString = new String(playerInit)

	return(`<html>
				<head>
					<meta charset="UTF-8">
					<script>
						window.H5PIntegration = ${JSON.stringify(
							model.integration,
							null,
							2
						)}
					</script>
					${model.scripts
						.map((script) => `<script src="${script}"></script>`)
						.join('\n    ')}
					${model.styles
						.map((style) => `<link rel="stylesheet" href="${style}">`)
						.join('\n    ')}
				</head>
				<body>
					<div class="h5p-content" data-content-id="${model.contentId}">
					</div>
					<script>
						${initAsString}
						playerInit(${model.contentId})
					</script>
				</body>
			</html>`)
}