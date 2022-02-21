export function editorRenderer(model) {
  // TODO conditionally apply when visiting an h5p library - e.g., selectedLibrary != undefined
  // currently obscures the h5p-hub when you need to visit the picker
  // uncomment this if you need to visit the h5p hub - at least for the moment
  model.integration.editor.assets.css.push("/styles/creator.css");

  // TODO override styles from model:
  /*
	styles: [
	'/h5p/core/styles/h5p.css',
	'/h5p/core/styles/h5p-confirmation-dialog.css',
	'/h5p/core/styles/h5p-core-button.css',
	'/h5p/editor/libs/darkroom.css',
	'/h5p/editor/styles/css/h5p-hub-client.css',
	'/h5p/editor/styles/css/fonts.css',
	'/h5p/editor/styles/css/application.css',
	'/h5p/editor/styles/css/libs/zebra_datepicker.min.css'
	],
	*/
  // placeholder to prevent errors at runtime
  var modelParams = "";
  var context = "";

  // this function is defined here to properly allow for syntax highlighting in editors
  // as opposed to being entirely defined within the return string
  // we use some seriously hackish js magic to convert the entire function to a string and insert it into the return string down below
  function rendererInit() {
    // this switch case looks at the URL to determine which editor to load
    // it will have to eventually include every H5P library we want to support
    // TODO see if there's a better way to do this
    // TODO determine if it's possible to use the library string directly instead of a clean name, or transform it into a safe string
    // this URL will be provided by the Materia widget
    window.selectedLibrary = undefined;

    const pattern = /^\/(new|edit){1}\/([A-Za-z0-9\-]+)$/;
    let editTypeMatch = window.location.pathname.match(pattern)[1]; // check if url is "new" or "edit"
    let libraryMatch = window.location.pathname.match(pattern)[2]; // grab library title that follows

    if (libraryMatch) {
      switch (libraryMatch) {
        case "h5p-multichoice":
          window.selectedLibrary = "H5P.MultiChoice 1.14";
          break;
        case "h5p-questionset":
          window.selectedLibrary = "H5P.QuestionSet 1.17";
          break;
        case "h5p-advancedblanks":
          window.selectedLibrary = "H5P.Blanks 1.12";
          break;
        case "h5p-markthewords":
          window.selectedLibrary = "H5P.MarkTheWords 1.9";
          break;
        case "h5p-dragtext":
          window.selectedLibrary = "H5P.DragText 1.8";
          break;
        case "h5p-interactivevideo":
          window.selectedLibrary = "H5P.InteractiveVideo 1.22";
          break;
        default:
          window.selectedLibrary = undefined;
      }
    }

    let materiaPath = "";
    switch (context) {
      case "prod":
      case "dev":
        materiaPath = "https://localhost:8008";
        break;
      case "mwdk":
      default:
        materiaPath = "http://localhost:8118";
        break;
    }

    var ns = H5PEditor;

    (function($) {
      H5PEditor.init = function() {
        H5PEditor.$ = H5P.jQuery;
        H5PEditor.basePath = H5PIntegration.editor.libraryUrl;
        H5PEditor.fileIcon = H5PIntegration.editor.fileIcon;
        H5PEditor.ajaxPath = H5PIntegration.editor.ajaxPath;
        H5PEditor.filesPath = H5PIntegration.editor.filesPath;
        H5PEditor.apiVersion = H5PIntegration.editor.apiVersion;
        H5PEditor.contentLanguage = H5PIntegration.editor.language;

        // Semantics describing what copyright information can be stored for media.
        H5PEditor.copyrightSemantics = H5PIntegration.editor.copyrightSemantics;
        H5PEditor.metadataSemantics = H5PIntegration.editor.metadataSemantics;

        // Required styles and scripts for the editor
        H5PEditor.assets = H5PIntegration.editor.assets;

        // Required for assets
        H5PEditor.baseUrl = "";

        if (H5PIntegration.editor.nodeVersionId !== undefined) {
          H5PEditor.contentId = H5PIntegration.editor.nodeVersionId;
        }

        var h5peditor;
        var $type = $('input[name="action"]');
        var $upload = $(".h5p-upload");
        var $create = $(".h5p-create").hide();
        var $editor = $(".h5p-editor");
        var $library = $('input[name="library"]');
        var $params = $('input[name="parameters"]');
        var library = $library.val();

        $upload.hide();

        if (h5peditor === undefined) {
          // contentId is present in search query (existing content)
          if (editTypeMatch == "edit") {
            window.parent.postMessage(
              { message: "ready_for_qset" },
              materiaPath
            ); // TODO add this url to a config somewhere?
          }
          // no contentId passed in, initialize empty editor
          else if (editTypeMatch == "new") {
            h5peditor = new ns.Editor(
              window.selectedLibrary,
              undefined,
              $editor[0]
            );
            $create.show();
          } else {
            console.error("H5P URL malformed!");
          }
        } else {
          $create.show();
        }

        // this is for uploading H5P content - which we won't support?
        // if ($type.filter(':checked').val() === 'upload') {
        // 	$type.change();
        // } else {
        // 	$type
        // 		.filter('input[value="create"]')
        // 		.attr('checked', true)
        // 		.change();
        // }

        // Adds listener to talk to the widget frame above us
        window.addEventListener("message", receiveMessage, false);

        // postMessage handler for talking to Materia
        function receiveMessage(event) {
          switch (event.data.message) {
            // widget wants to save, send it the params
            case "widget_save":
              handlePublish();
              break;
            // widget has sent params to initialize existing content
            case "params_send":
              h5peditor = new ns.Editor(
                window.selectedLibrary,
                JSON.stringify(event.data.params),
                $editor[0]
              );
              $create.show();
              break;
            default:
              return false;
          }

          return event.preventDefault();
        }

        function handlePublish() {
          var params = h5peditor.getParams();

          if (params.params !== undefined) {
            // Validate mandatory main title. Prevent submitting if that's not set.
            // Deliberately doing it after getParams(), so that any other validation
            // problems are also revealed

            if (!h5peditor.isMainTitleSet()) {
              console.warn("Main title must be set in order to publish!");
              // TODO send postMessage to alert Materia that main title is not set
              // This is in-line with what other widgets do
              return false;
            }

            // Set main library
            $library.val(h5peditor.getLibrary());

            // Set params
            $params.val(JSON.stringify(params));

            window.parent.postMessage(
              {
                message: "save",
                library: h5peditor.getLibrary(),
                params
              },
              materiaPath
            );

            // TODO we should no longer be communicating to the H5P server to save this information
            // $.ajax({
            // 	url: "/new/3", // TODO change this URL
            // 	data: JSON.stringify({
            // 		library: h5peditor.getLibrary(),
            // 		params
            // 	}),
            // 	headers: {
            // 		'Content-Type': 'application/json'
            // 	},
            // 	type: 'POST'
            // }).then((result) => {
            // 	const parsedResult = JSON.parse(result)
            // 	window.parent.postMessage({
            // 		message: 'save',
            // 		contentID: parsedResult.contentId,
            // 		library: h5peditor.getLibrary(),
            // 		params
            // 	}, "http://localhost:8118") // TODO add this url to a config somewhere?
            // });

            return event.preventDefault();
            // TODO - Calculate & set max score
            // $maxscore.val(h5peditor.getMaxScore(params.params));
          }
        }

        // Title label
        var $title = $("#h5p-content-form #title");
        var $label = $title.prev();
        $title
          .focus(function() {
            $label.addClass("screen-reader-text");
          })
          .blur(function() {
            if ($title.val() === "") {
              $label.removeClass("screen-reader-text");
            }
          })
          .focus();

        // Delete confirm
        $(".submitdelete").click(function() {
          return confirm(H5PIntegration.editor.deleteMessage);
        });
      };

      H5PEditor.getAjaxUrl = function(action, parameters) {
        var url = H5PIntegration.editor.ajaxPath + action;

        if (parameters !== undefined) {
          for (var property in parameters) {
            if (parameters.hasOwnProperty(property)) {
              url += "&" + property + "=" + parameters[property];
            }
          }
        }

        // url += window.location.search.replace(/\\?/g, '&');
        return url;
      };

      $(document).ready(H5PEditor.init);
    })(H5P.jQuery);
  }

  // converts the entire function into a string - allows us to inject it as part of the returned page
  // instead of writing js within the returned string directly
  var initAsString = new String(rendererInit);

  // TODO redo all this with something cleaner
  return `<html>
			<head>
				<meta charset="UTF-8">
				<script>
					console.log("There will be several console CORS errors to follow, these are part of the H5PEditor initializing, don't panic")
					window.H5PIntegration = ${JSON.stringify(model.integration, null, 2)}
				</script>
			
				${model.styles
          .map(style => `<link rel="stylesheet" href="${style}">`)
          .join("\n    ")}
				${model.scripts
          .map(script => `<script src="${script}"></script>`)
          .join("\n    ")}
			</head>
			<body>
				<div class="h5p-create">
					<div class="h5p-editor"></div>
				</div>
				<script>
				var modelParams = '${model.urlGenerator.parameters()}'
				var context = '${process.env.ENVIRONMENT}'

				// emit and run the rendererEmit function that was converted into a string
				${initAsString}
				rendererInit()
				</script>
			</body>
		</html>`;
}
