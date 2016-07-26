<?php
class Test_Api_V1_sub extends \Basetest
{
	protected $publishedInstId;

	public function test_upload_keys_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::upload_keys_get('test.jpg');
		$this->assertEquals('error', $output->type);

		// lambda to call api, apply assertions
		$run_tests = function () {
			$msg = "Expect assoc array as output";
			$output = \Materia\Api_V1::upload_keys_get('test.jpg');
			$this->assertEquals(true, is_array($output), $msg);

			$keys = ["AWSAccessKeyID","policy","signature","file_uri"];

			foreach($keys as $key){
				$msg = "Missing ".$key." in output";
				$key_exists = array_key_exists($key, $output);
				$this->assertEquals(true, $key_exists, $msg);
			}

			$msg = "Signature must be of a certain length";
			$this->assertEquals(28, strlen($output["signature"]), $msg);

			return $output; // for use in sequence with remote_asset_post
		};

		// to test for different users in remote_asset_post
		$output_by_user = array();

		$this->_asStudent();
		$output_by_user['student'] 		= $run_tests();
		$this->_asAuthor();
		$output_by_user['author'] 		= $run_tests();
		$this->_asSu();
		$output_by_user['superuser'] 	= $run_tests();


		return $output_by_user;
	}

	/**
	 * @depends test_upload_keys_get
	 */
	public function test_remote_asset_post($upload_keys_by_user)
	{
		// ======= AS NO ONE ========
		$usable_key = $upload_keys_by_user['student']['file_uri'];
		$output = \Materia\Api_V1::remote_asset_post($usable_key, true);
		$this->assertEquals('error', $output->type);

		// lambda to call api, apply assertions
		$run_tests = function ($file_id)
		{
			$msg = "Should return s3 upload fail code";
			$output = \Materia\Api_V1::remote_asset_post($file_id, false);
			$this->assertEquals(-1, $output, $msg);

			$msg = "Update should fail with non-existent asset";
			$output = \Materia\Api_V1::remote_asset_post('MmBop', false);
			$this->assertEquals(1, $output, $msg);

			$msg = "Should fail if missing file_id";
			$output = \Materia\Api_V1::remote_asset_post(null, true);
			$this->assertEquals(2, $output, $msg);

			$msg = "Should pass with correct key and successful s3 upload";
			$output = \Materia\Api_V1::remote_asset_post($file_id, true);
			$this->assertEquals(0, $output, $msg);
		};

		$get_id = function($file_uri)
		{
			return pathinfo($file_uri)['filename'];
		};

		$this->_asStudent();
		$file_id = $get_id($upload_keys_by_user['student']['file_uri']);
		$run_tests($file_id);

		$this->_asAuthor();
		$file_id = $get_id($upload_keys_by_user['author']['file_uri']);
		$run_tests($file_id);

		$this->_asSu();
		$file_id = $get_id($upload_keys_by_user['superuser']['file_uri']);
		$run_tests($file_id);

	}
}
