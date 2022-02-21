import { H5PEditor } from "@lumieducation/h5p-server";

export function adminRenderer(model) {
  function rendererInit() {
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

        var $editorElement = $(".h5p-editor");
        var $type = $('input[name="action"]');
        var $upload = $(".h5p-upload");
        var $create = $(".h5p-create").hide();
        var $editor = $(".h5p-editor");
        var $library = $('input[name="library"]');
        var $params = $('input[name="parameters"]');
        var library = $library.val();

        var $goBackElement = $(".go-back-warning").hide();
        $("#go-back").click(function(event) {
          $create.html('<div class="h5p-editor"></div>');

          H5PEditor.init();
          $goBackElement.hide();
          $create.show();
        });

        var h5peditor = new ns.Editor(undefined, undefined, $editorElement[0]);
        $create.show();

        H5P.externalDispatcher.on("editorloaded", function(event) {
          $create.hide();
          $goBackElement.show();
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

        url += window.location.search.replace(/\\?/g, "&");
        return url;
      };

      $(document).ready(H5PEditor.init);
    })(H5P.jQuery);
  }

  var initAsString = new String(rendererInit);

  return `<html>
			<head>
				<meta charset="UTF-8">
				<script>
					window.H5PIntegration = ${JSON.stringify(model.integration, null, 2)}
				</script>
				${model.styles
          .map(style => `<link rel="stylesheet" href="${style}">`)
          .join("\n    ")}
				${model.scripts
          .map(script => `<script src="${script}"></script>`)
          .join("\n    ")}
				
					<style>
						.go-back-warning {
							position: absolute;
							z-index: 1000;
							background: #fff;
							color: #000;
							width: 320px;
							height: 280px;
							left: 50%;
							margin-left: -160px;
							top: 200px;
						}

						#go-back {
							margin-left: auto;
							margin-right: auto;

							background: rgb(43, 123, 196);
							color: #fff;

							border: none;
							padding: 10px 15px;
							border-radius: 5px;
						}

						#go-back:hover {
							background: rgb(121, 184, 242);
						}
					</style>

			</head>
			<body>
				<div class="go-back-warning">
					<p>Sorry! Picking H5P Libraries won't work here. Go back.</p>
					<button id="go-back">OK, Take Me Back</button>
				</div>
				<div class="h5p-create">
					<div class="h5p-editor"></div>
				</div>
				<script>
					${initAsString}
					rendererInit()
				</script>
			</body>
		</html>`;
}
