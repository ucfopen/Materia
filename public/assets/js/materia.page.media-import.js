var selectedAssets = [];
var data = [];
var dt;
var uploading = false;
var creator;
var _coms;

// LOAD UP THE MEDIA OBJECTS
var loadAllMedia = function()
{
	// clear the table
	selectedAssets = [];
	data = [];

	$('#question-table').dataTable().fnClearTable();
	// determine the types from the url hash string
	var mediaTypes = getHash();
	if(mediaTypes) mediaTypes = mediaTypes.split(',');
	// load
	_coms.send('assets_get', [], function(result){
		if(result && result.msg === undefined && result.length > 0)
		{
			data = result;
			$('#question-table').dataTable().fnClearTable();
			$('#question-table').dataTable().fnAddData(result);
		}
	});
};



var getHash = function()
{
	return window.location.hash.substring(1);
};

// INIT
$(document).ready(function() {
	// click listener for each row
	$(document).on('click', '#question-table tbody tr', function(e) {
		$(".row_selected").toggleClass('row_selected');

		var radio = $(this).find(':radio');
		radio.attr('checked', true);

		var selected = $(this).toggleClass('row_selected').hasClass('row_selected');

		// stop the bubbling to prevent the row's click event
		if (e.target.type == "radio") e.stopPropagation();

		var index = $('#question-table').dataTable().fnGetPosition( this );

		selectedAssets = [data[index]]

	});

	$('#submit-button').click( function(e) {
		e.stopPropagation();
		window.parent.Materia.Creator.onMediaImportComplete(selectedAssets);
		return false;
	} );

	$('#cancel-button').click( function(e) {
		e.stopPropagation();
		window.parent.Materia.Creator.onMediaImportComplete(null);
	} );

	// on resize, re-fit the table size
	$(window).resize(function(){
		$('div.dataTables_scrollBody').height($(window).height() - 150);
		dt.fnAdjustColumnSizing();
	});

	// setup the table

	dt = $('#question-table').dataTable({
		"bPaginate": false, // don't paginate
		"bLengthChange": true, // resize the fields
		"bAutoWidth": false, //
		"bProcessing": true, // show processing dialog
		"sScrollY": "300px",  // setup to be a scrollable table
		"oLanguage": {
			"sSearch" : '',
			"sInfoFiltered": ' / _MAX_',
			"sInfo": "showing: _TOTAL_"
		}, // hide search label
		// columsn to display
		"aoColumns": [
			{ "mDataProp": null  },
			{ "mDataProp": "id" },
			{ "mDataProp": "title" },
			{ "mDataProp": "type" },
			{ "mDataProp": "file_size" },
			{ "mDataProp": "created_at" }
		],
		// special sorting options
		"aaSorting": [[5, "desc"]],
		// item renderers
		"aoColumnDefs": [
			{
				// date render
				"fnRender": function ( oObj, sVal ) {
					var d = new Date(sVal * 1000);
					return (d.getMonth()+1) + '/' + d.getDate() + '/' + d.getFullYear();
				},
				"bUseRendered": false,
				"aTargets": [ 5 ]
			},
			{
				"fnRender": function ( oObj, sVal ) {
					return '<span class="numeric">' + Math.round(sVal/1024) + ' kb</span>' ;
				},
				"bUseRendered": false,
				"aTargets": [ 4 ]
			},
			{
			// select box
				"fnRender": function ( oObj, sVal ) {
					return '<img src="/media/' + sVal + '/thumbnail">';
				},
				"bSearchable": false,
				"bSortable": false,
				"aTargets": [ 1 ]
			},
			{
				// select box
				"fnRender": function ( oObj, sVal ) {
					return '<input type="radio" name="id" >';
				},
				"bSearchable": false,
				"bSortable": false,
				"aTargets": [ 0 ]
			}
		]

	});
	
	// // re-fit the table now
	$('div.dataTables_scrollBody').height($(window).height() - 150);


	_coms = Materia.Coms.Json;
	_coms.setGateway(API_LINK);
	// load the questions
	loadAllMedia();
} );

// Show/Hide the Plupload dialog
function toggleUploader()
{
	var state = $('#upload-cancel-button').text();

	if(state == 'Close')
	{
		$('#upload-cancel-button').text('Upload...');
		$('#modal-cover').fadeOut();
	}
	else
	{
		$('#upload-cancel-button').text('Close');
		$("#uploader").pluploadQueue(
		{
			// General settings
			runtimes : 'html5,flash,html4',
			url : '/media/upload/',
			max_file_size : '60mb',
			chunk_size : '2mb',
			unique_names : false,
			rename : true,
			multiple_queues: true,
			
			// Specify what files to browse for
			filters : [
				{title : "Media files", extensions : "jpeg,jpg,gif,png,flv,mp3"}
			],

			// Flash settings
			flash_swf_url : '/assets/swf/plupload.flash.swf',

			init: {
				StateChanged: function(up) {
					uploading = ( up.state == plupload.STARTED );

					if(uploading) document.title = 'Uploading...';
					else
					{
						document.title = 'Media Catalog | Materia';
						toggleUploader();
						loadAllMedia();
					}
				},

				Error: function(up, args) {
					// Called when a error has occured
				}
			}
		});
		$('#modal-cover').fadeIn();
	}
	$('#uploader-form').slideToggle();
}

// Client side form validation
$('#uploader-form').submit(function(e)
{
	e.preventDefault();
	var uploader = $('#uploader').pluploadQueue();

	// Files in queue upload them first
	if (uploader.files.length > 0)
	{
		// When all files are uploaded submit form
		uploader.bind('StateChanged', function()
		{
			if (uploader.files.length === (uploader.total.uploaded + uploader.total.failed))
			{
				$('form')[0].submit();
			}
		});
		uploader.start();
	}
	else
	{
		alert('You must queue at least one file.');
	}

	return false;
});
