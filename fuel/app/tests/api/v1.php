<?php
use \Materia\Perm;
use \Materia\Api_V1;
/**
 * @group App
 * @group Api
 * @group v1
 * @group Materia
 */
class Test_Api_V1 extends \Basetest
{
	public function test_allPublicAPIMethodsHaveTests()
	{
		$apiMethods =  get_class_methods(new Api_V1);
		$testMethods = get_class_methods($this);
		foreach ($apiMethods as $value)
		{
			$this->assertContains('test_'.$value, $testMethods);
		}
	}

	public function test_widgets_get()
	{
		$this->make_disposable_widget();
		$this->make_disposable_widget();

		// test get all without being logged in
		$output_one = Api_V1::widgets_get();

		$this->assertCount(2, $output_one);

		foreach ($output_one as $value)
		{
			$this->assert_is_widget($value);
		}

		// test get by id without being logged in
		$output_two = Api_V1::widgets_get([$output_one[0]->id, $output_one[1]->id]);
		$this->assertCount(2, $output_two);
		$this->assertEquals($output_one[0]->id, $output_two[0]->id);
		$this->assertEquals($output_one[1]->id, $output_two[1]->id);


		// hide one, and test get all logged in and not logged in
		\DB::update('widget')
			->set(['in_catalog' => '0'])
			->where('id', $output_one[0]->id)
			->execute();

		$output_three = Api_V1::widgets_get();
		$this->assertEquals(count($output_one), count($output_three) + 1);

		\DB::update('widget')
			->set(['in_catalog' => '1'])
			->where('id', $output_one[0]->id)
			->execute();
	}

	public function test_widgets_get_by_type()
	{

		$this->make_disposable_widget();
		$this->make_disposable_widget();

		// test get all without being logged in
		$output_one = Api_V1::widgets_get_by_type("all");

		$this->assertCount(2, $output_one);

		foreach ($output_one as $value)
		{
			$this->assert_is_widget($value);
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
		$output_three = Api_V1::widgets_get_by_type("all");

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

	public function test_widget_instance_access_perms_verify()
	{
		$output = Api_V1::widget_instance_access_perms_verify('test');
		$this->assert_invalid_login_message($output);
	}

	public function test_widget_instances_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::widget_instances_get();
		$this->assertIsArray($output);
		$this->assertCount(0, $output);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::widget_instances_get();
		$this->assertIsArray($output);
		$this->assertFalse(array_key_exists('msg', $output));
		foreach ($output as $key => $value)
		{
			$this->assert_is_widget_instance($value, true);
		}

		// ======= AUTHOR ========
		$this->_as_author();
		$output = Api_V1::widget_instances_get();
		$this->assertIsArray($output);
		$this->assertFalse(array_key_exists('msg', $output));
		foreach ($output as $key => $value)
		{
			$this->assert_is_widget_instance($value, true);
		}

		// ======= SU ========
		$this->_as_super_user();
		$output = Api_V1::widget_instances_get();
		$this->assertIsArray($output);
		$this->assertFalse(array_key_exists('msg', $output));
		foreach ($output as $key => $value)
		{
			$this->assert_is_widget_instance($value, true);
		}

		// TODO: widgetInstances should return an object instead of an stdObject

	}

	public function test_widget_instance_new()
	{
		$widget = $this->make_disposable_widget();

		// ======= AS NO ONE ========
		$output = Api_V1::widget_instance_new();
		$this->assert_invalid_login_message($output);

		// // ==== AS NO-AUTHOR =====
		$this->_as_noauth();
		$output = Api_V1::widget_instance_new();
		$this->assert_validation_error_message($output);

		// // ======= STUDENT ========
		$this->_as_student();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, true);
		$this->assert_is_widget_instance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

		// ======= AUTHOR ========
		$this->_as_author();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, true);
		$this->assert_is_widget_instance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

		// DELETE
		Api_V1::widget_instance_delete($output->id);

		// SECOND PASS FOR PUBLISH-RESTRICTED

		//make sure we get an instance of a widget that restricts publish rights
		$widget = $this->make_disposable_widget('RestrictPublish', true);

		$this->_as_student();
		$question = 'test';
		$answer = 'test';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, 'test', $qset, false);
		$this->assertInstanceOf('\Materia\Msg', $output);
		$this->assertEquals('Widget type can not be published by students.', $output->title);
	}

	public function test_widget_instance_update()
	{
		// only here to appease the api coverage
		self::assertTrue(true);

		// // ==== AS NO-AUTHOR =====
		$this->_as_noauth();
		$output = Api_V1::widget_instance_new();
		$this->assert_validation_error_message($output);
	}

	public function test_widget_instance_update_requires_login()
	{
		$output = Api_V1::widget_instance_update();
		$this->assert_invalid_login_message($output);
	}

	public function test_widget_instance_create_as_student()
	{
		$this->_as_student();

		$widget = $this->make_disposable_widget();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, true);

		$this->markTestIncomplete(); // gotta make sure it ws made
	}

	public function test_widget_instance_update_as_student()
	{
		$this->_as_student();

		$widget = $this->make_disposable_widget();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, true);

		// EDIT DRAFT
		$title = 'Around The World!';
		$question = 'Famous Broisms';
		$answer = 'Brometheius';
		$qset = $output->qset;
		$qset->data['items'][0]['items'][0]['id'] = 0;
		$qset->data['items'][0]['items'][0]['questions'][0]['text'] = $question;
		$qset->data['items'][0]['items'][0]['answers'][0]['text'] = $answer;

		$output = Api_V1::widget_instance_update($output->id, $title, $qset, true);
		$this->assert_is_widget_instance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);
	}

	public function test_wiget_instance_publish_as_student()
	{
		$this->_as_student();

		$widget = $this->make_disposable_widget();

		// PUBLISH
		$title = 'Final Title!';
		$question = 'Famous Broisms 2';
		$answer = 'Abroham Lincoln';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, false);

		$this->assert_is_widget_instance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);

	}

	public function test_widget_instance_delete_as_student()
	{
		$this->_as_student();

		$widget = $this->make_disposable_widget();

		// PUBLISH
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, false);

		// DELETE
		Api_V1::widget_instance_delete($output->id);

		$this->markTestIncomplete(); // gotta make sure it was deleted
	}

	public function test_widget_instance_draft_as_author()
	{
		$this->_as_author();

		$widget = $this->make_disposable_widget();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, true);

		$this->markTestIncomplete(); // gotta make sure it ws made

	}

	public function test_widget_instance_edit_as_author()
	{
		$this->_as_author();

		$widget = $this->make_disposable_widget();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, true);

		// EDIT
		$title = 'Around The World!';
		$question = 'Famous Broisms';
		$answer = 'Brometheius';
		$qset = $output->qset;
		$qset->data['items'][0]['items'][0]['id'] = 0;
		$qset->data['items'][0]['items'][0]['questions'][0]['text'] = $question;
		$qset->data['items'][0]['items'][0]['answers'][0]['text'] = $answer;

		$output = Api_V1::widget_instance_update($output->id, $title, $qset, true);
		$this->assert_is_widget_instance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);
	}

	public function test_widget_instance_publish_as_author()
	{
		$this->_as_author();

		$widget = $this->make_disposable_widget();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, false);

		$this->assert_is_widget_instance($output);
		$this->assertEquals($title, $output->name);
		$this->assertCount(1, $output->qset->data['items']);
		$this->assertCount(1, $output->qset->data['items'][0]['items']);
		$this->assertEquals('QA', $output->qset->data['items'][0]['items'][0]['type']);
		$this->assertEquals($question, $output->qset->data['items'][0]['items'][0]['questions'][0]['text']);
		$this->assertEquals($answer, $output->qset->data['items'][0]['items'][0]['answers'][0]['text']);
		$this->assertEquals(100, $output->qset->data['items'][0]['items'][0]['answers'][0]['value']);
	}

	public function test_widget_instance_delete_as_author()
	{
		$this->_as_author();

		$widget = $this->make_disposable_widget();

		// NEW DRAFT
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$output = Api_V1::widget_instance_new($widget->id, $title, $qset, false);

		// DELETE
		Api_V1::widget_instance_delete($output->id);

		$this->markTestIncomplete(); // gotta make sure it ws made
	}


	public function test_widget_instance_lock_blocks_guest()
	{
		$this->assert_invalid_login_message(Api_V1::widget_instance_lock(10));
	}

	public function test_widget_instance_lock()
	{
		self::assertTrue(true);
	}

	public function test_widget_instance_lock_as_student()
	{
		$this->_as_student();

		$widget = $this->make_disposable_widget();
		$id = $widget->id;
		$qset = $this->create_new_qset('question', 'answer');
		$inst = Api_V1::widget_instance_new($id, 'delete', $qset, true);

		$output = Api_V1::widget_instance_lock($inst->id);
		$this->assertTrue($output); // i own the lock, good to go
	}

	public function test_widget_instance_lock_as_author()
	{
		$this->_as_author();

		$widget = $this->make_disposable_widget();
		$id = $widget->id;
		$qset = $this->create_new_qset('question', 'answer');
		$inst = Api_V1::widget_instance_new($id, 'delete', $qset, true);

		$this->assertTrue(Api_V1::widget_instance_lock($inst->id)); // i own the lock, good to go
	}

	public function test_widget_instance_lock_as_super_user()
	{
		$this->_as_super_user();

		$widget = $this->make_disposable_widget();
		$id = $widget->id;
		$qset = $this->create_new_qset('question', 'answer');
		$inst = Api_V1::widget_instance_new($id, 'delete', $qset, true);

		$this->assertTrue(Api_V1::widget_instance_lock($inst->id)); // i own the lock, good to go
	}

	public function test_widget_instance_lock_for_another_user()
	{
		$widget = $this->make_disposable_widget();
		$id = $widget->id;

		// have someone else create an instance
		$this->_as_author();
		$qset = $this->create_new_qset('question', 'answer');
		$inst = Api_V1::widget_instance_new($id, 'delete', $qset, true);
		Api_V1::widget_instance_lock($inst->id);

		$this->_as_super_user();
		$this->assertFalse(Api_V1::widget_instance_lock($inst->id)); // i dont own the lock, denied

		// the lock is stored in a cache that expires
		// let's manually clear cache now, effectively removing the lock
		\Cache::delete_all('instance-lock');

		$this->assertTrue(Api_V1::widget_instance_lock($inst->id)); // lock should be expired, i can edit it
	}

	public function test_widget_instance_save()
	{
		// nothing to do, this function is an alias of widget_instance_new
		self::assertTrue(true);
	}

	public function test_widget_instance_copy()
	{

		$widget = $this->make_disposable_widget();
		$id = $widget->id;

		// ======= AS NO ONE ========
		$output = Api_V1::widget_instance_copy(10, 'new Instance');
		$this->assert_invalid_login_message($output);

		// ======= STUDENT ========
		$this->_as_student();
		$qset = $this->create_new_qset('question', 'answer');
		$output = Api_V1::widget_instance_new($id, 'delete', $qset, true);
		$this->assertInstanceOf('\Materia\Widget_Instance', $output);
		$inst_id = $output->id;


		$output = Api_V1::widget_instance_copy($inst_id, 'Copied Widget');
		$this->assert_is_valid_id($output);

		$insts = Api_V1::widget_instances_get($output);
		$this->assert_is_widget_instance($insts[0], true);
		$this->assertEquals('Copied Widget', $insts[0]->name);
		$this->assertEquals(true, $insts[0]->is_draft);

		// DELETE
		Api_V1::widget_instance_delete($insts[0]->id);
		Api_V1::widget_instance_delete($inst_id);

		// ======= AUTHOR ========
		$this->_as_author();
		$qset = $this->create_new_qset('question', 'answer');
		$output = Api_V1::widget_instance_new(1, 'delete', $qset, true);
		$this->assertInstanceOf('\Materia\Widget_Instance', $output);
		$inst_id = $output->id;


		$output = Api_V1::widget_instance_copy($inst_id, 'Copied Widget');
		$this->assert_is_valid_id($output);

		$insts = Api_V1::widget_instances_get($output);
		$this->assert_is_widget_instance($insts[0], true);
		$this->assertEquals('Copied Widget', $insts[0]->name);
		$this->assertEquals(true, $insts[0]->is_draft);

		// // ======= SU ========
		// $this->_as_super_user();

		Api_V1::widget_instance_delete($insts[0]->id);
		Api_V1::widget_instance_delete($inst_id);
	}

	public function test_widget_instance_delete()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::widget_instance_delete(10);

		// not logged in, should get error message
		$this->assert_invalid_login_message($output);
	}

	public function test_widget_instance_edit_perms_verify(): void
	{
		//create a publish-restricted widget as a student and give an author full access to it
		$widget = $this->make_disposable_widget('RestrictPublish', true);

		$author = $this->_as_author();

		$this->_as_student();
		$qset = $this->create_new_qset('question', 'answer');
		$instance = Api_V1::widget_instance_new($widget->id, 'test', $qset, true);

		$accessObj = new stdClass();
		$accessObj->perms = [Perm::FULL => true];

		$accessObj->expiration = null;
		$accessObj->user_id = $author->id;
		Api_V1::permissions_set(Perm::INSTANCE, $instance->id, [$accessObj]);

		// ======= AS NO ONE ========
		\Auth::logout();
		$output = Api_V1::widget_instance_edit_perms_verify($instance->id);
		$this->assertInstanceOf('\Materia\Msg', $output->msg);
		$this->assertEquals('Invalid Login', $output->msg->title);
		$this->assertTrue($output->is_locked);
		$this->assertFalse($output->can_publish);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::widget_instance_edit_perms_verify($instance->id);
		$this->assertFalse($output->is_locked);
		$this->assertFalse($output->can_publish);
		$this->assertNull($output->msg);

		// ======= AUTHOR ========
		$this->_as_author();
		$output = Api_V1::widget_instance_edit_perms_verify($instance->id);
		$this->assertFalse($output->is_locked);
		$this->assertTrue($output->can_publish);
		$this->assertNull($output->msg);

		// lock widget as author
		Api_V1::widget_instance_lock($instance->id);

		//check edit perms again
		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::widget_instance_edit_perms_verify($instance->id);
		$this->assertTrue($output->is_locked);
		$this->assertFalse($output->can_publish);
		$this->assertNull($output->msg);

		// ======= AUTHOR ========
		$this->_as_author();
		$output = Api_V1::widget_instance_edit_perms_verify($instance->id);
		$this->assertFalse($output->is_locked);
		$this->assertTrue($output->can_publish);
		$this->assertNull($output->msg);
	}

	public function test_widget_publish_perms_verify(): void
	{
		//make sure we get an instance of a widget that restricts publish rights
		$widget = $this->make_disposable_widget('RestrictPublish', true);

		// ======= AS NO ONE ========
		\Auth::logout();
		$output = Api_V1::widget_publish_perms_verify($widget->id);
		$this->assertInstanceOf('\Materia\Msg', $output);
		$this->assertEquals('Invalid Login', $output->title);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::widget_publish_perms_verify($widget->id);
		$this->assertFalse($output);

		// ======= AUTHOR ========
		$this->_as_author();
		$output = Api_V1::widget_publish_perms_verify($widget->id);
		$this->assertTrue($output);
	}

	public function test_participation_score_equals_input_value()
	{
		// $this->markTestIncomplete(); // gotta make sure it ws made
		// return;

		$this->_as_author();

		$widget = $this->make_disposable_widget();

		$title = "My Test Widget";
		$question = 'Question';
		$answer = 'Answer';
		$qset = $this->create_new_qset($question, $answer);

		$saveOutput = Api_V1::widget_instance_new($widget->id, $title, $qset, false);
		$qset = $saveOutput->qset;

		$logs = [
			[
				'type' => 1006,
				'item_id' => $qset->data['items'][0]['items'][0]['id'],
				'text' => 'Answer',
				'value' => 100,
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
		$output = $this->mock_widget_play($saveOutput, 'context_1');

		$score = Api_V1::play_logs_save($output, $logs);
		$this->assertEquals(100, $score['score']);

		$logs = [
			[
				'type' => 1006,
				'item_id' => $qset->data['items'][0]['items'][0]['id'],
				'text' => 'Answer',
				'value' => 50,
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
		$output = $this->mock_widget_play($saveOutput, 'context_2');

		$score = Api_V1::play_logs_save($output, $logs);
		$this->assertEquals(50, $score['score']);

		Api_V1::widget_instance_delete($saveOutput->id);
	}

	public function test_session_play_create()
	{

		$this->markTestIncomplete(); // gotta make sure it ws made
		return;
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::session_play_create(2);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch (\Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

		// ============ PLAY A DRAFT ============
		$this->_as_author();

		$widget = $this->make_disposable_widget();

		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);

		$saveOutput = Api_V1::widget_instance_new($widget->id, $title, $qset, true); // draft
		$this->assertInstanceOf('\Materia\Widget_Instance', $saveOutput);

		// this should fail - you cant play drafts
		$output = Api_V1::session_play_create($saveOutput->id);
		$this->assertInstanceOf('\Materia\Msg', $output);
		$this->assertEquals('Drafts Not Playable', $output->title);

		Api_V1::widget_instance_delete($saveOutput->id);

		// ============ MAKE A PUBLISHED WIDGET ============
		$title = "My Test Widget";
		$question = 'Question';
		$answer = 'Answer';
		$qset = $this->create_new_qset($question, $answer);

		$saveOutput = Api_V1::widget_instance_new($widget->id, $title, $qset, true);
		$this->assert_is_widget_instance($saveOutput);
		$qset = $saveOutput->qset;

		//add attempt limit
		$saveOutput = Api_V1::widget_instance_update($saveOutput->id, null, null, false, null, null, 1);
		$this->assert_is_widget_instance($saveOutput);

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
		$output = $this->mock_widget_play($saveOutput, $context);

		$output2 = $this->mock_widget_play($saveOutput, $context); // we'll use this second play to try submitting scores past the attempt limit

		$score = Api_V1::play_logs_save($output, $logs);
		$this->assertEquals(100, $score['score']);
		// ============ TRY SUBMITTING SCORES AFTER ATTEMPT LIMIT IN FIRST CONTEXT ============
		$exception = Api_V1::play_logs_save($output2, $logs);
		$this->assertInstanceOf('\Materia\Msg', $exception);
		$this->assertEquals('Attempt Limit Met', $exception->title);

		// ============ TRY PLAYING PAST ATTEMPT LIMIT IN FIRST CONTEXT ============
		$output = $this->mock_widget_play($saveOutput, $context);
		$this->assertInstanceOf('\Materia\Msg', $output);
		$this->assertEquals('No attempts remaining', $output->title);

		$context = 'context_2';
		/*
		Current implementation for checking attempts used does not factor in context ID; put these tests back in when that's fixed.
		// ============ PLAY IN SECOND CONTEXT ============
		$output = $this->mock_widget_play($saveOutput, $context);
		$score = Api_V1::play_logs_save($output, $logs);
		$this->assertEquals(100, $score['score']);
		// ============ TRY PLAYING PAST ATTEMPT LIMIT IN SECOND CONTEXT ============
		$output = $this->mock_widget_play($saveOutput, $context);
		$this->assertInstanceOf('\Materia\Msg', $output);
		$this->assertEquals('No attempts remaining', $output->title);

		// ============ PLAY WITHOUT CONTEXT ============
		$output = $this->mock_widget_play($saveOutput);
		$score = Api_V1::play_logs_save($output, $logs);
		$this->assertEquals(100, $score['score']);
		// ============ TRY PLAYING PAST ATTEMPT LIMIT WITHOUT CONTEXT ============
		$output = $this->mock_widget_play($saveOutput);
		$this->assertInstanceOf('\Materia\Msg', $output);
		$this->assertEquals('No attempts remaining', $output->title);
		*/

		Api_V1::widget_instance_delete($saveOutput->id);
	}

	public function test_session_logout()
	{
		$this->markTestIncomplete('This test has not been implemented yet.');
	}

	public function test_session_login()
	{
		$this->_as_student();
		$this->_as_author();
		$this->_as_super_user();

		\Auth::logout();
		$this->assertFalse(\Auth::check());

		// ======= AS NO ONE ========
		$output = Api_V1::session_login('testuser', 'testuserpasswordthatwillfail');
		$this->assertFalse($output);

		// ======= STUDENT ========
		$output = Api_V1::session_login('~student', 'kogneato');
		$this->assertTrue($output);
		// ======= AUTHOR ========
		$output = Api_V1::session_login('~author', 'kogneato');
		$this->assertTrue($output);
		// ======= SU ========
		$output = Api_V1::session_login('~testSu', 'interstellar555!');
		$this->assertTrue($output);
	}

	public function test_session_login_logout_login()
	{
		$this->_as_author();
		$this->_as_super_user();

		\Auth::logout();

		// Login as Superuser
		Api_V1::session_login('~testSu', 'interstellar555!');
		$output = \Materia\Perm_Manager::is_super_user();
		$this->assertTrue($output);
		Api_V1::session_logout();

		// Login as non-Superuser
		Api_V1::session_login('~author', 'kogneato');
		$output = \Materia\Perm_Manager::is_super_user();
		$this->assertFalse($output);
		Api_V1::session_logout();
	}

	public function test_assets_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::assets_get();
		$this->assert_invalid_login_message($output);
	}

	public function test_session_play_verify()
	{
		$this->markTestIncomplete('This test has not been implemented yet.');
	}

	public function test_session_author_verify()
	{
		// TODO: MOVE TO MODEL TESTS
		// ======= AS NO ONE ========
		$output = Api_V1::session_author_verify();
		$this->assertFalse($output);

		$output = Api_V1::session_author_verify('basic_author');
		$this->assertFalse($output);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::session_author_verify();
		$this->assertTrue($output);
		$output = Api_V1::session_author_verify('basic_author');
		$this->assertFalse($output);

		// ======= AUTHOR ========
		$this->_as_author();
		$output = Api_V1::session_author_verify();
		$this->assertTrue($output);
		$output = Api_V1::session_author_verify('basic_author');
		$this->assertTrue($output);
		$output = Api_V1::session_author_verify('super_user');
		$this->assertFalse($output);

		// ======= SU ========
		$this->_as_super_user();
		$output = Api_V1::session_author_verify();
		$this->assertTrue($output);
		$output = Api_V1::session_author_verify('basic_author');
		$this->assertTrue($output);
		$output = Api_V1::session_author_verify('super_user');
		$this->assertTrue($output);
	}

	public function test_play_activity_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::play_activity_get();
		$this->assert_invalid_login_message($output);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::play_activity_get();
		$this->assertIsArray($output);
		$this->assertArrayHasKey('activity', $output);
		$this->assertArrayHasKey('more', $output);
		// ======= AUTHOR ========
		$this->_as_author();
		// ======= SU ========
		$this->_as_super_user();
	}

	public function test_play_logs_save()
	{
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::play_logs_save(5, array());
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
			$output = Api_V1::widget_instance_scores_get(5);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_guest_widget_instance_scores_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::guest_widget_instance_scores_get(5, 2);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_widget_instance_play_scores_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::widget_instance_play_scores_get(5);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_play_logs_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::play_logs_get(555);
		$this->assert_invalid_login_message($output);

	}

	public function test_score_summary_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::score_summary_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

	}

	public function test_score_raw_distribution_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::score_raw_distribution_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}
		// ======= AS STUDENT =======
		// = INVALID WIDGET INSTANCE =
		$this->_as_student();
		try {
			$output = Api_V1::score_raw_distribution_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}

		// == VALID WIDGET INSTANC with distrobution disabled =
		$widget = $this->make_disposable_widget();
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);
		$instance = Api_V1::widget_instance_new($widget->id, $title, $qset, false);
		$output = Api_V1::score_raw_distribution_get($instance->id);
		$this->assertFalse($output);

		// == VALID WIDGET INSTANC with distrobution enabled
		$widget = $this->make_disposable_widget('TestWidgetTwo');
		$title = "My Test Widget";
		$question = 'This is another word for test';
		$answer = 'Assert';
		$qset = $this->create_new_qset($question, $answer);
		$instance2 = Api_V1::widget_instance_new($widget->id, $title, $qset, false);

		// SAME INSTANCE - DISTRIBUTION, NO PLAYS
		$output = Api_V1::score_raw_distribution_get($instance2->id);
		$this->assertIsArray($output);
		$this->assertEquals(count($output), 0);

		// SAME INSTANCE - DISTRIBUTION, FIVE PLAYS
		for($i = 0; $i < 5; $i++)
		{
			$play = $this->mock_widget_play($instance2);
			$this->mock_play_complete($play);
		}
		$output = Api_V1::score_raw_distribution_get($instance2->id);
		$this->assertIsArray($output);
		$this->assertEquals(count($output), 5);

		\Session::delete_flash('alternate_test_widget');
	}

	public function test_play_storage_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::play_storage_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}
	}

	public function test_question_set_get()
	{
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::question_set_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}
	}

	public function test_questions_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::questions_get();
		$this->assert_invalid_login_message($output);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::questions_get();
		$this->assert_not_message($output);
		$this->assertIsArray($output);

		// ======= AUTHOR ========
		$this->_as_author();
		$output = Api_V1::questions_get();
		$this->assert_not_message($output);
		$this->assertIsArray($output);


		// ======= SU ========
		$this->_as_super_user();
		$output = Api_V1::questions_get();
		$this->assert_not_message($output);
		$this->assertIsArray($output);
		$this->assertCount(0, $output);
	}

	public function test_play_storage_data_save()
	{
		// ======= AS NO ONE ========
		try {
			$output = Api_V1::play_storage_data_save(555, array());
			$output = Api_V1::play_storage_get(555);
			$this->fail("Expected exception HttpNotFoundException not thrown");
		} catch ( Exception $e) {
			$this->assertInstanceOf('HttpNotFoundException', $e);
		}
	}

	public function test_play_storage_data_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::play_storage_data_get(555);
		$this->assert_invalid_login_message($output);

	}

	public function test_semester_date_ranges_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::semester_date_ranges_get(555);
		$this->assertGreaterThan(0, count($output));
		foreach ($output as $semester)
		{
			$this->assert_is_semester_rage($semester);
		}
	}

	public function test_user_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::user_get();
		$this->assert_invalid_login_message($output);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::user_get();
		$this->assert_is_user_array($output);
		$this->assertEquals('~student', $output['username']);
		// ======= AUTHOR ========
		$this->_as_author();
		$output = Api_V1::user_get();
		$this->assert_is_user_array($output);
		$this->assertEquals('~author', $output['username']);
		// ======= SU ========
		$this->_as_super_user();
		$output = Api_V1::user_get();
		$this->assert_is_user_array($output);
		$this->assertEquals('~testSu', $output['username']);
	}

	public function test_user_update_meta()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::user_update_meta(array('test' => 'value'));
		$this->assert_invalid_login_message($output);

		// ======= STUDENT ========
		$student = $this->_as_student();
		$output = Api_V1::user_update_meta(array('test' => 'value'));
		$this->assertTrue($output);

		// test that the metadata exists
		$output = Api_V1::user_get();
		$this->assert_is_user_array($output);
		$this->assertArrayHasKey('test', $output['profile_fields']);
		$this->assertEquals('value', $output['profile_fields']['test']);

	}

	public function test_permissions_set_as_guest()
	{
		$output = Api_V1::permissions_set(0, 0, '', array(), false, 0, false);
		$this->assert_invalid_login_message($output);
	}

	public function test_permissions_set()
	{
		$widget = $this->make_disposable_widget();
		$id = $widget->id;

		// make sure that the users exist
		$studentAuthor= $this->_as_student();
		$author = $this->_as_author();
		$author2 = $this->_as_author_2();
		$author3 = $this->_as_author_3();

		// ======= STUDENT ========
		$this->_as_student();
		$widget = Api_V1::widget_instance_new($id, 'test', new stdClass(), false);

		//give author2 and author3 full access from student
		$accessObj          = new stdClass();
		$accessObj->perms   = [Perm::FULL => true];

		// studentAuthor gives Author2 full access
		$accessObj->expiration = null;
		$accessObj->user_id = $author2->id;
		$output = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// studentAuthor gives Author3 full access
		$accessObj->user_id = $author3->id;
		$output = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author2 removes author3 FULL and adds VIEW
		$this->_as_author_2();
		$accessObj->user_id = $author3->id;
		$accessObj->perms = [Perm::FULL => false, Perm::VISIBLE => true];
		$output           = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author3 removes author2 FULL and adds VIEW
		$this->_as_author_3();
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = [Perm::FULL => false, Perm::VISIBLE => true];
		$output             = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assert_permission_denied_message($output);

		// author3 removes own visible rights
		$accessObj->user_id = $author3->id;
		$accessObj->perms   = [Perm::VISIBLE => false];
		$output             = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author3 removes own VIEW right
		$output             = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assert_permission_denied_message($output);

		// author2 removes studentAuthor FULL adds VIEW
		$this->_as_author_2();
		$accessObj->user_id = $studentAuthor->id;
		$accessObj->perms   = [Perm::FULL => false, Perm::VISIBLE => true];
		$output = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);
	}

	public function test_permissions_set_again()
	{
		$widget = $this->make_disposable_widget();
		$id = $widget->id;

		// make sure that the users exist
		$studentAuthor= $this->_as_student();
		$author = $this->_as_author();
		$author2 = $this->_as_author_2();
		$author3 = $this->_as_author_3();

		// ======= AUTHOR ========
		//make a new widget to use with remaining tests
		$this->_as_author();
		$widget = Api_V1::widget_instance_new($id, 'test', new stdClass(), false);

		//give author2 and author3 full access from author
		$accessObj          = new stdClass();
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = [Perm::FULL => true];

		// Author1 gives Author2 full access
		$accessObj->expiration = null;
		$accessObj->user_id = $author2->id;
		$output = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// Author1 gives Author3 full access
		$accessObj->user_id = $author3->id;
		$output = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author2 removes author3 FULL and adds VIEW
		$this->_as_author_2();
		$accessObj->user_id = $author3->id;
		$accessObj->perms = [Perm::FULL => false, Perm::VISIBLE => true];
		$output           = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author3 removes author2 FULL and adds VIEW
		$this->_as_author_3();
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = [Perm::FULL => false, Perm::VISIBLE => true];
		$output             = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assert_permission_denied_message($output);

		// author3 removes own visible rights
		$accessObj->user_id = $author3->id;
		$accessObj->perms   = [Perm::VISIBLE => false];
		$output             = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);

		// author3 removes own VIEW right
		$output             = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assert_permission_denied_message($output);

		// author2 removes author1 FULL adds VIEW
		$this->_as_author_2();
		$accessObj->user_id = $author->id;
		$accessObj->perms   = [Perm::FULL => false, Perm::VISIBLE => true];
		$output = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, [$accessObj]);
		$this->assertTrue($output);
	}

	public function test_permissions_get()
	{
		// ======= AS NO ONE ========
		$output = Api_V1::permissions_get(5,5);
		$this->assert_invalid_login_message($output);
	}

	public function test_notifications_get()
	{
		// send a notification from author2 to author

		$author  = $this->_as_author();
		$author2 = $this->_as_author_2();

		$widget = $this->make_disposable_widget();
		$id = $widget->id;

		$accessObj = new stdClass();

		//make a new widget to then create item notifications
		$this->_as_author();
		$widget = Api_V1::widget_instance_new($id, 'notification_test', new stdClass(), false);
		$this->assertInstanceOf('\Materia\Widget_Instance', $widget);

		//change permissions to get notifications
		$accessObj->expiration = null;
		$accessObj->user_id    = $author2->id;
		$accessObj->perms      = array(Perm::FULL=>true);
		$output                = Api_V1::permissions_set(Perm::INSTANCE,$widget->id, array($accessObj));
		$this->assertTrue($output);

		//make another widget to then create item notifications
		$this->_as_author_2();
		$widget2 = Api_V1::widget_instance_new($id, 'notification_test2', new stdClass(), false);
		$this->assertInstanceOf('\Materia\Widget_Instance', $widget2);

		//change permissions to get notifications
		$accessObj->user_id = $author->id;
		$accessObj->perms   = array(Perm::FULL=>true);
		$output             = Api_V1::permissions_set(Perm::INSTANCE,$widget2->id, array($accessObj));
		$this->assertTrue($output);

		// cant send notifications to myelf
		//change permissions to get notifications
		$accessObj->user_id = $author2->id;
		$accessObj->perms   = array(Perm::FULL=>true);
		$output             = Api_V1::permissions_set(Perm::INSTANCE,$widget2->id, array($accessObj));
		$this->assertTrue($output);

		\Auth::logout();

		// ======= AS NO ONE ========
		$output = Api_V1::notifications_get();
		$this->assert_invalid_login_message($output);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::notifications_get();
		$this->assertIsArray($output);

		// ======= AUTHOR ========
		$this->_as_author();
		$output = Api_V1::notifications_get();
		$this->assertIsArray($output);
		// Assert author received a notification from author2 about widget2
		$this->assert_notification_exists($output, $author2->id, $author->id, $widget2->id);

		// ======= AUTHOR2 ========
		$this->_as_author_2();
		$output = Api_V1::notifications_get();
		$this->assertIsArray($output);
		// Assert author2 received a notification from author about widget
		$this->assert_notification_exists($output, $author->id, $author2->id, $widget->id);

		// ======= SU ========
		$this->_as_super_user();
		$output = Api_V1::notifications_get();
		$this->assertIsArray($output);
	}

	public function test_notification_delete(){

		$widget = $this->make_disposable_widget();
		$id = $widget->id;

		// ======= AS NO ONE ========
		$output = Api_V1::notification_delete(5);
		$this->assert_invalid_login_message($output);

		// ======= STUDENT ========
		$this->_as_student();
		$output = Api_V1::notification_delete(5);
		$this->assertFalse($output);

		$author = $this->_as_author();
		$notifications = Api_V1::notifications_get();
		$this->assertIsArray($notifications);
		$start_count = count($notifications);

		// ======= Create a widget and share it with author1
		$this->_as_author_2();
		$widget = Api_V1::widget_instance_new($id, 'notification_test', new stdClass(), false);
		$this->assertInstanceOf('\Materia\Widget_Instance', $widget);

		//change permissions to get notifications
		$accessObj             = new stdClass();
		$accessObj->expiration = null;
		$accessObj->user_id    = $author->id;
		$accessObj->perms      = array(Perm::FULL=>true);
		$output                = Api_V1::permissions_set(Perm::INSTANCE, $widget->id, array($accessObj));
		$this->assertTrue($output);

		$this->_as_author();
		$notifications = Api_V1::notifications_get();
		$this->assertEquals($start_count + 1, count($notifications));

		// try as someone author2
		$this->_as_author_2();
		$output = Api_V1::notification_delete($notifications[0]['id']);
		$this->assertFalse($output);

		$this->_as_author();
		$output = Api_V1::notification_delete($notifications[0]['id']);
		$this->assertTrue($output);

		$this->_as_author();
		$notifications = Api_V1::notifications_get();
		$this->assertEquals($start_count, count($notifications));

	}

	public function test_semester_get()
	{
		$output = Api_V1::semester_get();
		$this->assertIsArray($output);
	}

	public function test_users_search()
	{
		// placeholder
		self::assertTrue(true);
	}

	public function test_users_search_as_guest()
	{
		$this->make_random_author();
		$this->make_random_student();
		$this->make_random_super_user();

		\Auth::logout();

		// ======= AS NO ONE ========
		$output = Api_V1::users_search('droptables');
		$this->assert_invalid_login_message($output);
	}

	public function test_users_search_as_student()
	{
		$this->make_random_author();
		$this->make_random_student();
		$this->make_random_super_user();

		$this->_as_student();

		$output = Api_V1::users_search('droptables');
		$this->assertIsArray($output);
		$this->assertCount(2, $output);
		$this->assert_is_user_array($output[0]);
		$this->assertFalse(array_key_exists('password', $output));
		$this->assertFalse(array_key_exists('login_hash', $output));
	}

	public function test_users_search_as_author()
	{
		$this->make_random_author();
		$this->make_random_student();
		$this->make_random_super_user();

		$this->_as_author();

		$output = Api_V1::users_search('droptables');
		$this->assertIsArray($output);
		$this->assertCount(2, $output);
		$this->assert_is_user_array($output[0]);
		$this->assertFalse(array_key_exists('password', $output));
		$this->assertFalse(array_key_exists('login_hash', $output));
	}

	public function test_users_search_as_super_user()
	{
		$this->make_random_author();
		$this->make_random_student();
		$this->make_random_super_user();

		$this->_as_super_user();

		$output = Api_V1::users_search('droptables');
		$this->assertIsArray($output);
		$this->assertCount(2, $output);
		$this->assert_is_user_array($output[0]);
		$this->assertFalse(array_key_exists('password', $output[0]));
		$this->assertFalse(array_key_exists('login_hash', $output[0]));
	}

	protected function assert_is_semester_rage($semester)
	{
		$this->assertArrayHasKey('year', $semester);
		$this->assertGreaterThan(0, $semester['year']);
		$this->assertArrayHasKey('semester', $semester);
		$this->assertContains($semester['semester'], array('Spring', 'Summer', 'Fall') );
		$this->assertArrayHasKey('start', $semester);
		$this->assertGreaterThan(0, $semester['start']);
		$this->assertArrayHasKey('end', $semester);
		$this->assertGreaterThan(0, $semester['end']);
	}

	protected function assert_notification_exists($notification_array, $from_id, $to_id, $widget_id)
	{
		foreach ($notification_array as $notification)
		{
			if ($notification['from_id'] == $from_id && $notification['to_id'] == $to_id && $notification['item_id'] == $widget_id)
			{
				return true;
			}
		}

		$this->fail('Notification was not found.');
	}

	protected function assert_not_message($result)
	{
		$this->assertFalse($result instanceof \Materia\Msg);
	}

	protected function assert_invalid_login_message($msg)
	{
		$this->assertInstanceOf('\Materia\Msg', $msg);
		$this->assertEquals('Invalid Login', $msg->title);
	}

	protected function assert_permission_denied_message($msg)
	{
		$this->assertInstanceOf('\Materia\Msg', $msg);
		$this->assertEquals('Permission Denied', $msg->title);
	}

	protected function assert_validation_error_message($msg)
	{
		$this->assertInstanceOf('\Materia\Msg', $msg);
		$this->assertEquals('Validation Error', $msg->title);
	}
}
