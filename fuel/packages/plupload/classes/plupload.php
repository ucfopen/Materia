<?

namespace Plupload;

class Plupload
{
	public static function upload($target_dir = null)
	{
		// Prepare the settings plupload needs 
		\Config::load('plupload', true);

		$res = new \Response();

		// Make sure file is not cached (as it happens for example on iOS devices)
		$res->set_header('Expires', 'Mon, 26 Jul 1997 05:00:00 GMT');
		$res->set_header('Last-Modified', gmdate("D, d M Y H:i:s") . " GMT");
		$res->set_header('Cache-Control', 'no-store, no-cache, must-revalidate');
		// $res->set_header('Cache-Control', 'post-check=0, pre-check=0');
		$res->set_header('Pragma', 'no-cache');

		/* 
		// Support CORS
		$res->set_header('Access-Control-Allow-Origin:', '*');
		// other CORS headers if any...
		if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
			return; // finish preflight CORS requests here
		}
		*/

		// Settings
		@set_time_limit(\Config::get('plupload.time_limit', 5 * 60)); // 5 minutes execution time
		$target_dir         = \Config::get('plupload.targetDirectory', $target_dir);
		$cleanup_target_dir = \Config::get('plupload.cleanTargetDirectory', true);; // Remove old files
		$max_file_age       = \Config::get('plupload.maxFileAge', 5 * 3600); // Temp file age in seconds

		// Create target dir
		if ( ! file_exists($target_dir)) @mkdir($target_dir);

		// Get a file name
		if (isset($_REQUEST["name"])) $file_name = $_REQUEST["name"];
		elseif ( ! empty($_FILES)) $file_name = $_FILES["file"]["name"];
		else $file_name = uniqid("file_");

		$file_path = $target_dir.DS.$file_name;

		// Chunking might be enabled
		$chunk  = isset($_REQUEST["chunk"]) ? intval($_REQUEST["chunk"]) : 0;
		$chunks = isset($_REQUEST["chunks"]) ? intval($_REQUEST["chunks"]) : 0;

		// Remove old temp files	
		if ($cleanup_target_dir)
		{
			if ( ! is_dir($target_dir) || ! $dir = opendir($target_dir))
			{
				$res->body('{"jsonrpc" : "2.0", "error" : {"code": 100, "message": "Failed to open temp directory."}, "id" : "id"}');
			}

			while (($file = readdir($dir)) !== false)
			{
				$tmp_file_path = $target_dir.DS.$file;

				// If temp file is current file proceed to the next
				if ($tmp_file_path == "{$file_path}.part") continue;

				// Remove temp file if it is older than the max age and is not the current file
				if (preg_match('/\.part$/', $file) && (filemtime($tmp_file_path) < time() - $max_file_age))
				{
					@unlink($tmp_file_path);
				}
			}
			closedir($dir);
		}

		// Open temp file
		if (!$out = @fopen("{$file_path}.part", $chunks ? "ab" : "wb"))
		{
			$res->body(static::error(102, "Failed to open output stream."));
		}

		if (!empty($_FILES))
		{
			if ($_FILES["file"]["error"] || !is_uploaded_file($_FILES["file"]["tmp_name"]))
			{
				$res->body(static::error(103, "Failed to move uploaded file."));
			}

			// Read binary input stream and append it to temp file
			if (!$in = @fopen($_FILES["file"]["tmp_name"], "rb"))
			{
				$res->body(static::error(101, "Failed to open input stream."));
			}
		}
		else
		{
			if (!$in = @fopen("php://input", "rb"))
			{
				$res->body(static::error(101, "Failed to open input stream."));
			}
		}

		while ($buff = fread($in, 4096)) fwrite($out, $buff);

		@fclose($out);
		@fclose($in);

		// file is uploaded in parts with multiple posts, initialize var for intermediate responses
		$id = "";
		// Check if file has been uploaded
		if (!$chunks || $chunk == $chunks - 1)
		{
			// Strip the temp .part suffix off 
			rename("{$file_path}.part", $file_path);
			$id = \Event::trigger('media-upload-complete', $file_path, 'array');
			// the return of each listener to this event gets added to this trigger's array
			$id = end($id); 
		}

		// Return Success JSON-RPC response
		$res->body('{"jsonrpc" : "2.0", "result" : null, "id" : "'.$id.'"}');

		return $res;
	}

	protected static function error($code, $msg)
	{
		return '{"jsonrpc" : "2.0", "error" : {"code": '.$code.'101, "message": "'.$msg.'"}, "id" : "id"}';
	}

}

