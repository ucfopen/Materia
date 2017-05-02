<?php
/**
 * @group App
 * @group Api
 * @group Materia
 */
class Test_Api_V1 extends \Basetest
{
	protected $publishedInstId;

	public function test_allPublicAPIMethodsHaveTests()
	{
		$apiMethods =  get_class_methods(new \Materia\Api_V1);
		$testMethods = get_class_methods($this);
		foreach ($apiMethods as $value)
		{
			$this->assertContains('test_'.$value, $testMethods);
		}
	}

	public function test_widgets_get()
	{
		// test get all without being logged in
		$output_one = \Materia\Api_V1::widgets_get();

		$this->assertGreaterThan(0, count($output_one));

		foreach ($output_one as $value)
		{
			$this->assertIsWidget($value);
		}

		// test get by id without being logged in
		$output_two = \Materia\Api_V1::widgets_get([$output_one[0]->id, $output_one[1]->id]);
		$this->assertEquals(2, count($output_two));
		$this->assertEquals($output_one[0]->id, $output_two[0]->id);
		$this->assertEquals($output_one[1]->id, $output_two[1]->id);


		// hide one, and test get all logged in and not logged in
		\DB::update('widget')
			->set(['in_catalog' => '0'])
			->where('id', $output_one[0]->id)
			->execute();

		$output_three = \Materia\Api_V1::widgets_get();
		$this->assertEquals(count($output_one), count($output_three) + 1);

		\DB::update('widget')
			->set(['in_catalog' => '1'])
			->where('id', $output_one[0]->id)
			->execute();
	}

	public function test_widgets_get_by_type()
	{
		// test get all without being logged in
		$output_one = \Materia\Api_V1::widgets_get_by_type("all");

		$this->assertGreaterThan(0, count($output_one));

		foreach ($output_one as $value)
		{
			$this->assertIsWidget($value);
		}

		// hide all, and test get all logged in and not logged in
		foreach ($output_one as $widget)
		{
			\DB::update('widget')
				->set(['in_catalog' => '0'])
				->where('id', $widget->id)
				->execute();
		}

		// request all widgets again
		$output_three = \Materia\Api_V1::widgets_get_by_type("all");

		// ensure count is identical, in_catalog flag should make no difference
		$this->assertEquals(count($output_one), count($output_three));

		// revert flag for all widgets
		foreach ($output_one as $widget)
		{
			\DB::update('widget')
				->set(['in_catalog' => '1'])
				->where('id', $widget->id)
				->execute();
		}
	}

	public function test_widget_instances_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::widget_instances_get();
		$this->assertInternalType('array', $output);
		$this->assertCount(0, $output);

		// ======= STUDENT ========
		$this->_asStudent();
		$output = \Materia\Api_V1::widget_instances_get();
		$this->assertInternalType('array', $output);
		$this->assertFalse(array_key_exists('msg', $output));
		foreach ($output as $key => $value)
		{
			$this->assertIsWidgetInstance($value, true);
		}

		// ======= AUTHOR ========
		$this->_asAuthor();
		$output = \Materia\Api_V1::widget_instances_get();
		$this->assertInternalType('array', $output);
		$this->assertFalse(array_key_exists('msg', $output));
		foreach ($output as $key => $value)
		{
			$this->assertIsWidgetInstance($value, true);
		}

		// ======= SU ========
		$this->_asSu();
		$output = \Materia\Api_V1::widget_instances_get();
		$this->assertInternalType('array', $output);
		$this->assertFalse(array_key_exists('msg', $output));
		foreach ($output as $key => $value)
		{
			$this->assertIsWidgetInstance($value, true);
		}

		// TODO: widgetInstances should return an object instead of an stdObject

	}

	public function test_widget_instance_new()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::widget_instance_new();
		$this->assertInvalidLoginMessage($output);

		// // ======= STUDENT ========
		$this->_asStudent();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$widget_id = 1;
		$qset = $this->create_new_qset($question, $answer);

		$output = \Materia\Api_V1::widget_instance_new($widget_id, $title, $qset, true);
		$this->assertIsWidgetInstance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

		// ======= AUTHOR ========
		$this->_asAuthor();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$widget_id = 1;
		$qset = $this->create_new_qset($question, $answer);

		$output = \Materia\Api_V1::widget_instance_new($widget_id, $title, $qset, true);
		$this->assertIsWidgetInstance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

		// DELETE
		\Materia\Api_V1::widget_instance_delete($output->id);

	}

	public function test_widget_instance_update()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::widget_instance_update();
		$this->assertInvalidLoginMessage($output);

		// // ======= STUDENT ========
		$this->_asStudent();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$widget_id = 1;
		$qset = $this->create_new_qset($question, $answer);

		$output = \Materia\Api_V1::widget_instance_new($widget_id, $title, $qset, true);

		// EDIT
		$title = 'Around The World!';
		$question = 'Famous Broisms';
		$answer = 'Brometheius';
		$qset = $output->qset;
		$qset->data['items'][0]['items'][0]['id'] = 0;
		$qset->data['items'][0]['items'][0]['questions'][0]['text'] = $question;
		$qset->data['items'][0]['items'][0]['answers'][0]['text'] = $answer;

		$output = \Materia\Api_V1::widget_instance_update($output->id, $title, $qset, true);
		$this->assertIsWidgetInstance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

		// PUBLISH
		$title = 'Final Title!';
		$question = 'Famous Broisms 2';
		$answer = 'Abroham Lincoln';
		$qset = $output->qset;
		$qset->data['items'][0]['items'][0]['id'] = 0;
		$qset->data['items'][0]['items'][0]['questions'][0]['text'] = $question;
		$qset->data['items'][0]['items'][0]['answers'][0]['text'] = $answer;

		$output = \Materia\Api_V1::widget_instance_update($output->id, $title, $qset, false);
		$this->assertIsWidgetInstance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

		// DELETE
		\Materia\Api_V1::widget_instance_delete($output->id);

		// ======= AUTHOR ========
		$this->_asAuthor();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$widget_id = 1;
		$qset = $this->create_new_qset($question, $answer);

		$output = \Materia\Api_V1::widget_instance_new($widget_id, $title, $qset, true);

		// EDIT
		$title = 'Around The World!';
		$question = 'Famous Broisms';
		$answer = 'Brometheius';
		$qset = $output->qset;
		$qset->data['items'][0]['items'][0]['id'] = 0;
		$qset->data['items'][0]['items'][0]['questions'][0]['text'] = $question;
		$qset->data['items'][0]['items'][0]['answers'][0]['text'] = $answer;

		$output = \Materia\Api_V1::widget_instance_update($output->id, $title, $qset, true);
		$this->assertIsWidgetInstance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

		// PUBLISH
		$title = 'Final Title!';
		$question = 'Famous Broisms 2';
		$answer = 'Abroham Lincoln';
		$qset = $output->qset;
		$qset->data['items'][0]['items'][0]['id'] = 0;
		$qset->data['items'][0]['items'][0]['questions'][0]['text'] = $question;
		$qset->data['items'][0]['items'][0]['answers'][0]['text'] = $answer;

		$output = \Materia\Api_V1::widget_instance_update($output->id, $title, $qset, false);
		$this->assertIsWidgetInstance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

		// DELETE
		\Materia\Api_V1::widget_instance_delete($output->id);

		// // ======= SU ========

	}


	public function test_widget_instance_lock()
	{
		\Config::set('materia.lock_timeout', 2); // set the timeout to 5 seconds
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::widget_instance_lock(10);
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$qset = $this->create_new_qset('question', 'answer');
		$output = \Materia\Api_V1::widget_instance_new(1, 'delete', $qset, true);
		$this->assertInstanceOf('\Materia\Widget_Instance', $output);
		$inst_id = $output->id;

		$output = \Materia\Api_V1::widget_instance_lock($inst_id);
		$this->assertTrue($output); // i own the lock, good to go
		$this->assertTrue($output); // i own the lock, good to go

		// DELETE
		\Materia\Api_V1::widget_instance_delete($inst_id);

		// ======= AUTHOR ========
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$output = \Materia\Api_V1::widget_instance_new(1, 'delete', $qset, true);
		$this->assertInstanceOf('\Materia\Widget_Instance', $output);
		$inst_id = $output->id;

		$output = \Materia\Api_V1::widget_instance_lock($inst_id);
		$this->assertTrue($output); // i own the lock, good to go
		$this->assertTrue($output); // i own the lock, good to go

		// ======= SU ========
		$this->_asSu();
		$output = \Materia\Api_V1::widget_instance_lock($inst_id);
		$this->assertFalse($output); // i dont own the lock, denied
		sleep(3);
		$output = \Materia\Api_V1::widget_instance_lock($inst_id);
		$this->assertTrue($output); // lock should be expired, i can edit it


		\Materia\Api_V1::widget_instance_delete($inst_id);
	}

	public function test_widget_instance_save()
	{
		// nothing to do, this function is an alias of widget_instance_new
	}

	public function test_widget_instance_copy()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::widget_instance_copy(10, 'new Instance');
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$qset = $this->create_new_qset('question', 'answer');
		$output = \Materia\Api_V1::widget_instance_new(1, 'delete', $qset, true);
		$this->assertInstanceOf('\Materia\Widget_Instance', $output);
		$inst_id = $output->id;


		$output = \Materia\Api_V1::widget_instance_copy($inst_id, 'Copied Widget');
		$this->assertIsValidID($output);

		$insts = \Materia\Api_V1::widget_instances_get($output);
		$this->assertIsWidgetInstance($insts[0], true);
		$this->assertEquals('Copied Widget', $insts[0]->name);
		$this->assertEquals(true, $insts[0]->is_draft);

		// DELETE
		\Materia\Api_V1::widget_instance_delete($insts[0]->id);
		\Materia\Api_V1::widget_instance_delete($inst_id);

		// ======= AUTHOR ========
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$output = \Materia\Api_V1::widget_instance_new(1, 'delete', $qset, true);
		$this->assertInstanceOf('\Materia\Widget_Instance', $output);
		$inst_id = $output->id;


		$output = \Materia\Api_V1::widget_instance_copy($inst_id, 'Copied Widget');
		$this->assertIsValidID($output);

		$insts = \Materia\Api_V1::widget_instances_get($output);
		$this->assertIsWidgetInstance($insts[0], true);
		$this->assertEquals('Copied Widget', $insts[0]->name);
		$this->assertEquals(true, $insts[0]->is_draft);

		// // ======= SU ========
		// $this->_asSu();

		\Materia\Api_V1::widget_instance_delete($insts[0]->id);
		\Materia\Api_V1::widget_instance_delete($inst_id);
	}

	public function test_widget_instance_delete()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::widget_instance_delete(10);

		// not logged in, should get error message
		$this->assertInvalidLoginMessage($output);
	}

	public function test_widget_spotlight_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::widget_spotlight_get();
		$this->assertGreaterThan(0, count($output));
	}

	public function test_session_play_create()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::session_play_create(2);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch (\Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

		// ============ PLAY A DRAFT ============
		$this->_asAuthor();

		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$widget_id = 1;
		$qset = $this->create_new_qset($question, $answer);

		$saveOutput = \Materia\Api_V1::widget_instance_new($widget_id, $title, $qset, true); // draft
		$this->assertInstanceOf('\Materia\Widget_Instance', $saveOutput);

		// this should fail - you cant play drafts
		$output = \Materia\Api_V1::session_play_create($saveOutput->id);
		$this->assertInstanceOf('\RocketDuck\Msg', $output);
		$this->assertEquals('Drafts Not Playable', $output->title);

		\Materia\Api_V1::widget_instance_delete($saveOutput->id);

		// ============ MAKE A PUBLISHED WIDGET ============
		$title = "My Test Widget";
		$question = 'Question';
		$answer = 'Answer';
		$widget_id = 1;
		$qset = $this->create_new_qset($question, $answer);

		$saveOutput = \Materia\Api_V1::widget_instance_new($widget_id, $title, $qset, true);
		$this->assertIsWidgetInstance($saveOutput);
		$qset = $saveOutput->qset;

		//add attempt limit
		$saveOutput = \Materia\Api_V1::widget_instance_update($saveOutput->id, null, null, false, null, null, 1);
		$this->assertIsWidgetInstance($saveOutput);

		$logs = [
			[
				'type' => 1004,
				'item_id' => $qset->data['items'][0]['items'][0]['id'],
				'text' => 'Answer',
				'game_time' => 1
			],
			[
				'type' => 2,
				'item_id' => 0,
				'text' => '',
				'value' => '',
				'game_time' => 1
			]
		];
		$context = 'context_1';

		// ============ PLAY IN FIRST CONTEXT ============
		$output = $this->spoof_widget_play($saveOutput, $context);

		$output2 = $this->spoof_widget_play($saveOutput, $context); // we'll use this second play to try submitting scores past the attempt limit

		$score = \Materia\Api_V1::play_logs_save($output, $logs);
		$this->assertEquals(100, $score['score']);
		// ============ TRY SUBMITTING SCORES AFTER ATTEMPT LIMIT IN FIRST CONTEXT ============
		$exception = \Materia\Api_V1::play_logs_save($output2, $logs);
		$this->assertInstanceOf('\RocketDuck\Msg', $exception);
		$this->assertEquals('Attempt Limit Met', $exception->title);

		// ============ TRY PLAYING PAST ATTEMPT LIMIT IN FIRST CONTEXT ============
		$output = $this->spoof_widget_play($saveOutput, $context);
		$this->assertInstanceOf('\RocketDuck\Msg', $output);
		$this->assertEquals('No attempts remaining', $output->title);

		$context = 'context_2';
		/*
		Current implementation for checking attempts used does not factor in context ID; put these tests back in when that's fixed.
		// ============ PLAY IN SECOND CONTEXT ============
		$output = $this->spoof_widget_play($saveOutput, $context);
		$score = \Materia\Api_V1::play_logs_save($output, $logs);
		$this->assertEquals(100, $score['score']);
		// ============ TRY PLAYING PAST ATTEMPT LIMIT IN SECOND CONTEXT ============
		$output = $this->spoof_widget_play($saveOutput, $context);
		$this->assertInstanceOf('\RocketDuck\Msg', $output);
		$this->assertEquals('No attempts remaining', $output->title);

		// ============ PLAY WITHOUT CONTEXT ============
		$output = $this->spoof_widget_play($saveOutput);
		$score = \Materia\Api_V1::play_logs_save($output, $logs);
		$this->assertEquals(100, $score['score']);
		// ============ TRY PLAYING PAST ATTEMPT LIMIT WITHOUT CONTEXT ============
		$output = $this->spoof_widget_play($saveOutput);
		$this->assertInstanceOf('\RocketDuck\Msg', $output);
		$this->assertEquals('No attempts remaining', $output->title);
		*/

		\Materia\Api_V1::widget_instance_delete($saveOutput->id);
	}

	public function test_session_logout()
	{
		$this->markTestIncomplete('This test has not been implemented yet.');
	}

	public function test_session_login()
	{
		$this->_asStudent();
		$this->_asAuthor();
		$this->_asSu();

		\Auth::logout();
		$this->assertFalse(\Auth::check());

		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::session_login('testuser', 'testuserpasswordthatwillfail');
		$this->assertFalse($output);

		// ======= STUDENT ========
		$output = \Materia\Api_V1::session_login('~student', 'kogneato');
		$this->assertTrue($output);
		// ======= AUTHOR ========
		$output = \Materia\Api_V1::session_login('~author', 'kogneato');
		$this->assertTrue($output);
		// ======= SU ========
		$output = \Materia\Api_V1::session_login('~testSu', 'interstellar555!');
		$this->assertTrue($output);
	}

	public function test_session_login_logout_login()
	{
		$this->_asAuthor();
		$this->_asSu();

		\Auth::logout();

		// Login as Superuser
		\Materia\Api_V1::session_login('~testSu', 'interstellar555!');
		$output = \RocketDuck\Perm_Manager::is_super_user();
		$this->assertTrue($output);
		\Materia\Api_V1::session_logout();

		// Login as non-Superuser
		\Materia\Api_V1::session_login('~author', 'kogneato');
		$output = \RocketDuck\Perm_Manager::is_super_user();
		$this->assertFalse($output);
		\Materia\Api_V1::session_logout();
	}

	public function test_assets_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::assets_get();
		$this->assertInvalidLoginMessage($output);

	}

	public function test_upload_keys_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::upload_keys_get('test.jpg');
		$this->assertEquals('error', $output->type);

		// lambda to call api, apply assertions
		$run_tests = function ($file_name) {
			$validFilename = '/([a-z_\-\s0-9\.]+)+\.\w+\/*$/';
			
			if(!preg_match($validFilename, $file_name))
			{	
				$output = \Materia\Api_V1::upload_keys_get($file_name);
				$msg = "Invalid filenames should return null";
				$this->assertEquals(null, $output, $msg);
				return $output;
			}

			$s3_config = \Config::get('materia.s3_config');
			$output = \Materia\Api_V1::upload_keys_get($file_name);

			$msg = "Expect assoc array as output";
			$this->assertEquals(true, is_array($output), $msg);

			$msg = "Expect assoc array to contain 4 elements.";
			$this->assertEquals(4, sizeof($output), $msg);

			$keys = ["AWSAccessKeyId","policy","signature","file_key"];
			foreach($keys as $key)
			{
				$msg = "Missing ".$key." in output";
				$key_exists = array_key_exists($key, $output);
				$this->assertTrue($key_exists, $msg);
			}

			$msg = "AWSAccessKeyId has been modified";
			$original_aws_key = $s3_config["AWSAccessKeyId"];
			$this->assertEquals(strlen($original_aws_key), strlen($output["AWSAccessKeyId"]), $msg);
			$this->assertEquals(0, strcmp($output["AWSAccessKeyId"], $original_aws_key), $msg);

			$msg = "Signature must be of length 28";
			$this->assertEquals(28, strlen($output["signature"]), $msg);

			return $output; // for use in sequence with upload_success_post
		};

		// to test for different users in upload_success_post
		$output_by_user = array();
		$invalid_filenames = [null, '', false, "test", "jpg", ".jpg", "test."];
		
		$this->_asStudent();
		foreach ($invalid_filenames as $filename)
			$run_tests($filename);
		$output_by_user['student']   = $run_tests("test.jpg");

		$this->_asAuthor();
		foreach ($invalid_filenames as $filename)
			$run_tests($filename);
		$output_by_user['author']   = $run_tests("test.jpg");

		$this->_asSu();
		foreach ($invalid_filenames as $filename)
			$run_tests($filename);
		$output_by_user['superuser']   = $run_tests("test.jpg");
 
		return $output_by_user;
	}

	/**
	 * @depends test_upload_keys_get
	 */
	public function test_upload_success_post($upload_keys_by_user)
	{
		// ======= AS NO ONE ========
		$usable_key = $upload_keys_by_user['student']['file_key'];
		$output = \Materia\Api_V1::upload_success_post($usable_key, true);
		$this->assertEquals('error', $output->type);

		// lambda to call api, apply assertions
		$run_tests = function ($file_id)
		{
			$msg = "Should return update success";
			$output = \Materia\Api_V1::upload_success_post($file_id, false);
			$this->assertTrue($output, $msg);

			$msg = "Update should fail with non-existent asset";
			$output = \Materia\Api_V1::upload_success_post('MmBop', false);
			$this->assertFalse($output, $msg);

			$msg = "Should fail if missing file_id";
			$output = \Materia\Api_V1::upload_success_post(null, true);
			$this->assertFalse($output, $msg);

			$msg = "Should pass with correct key and successful s3 upload";
			$output = \Materia\Api_V1::upload_success_post($file_id, true);
			$this->assertTrue($output, $msg);

			$msg = "Should pass with correct key, failed s3 upload, and error message";
			$output = \Materia\Api_V1::upload_success_post($file_id, false, "Test error");
			$this->assertTrue($output, $msg);
		};

		$get_id = function($file_key)
		{
			return pathinfo($file_key)['filename'];
		};

		$this->_asStudent();
		//Explode extracts the asset_id from the file key: user_id-asset_id.ext
		$file_id = $get_id(explode("-", $upload_keys_by_user['student']['file_key'])[1]);
		$run_tests($file_id);

		$this->_asAuthor();
		$file_id = $get_id(explode("-", $upload_keys_by_user['author']['file_key'])[1]);
		$run_tests($file_id);

		$this->_asSu();
		$file_id = $get_id(explode("-", $upload_keys_by_user['superuser']['file_key'])[1]);
		$run_tests($file_id);

	}

	public function test_session_play_verify()
	{
		$this->markTestIncomplete('This test has not been implemented yet.');
	}

	public function test_session_author_verify()
	{
		// TODO: MOVE TO MODEL TESTS
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::session_author_verify();
		$this->assertFalse($output);

		$output = \Materia\Api_V1::session_author_verify('basic_author');
		$this->assertFalse($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$output = \Materia\Api_V1::session_author_verify();
		$this->assertTrue($output);
		$output = \Materia\Api_V1::session_author_verify('basic_author');
		$this->assertFalse($output);

		// ======= AUTHOR ========
		$this->_asAuthor();
		$output = \Materia\Api_V1::session_author_verify();
		$this->assertTrue($output);
		$output = \Materia\Api_V1::session_author_verify('basic_author');
		$this->assertTrue($output);
		$output = \Materia\Api_V1::session_author_verify('super_user');
		$this->assertFalse($output);

		// ======= SU ========
		$this->_asSu();
		$output = \Materia\Api_V1::session_author_verify();
		$this->assertTrue($output);
		$output = \Materia\Api_V1::session_author_verify('basic_author');
		$this->assertTrue($output);
		$output = \Materia\Api_V1::session_author_verify('super_user');
		$this->assertTrue($output);
	}

	public function test_play_activity_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::play_activity_get();
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$output = \Materia\Api_V1::play_activity_get();
		$this->assertInternalType('array', $output);
		$this->assertArrayHasKey('activity', $output);
		$this->assertArrayHasKey('more', $output);
		// ======= AUTHOR ========
		$this->_asAuthor();
		// ======= SU ========
		$this->_asSu();
	}

	public function test_play_logs_save()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::play_logs_save(5, array());
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}
	}

	public function test_playData_get()
	{
		$this->markTestIncomplete('This test has not been implemented yet.');
	}

	public function test_widget_instance_scores_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::widget_instance_scores_get(5);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_guest_widget_instance_scores_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::guest_widget_instance_scores_get(5, 2);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_widget_instance_play_scores_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::widget_instance_play_scores_get(5);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_play_logs_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::play_logs_get(555);
		$this->assertInvalidLoginMessage($output);

	}

	public function test_score_summary_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::score_summary_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_play_storage_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::play_storage_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}
	}

	public function test_question_set_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::question_set_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_questions_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::questions_get();
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$output = \Materia\Api_V1::questions_get();
		$this->assertNotMessage($output);
		$this->assertInternalType('array', $output);

		// ======= AUTHOR ========
		$this->_asAuthor();
		$output = \Materia\Api_V1::questions_get();
		$this->assertNotMessage($output);
		$this->assertInternalType('array', $output);


		// ======= SU ========
		$this->_asSu();
		$output = \Materia\Api_V1::questions_get();
		$this->assertNotMessage($output);
		$this->assertInternalType('array', $output);
		$this->assertCount(0, $output);
	}

	public function test_play_storage_data_save()
	{
		// ======= AS NO ONE ========
		try {
			$output = \Materia\Api_V1::play_storage_data_save(555, array());
			$output = \Materia\Api_V1::play_storage_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}
	}

	public function test_play_storage_data_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::play_storage_data_get(555);
		$this->assertInvalidLoginMessage($output);

	}

	public function test_semester_date_ranges_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::semester_date_ranges_get(555);
		$this->assertGreaterThan(0, count($output));
		foreach ($output as $semester)
		{
			$this->assertIsSemesterRage($semester);
		}
	}

	public function test_user_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::user_get();
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$output = \Materia\Api_V1::user_get();
		$this->assertIsUserArray($output);
		$this->assertEquals('~student', $output['username']);
		// ======= AUTHOR ========
		$this->_asAuthor();
		$output = \Materia\Api_V1::user_get();
		$this->assertIsUserArray($output);
		$this->assertEquals('~author', $output['username']);
		// ======= SU ========
		$this->_asSu();
		$output = \Materia\Api_V1::user_get();
		$this->assertIsUserArray($output);
		$this->assertEquals('~testSu', $output['username']);
	}

	public function test_user_update_meta()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::user_update_meta(array('test' => 'value'));
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$student = $this->_asStudent();
		$output = \Materia\Api_V1::user_update_meta(array('test' => 'value'));
		$this->assertTrue($output);

		// test that the metadata exists
		$output = \Materia\Api_V1::user_get();
		$this->assertIsUserArray($output);
		$this->assertArrayHasKey('test', $output['profile_fields']);
		$this->assertEquals('value', $output['profile_fields']['test']);

	}

	public function test_permissions_set()
	{
		// make sure that the users exist
		$this->_asStudent();
		$this->_asAuthor2();
		$this->_asAuthor3();
		\Auth::logout();

		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::permissions_set(0, 0, '', array(), false, 0, false);
		$this->assertInvalidLoginMessage($output);

		$this->_asAuthor2();
		$this->_asAuthor3();

		// ======= STUDENT ========
		$this->_asStudent();
		$widget = \Materia\Api_V1::widget_instance_new(1, 'test', new stdClass(), false);
		$this->assertInstanceOf('\Materia\Widget_Instance', $widget);

		//give author2 and author3 full access from author

		$studentAuthor      = \Model_User::query()->where('username', '~student')->get_one();
		$author2            = \Model_User::query()->where('username', '~testAuthor2')->get_one();
		$author3            = \Model_User::query()->where('username', '~testAuthor3')->get_one();
		$accessObj          = new stdClass();
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = [\Materia\Perm::FULL => true];

		// studentAuthor gives Author2 full access
		$accessObj->expiration = null;
		$accessObj->user_id = $author2->id;
		$output = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// studentAuthor gives Author3 full access
		$accessObj->user_id = $author3->id;
		$output = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author2 removes author3 FULL and adds VIEW
		$this->_asAuthor2();
		$accessObj->user_id = $author3->id;
		$accessObj->perms = [\Materia\Perm::FULL => false, \Materia\Perm::VISIBLE => true];
		$output           = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author3 removes author2 FULL and adds VIEW
		$this->_asAuthor3();
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = [\Materia\Perm::FULL => false, \Materia\Perm::VISIBLE => true];
		$output             = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertPermissionDeniedMessage($output);

		// author3 removes own visible rights
		$accessObj->user_id = $author3->id;
		$accessObj->perms   = [\Materia\Perm::VISIBLE => false];
		$output             = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author3 removes own VIEW right
		$output             = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertPermissionDeniedMessage($output);

		// author2 removes studentAuthor FULL adds VIEW
		$this->_asAuthor2();
		$accessObj->user_id = $studentAuthor->id;
		$accessObj->perms   = [\Materia\Perm::FULL => false, \Materia\Perm::VISIBLE => true];
		$output = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// ======= AUTHOR ========
		//make a new widget to use with remaining tests
		$this->_asAuthor();
		$widget = \Materia\Api_V1::widget_instance_new(1, 'test', new stdClass(), false);
		$this->assertInstanceOf('\Materia\Widget_Instance', $widget);

		//give author2 and author3 full access from author

		$author             = \Model_User::query()->where('username', '~author')->get_one();
		$author2            = \Model_User::query()->where('username', '~testAuthor2')->get_one();
		$author3            = \Model_User::query()->where('username', '~testAuthor3')->get_one();
		$accessObj          = new stdClass();
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = [\Materia\Perm::FULL => true];

		// Author1 gives Author2 full access
		$accessObj->expiration = null;
		$accessObj->user_id = $author2->id;
		$output = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// Author1 gives Author3 full access
		$accessObj->user_id = $author3->id;
		$output = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author2 removes author3 FULL and adds VIEW
		$this->_asAuthor2();
		$accessObj->user_id = $author3->id;
		$accessObj->perms = [\Materia\Perm::FULL => false, \Materia\Perm::VISIBLE => true];
		$output           = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author3 removes author2 FULL and adds VIEW
		$this->_asAuthor3();
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = [\Materia\Perm::FULL => false, \Materia\Perm::VISIBLE => true];
		$output             = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertPermissionDeniedMessage($output);

		// author3 removes own visible rights
		$accessObj->user_id = $author3->id;
		$accessObj->perms   = [\Materia\Perm::VISIBLE => false];
		$output             = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author3 removes own VIEW right
		$output             = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertPermissionDeniedMessage($output);

		// author2 removes author1 FULL adds VIEW
		$this->_asAuthor2();
		$accessObj->user_id = $author->id;
		$accessObj->perms   = [\Materia\Perm::FULL => false, \Materia\Perm::VISIBLE => true];
		$output = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);
	}

	public function test_permissions_get()
	{
		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::permissions_get(5,5);
		$this->assertInvalidLoginMessage($output);
	}

	public function test_notifications_get()
	{
		// send a notification from author2 to author

		$author  = $this->_asAuthor();
		$author2 = $this->_asAuthor2();

		$accessObj = new stdClass();

		//make a new widget to then create item notifications
		$this->_asAuthor();
		$widget = \Materia\Api_V1::widget_instance_new(1, 'notification_test', new stdClass(), false);
		$this->assertInstanceOf('\Materia\Widget_Instance', $widget);

		//change permissions to get notifications
		$accessObj->expiration = null;
		$accessObj->user_id    = $author2->id;
		$accessObj->perms      = array(\Materia\Perm::FULL=>true);
		$output                = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE,$widget->id, array($accessObj));
		$this->assertTrue($output);

		//make another widget to then create item notifications
		$this->_asAuthor2();
		$widget2 = \Materia\Api_V1::widget_instance_new(1, 'notification_test2', new stdClass(), false);
		$this->assertInstanceOf('\Materia\Widget_Instance', $widget2);

		//change permissions to get notifications
		$accessObj->user_id = $author->id;
		$accessObj->perms   = array(\Materia\Perm::FULL=>true);
		$output             = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE,$widget2->id, array($accessObj));
		$this->assertTrue($output);

		// cant send notifications to myelf
		//change permissions to get notifications
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = array(\Materia\Perm::FULL=>true);
		$output             = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE,$widget2->id, array($accessObj));
		$this->assertTrue($output);

		\Auth::logout();

		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::notifications_get();
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$output = \Materia\Api_V1::notifications_get();
		$this->assertInternalType('array', $output);

		// ======= AUTHOR ========
		$this->_asAuthor();
		$output = \Materia\Api_V1::notifications_get();
		$this->assertInternalType('array', $output);
		// Assert author received a notification from author2 about widget2
		$this->assertNotificationExists($output, $author2->id, $author->id, $widget2->id);

		// ======= AUTHOR2 ========
		$this->_asAuthor2();
		$output = \Materia\Api_V1::notifications_get();
		$this->assertInternalType('array', $output);
		// Assert author2 received a notification from author about widget
		$this->assertNotificationExists($output, $author->id, $author2->id, $widget->id);

		// ======= SU ========
		$this->_asSu();
		$output = \Materia\Api_V1::notifications_get();
		$this->assertInternalType('array', $output);
	}

	public function test_notification_delete(){

		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::notification_delete(5);
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$output = \Materia\Api_V1::notification_delete(5);
		$this->assertFalse($output);

		$author = $this->_asAuthor();
		$notifications = \Materia\Api_V1::notifications_get();
		$this->assertInternalType('array', $notifications);
		$start_count = count($notifications);

		// ======= Create a widget and share it with author1
		$this->_asAuthor2();
		$widget = \Materia\Api_V1::widget_instance_new(1, 'notification_test', new stdClass(), false);
		$this->assertInstanceOf('\Materia\Widget_Instance', $widget);

		//change permissions to get notifications
		$accessObj             = new stdClass();
		$accessObj->expiration = null;
		$accessObj->user_id    = $author->id;
		$accessObj->perms      = array(\Materia\Perm::FULL=>true);
		$output                = \Materia\Api_V1::permissions_set(\Materia\Perm::INSTANCE, $widget->id, array($accessObj));
		$this->assertTrue($output);

		$this->_asAuthor();
		$notifications = \Materia\Api_V1::notifications_get();
		$this->assertEquals($start_count + 1, count($notifications));

		// try as someone author2
		$this->_asAuthor2();
		$output = \Materia\Api_V1::notification_delete($notifications[0]['id']);
		$this->assertFalse($output);

		$this->_asAuthor();
		$output = \Materia\Api_V1::notification_delete($notifications[0]['id']);
		$this->assertTrue($output);

		$this->_asAuthor();
		$notifications = \Materia\Api_V1::notifications_get();
		$this->assertEquals($start_count, count($notifications));

	}

	public function test_semester_get()
	{
		$output = \Materia\Api_V1::semester_get();
		$this->assertInternalType('array', $output);
	}

	public function test_users_search()
	{
		$this->_asAuthor();
		$this->_asAuthor2();
		$this->_asAuthor3();
		$this->_asStudent();
		\Auth::logout();

		// ======= AS NO ONE ========
		$output = \Materia\Api_V1::users_search('test');
		$this->assertInvalidLoginMessage($output);

		// ======= STUDENT ========
		$this->_asStudent();
		$output = \Materia\Api_V1::users_search('~test');
		$this->assertInternalType('array', $output);
		$this->assertCount(2, $output);
		$this->assertIsUserArray($output[0]);
		$this->assertFalse(array_key_exists('password', $output));
		$this->assertFalse(array_key_exists('login_hash', $output));

		// ======= AUTHOR ========
		$this->_asAuthor();
		$output = \Materia\Api_V1::users_search('~testAuthor2');
		$this->assertInternalType('array', $output);
		$this->assertCount(1, $output);
		$this->assertIsUserArray($output[0]);
		$this->assertFalse(array_key_exists('password', $output));
		$this->assertFalse(array_key_exists('login_hash', $output));

		$output = \Materia\Api_V1::users_search('~student');
		$this->assertInternalType('array', $output);
		$this->assertCount(1, $output);
		$this->assertFalse(array_key_exists('password', $output));
		$this->assertFalse(array_key_exists('login_hash', $output));

		// ======= SU ========
		$this->_asSu();
		$output = \Materia\Api_V1::users_search('~');
		$this->assertInternalType('array', $output);
		$this->assertCount(4, $output);
		$this->assertIsUserArray($output[0]);
		$this->assertFalse(array_key_exists('password', $output[0]));
		$this->assertFalse(array_key_exists('login_hash', $output[0]));
	}
}
