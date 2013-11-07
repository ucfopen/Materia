// add references to the player functions needed by ExternalInterface
var STATIC_URL      = '<?= \Config::get('materia.urls.static')?>';
var WIDGET_URL      = '<?= \Config::get('materia.urls.engines')?>';

$(document).ready(function(){
	Materia.Player.init(API_LINK, "<?= $inst_id ?>", "container");
});