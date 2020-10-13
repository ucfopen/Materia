<?php

use \Materia\Widget_Installer;

class Basetest extends TestCase
{

	// array of users created by test helpers that will be cleaned up by tearDown()
	protected $users_to_clean = [];
	protected $tables_to_truncate = [
		'asset',
		'log',
		'log_activity',
		'log_storage',
		'lti',
		'map_asset_to_object',
		'map_question_to_qset',
		'notification',
		'perm_object_to_user',
		'perm_role_to_user',
		'question',
		'user_extra_attempts',
		'widget',
		'widget_instance',
		'widget_metadata',
		'widget_qset'
	];

	// Runs before every single test
	// @codingStandardsIgnoreLine
	protected function setUp(): void
	{
		Config::set('errors.throttle', 5000);
		$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
		static::clear_fuel_input();
	}

	// @codingStandardsIgnoreLine
	protected function tearDown(): void
	{
		\Auth::logout();
		if (is_array($this->users_to_clean))
		{
			foreach ($this->users_to_clean as $user)
			{
				$user->delete();
			}
		}
		$this->users_to_clean = [];

		foreach ($this->tables_to_truncate as $value)
		{
			\DB::query("Truncate {$value}")->execute();
		}
	}

	protected static function clear_fuel_input()
	{
		// reset fuelphp's input class
		$class = new ReflectionClass('\Fuel\Core\Input');
		$property = $class->getProperty('instance');
		$property->setAccessible(true);
		$property->setValue($class, null);
	}

	protected function create_new_qset($question_text, $answer_text, $version=0)
	{
		$qset = (object) ['version' => '1', 'data' => null];

		switch ($version)
		{
			case 0:
			default:
				$qset->data = json_decode('{"items":[{"items":[{"name":null,"type":"QA","assets":null,"answers":[{"text":"'.$answer_text.'","options":{},"value":"100"}],"questions":[{"text":"'.$question_text.'","options":{},"value":""}],"options":{},"id":0}],"name":"","options":{},"assets":[],"rand":false}],"name":"","options":{"partial":false,"attempts":5},"assets":[],"rand":false}');
				break;

			case 1:
				$qset->data = json_decode('{"items":[{"items":[{"name":null,"type":"QA","assets":null,"answers":[{"text":"'.$answer_text.'","options":{},"value":"100"}],"questions":[{"text":"'.$question_text.'","options":{},"value":""}],"options":{},"id":0}],"name":"","options":{},"assets":[],"rand":false}],"name":"","options":{"partial":false,"attempts":5},"assets":[],"rand":false}');
				break;
		}

		return $qset;
	}

	protected function _find_widget_id($search)
	{
		return \Materia\Widget_Manager::search($search)[0]->id;
	}

	protected function make_disposable_widget(string $name = 'TestWidget', bool $restrict_publish = false): \Materia\Widget
	{
		$user = $this->make_random_author();

		$mock_manifest_data = [
			'general' => [
				'name' => $name,
				'height' => 500,
				'width' => 6000,
				'is_qset_encrypted' => false,
				'is_answer_encrypted' => false,
				'is_storage_enabled' => false,
				'is_playable' => true,
				'is_editable' => true,
				'in_catalog' => true,
				'restrict_publish' => $restrict_publish,
				'api_version' => 2,
			],
			'score' => [
				'score_module' => $name, // NOTE: this matches the class name in our test widget
				'is_scorable' => false,
			],
			'files' => [
				'flash_version' => 7,
				'creator' => 'creator.html',
				'player' => 'player.html',
			]
		];

		$params = Widget_Installer::generate_install_params($mock_manifest_data, __FILE__);

		list($id, $num) = \DB::insert('widget')
			->set($params)
			->execute();

		$widget = \Materia\Widget::forge($id);

		// add the demo
		$qset = (object) ['version' => 2, 'data' => []];
		$demo_inst = new \Materia\Widget_Instance([
			'user_id'         => $user->id,
			'name'            => uniqid('test_'),
			'is_draft'        => false,
			'created_at'      => time(),
			'widget'          => $widget,
			'is_student_made' => true,
			'guest_access'    => true,
			'published_by'    => $user->id,
			'attempts'        => -1
		]);
		$demo_inst->db_store();

		// add/update the required mdetadata
		Widget_Installer::db_insert_metadata($id, 'about', 'mock about');
		Widget_Installer::db_insert_metadata($id, 'excerpt', 'mock excerpt');
		Widget_Installer::db_insert_metadata($id, 'demo', $demo_inst->id);

		// make sure nobody owns the demo widget
		\Materia\Perm_Manager::clear_user_object_perms($demo_inst->id, \Materia\Perm::INSTANCE, $user->id);

		// load a Model
		return \Materia\Widget::forge($id);
	}

	protected function make_random_super_user($password = null)
	{
		return $this->make_random_student($password, ['super_user']);
	}

	protected function make_random_noauth($password = null)
	{
		return $this->make_random_student($password, ['no_author']);
	}

	protected function make_random_author($password = null)
	{
		return $this->make_random_student($password, ['basic_author']);
	}

	protected function make_random_student($password = null, $add_roles =[])
	{
		$name = uniqid('rand_');
		$first = 'Bobby';
		$middle = 'R';
		$last = 'Droptables';
		$password = $password ?: uniqid();

		require_once(APPPATH.'/tasks/admin.php');
		$id = \Fuel\Tasks\Admin::new_user($name, $first, $middle, $last, $name.'@materia.com', $password);
		$user = \Model_User::find($id);
		$this->users_to_clean[] = $user;
		\Materia\Perm_Manager::add_users_to_roles_system_only([$user->id], $add_roles);
		return $user;
	}

	// TODO: make this use make_random_student
	protected function _as_student()
	{
		\Auth::logout();
		$uname = '~student';
		$pword = 'kogneato';

		$user = \Model_User::find_by_username($uname);
		if ( ! $user instanceof \Model_User)
		{
			require_once(APPPATH.'/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'student', 'testStudent@ucf.edu', $pword);
			$user = \Model_User::find_by_username($uname);
		}

		$login = \Service_User::login($uname, $pword);
		$this->assertTrue($login);
		$this->users_to_clean[] = $user;
		return $user;
	}

	// TODO: make this use make_random_author
	protected function _as_author()
	{
		\Auth::logout();
		$uname = '~author';
		$pword = 'kogneato';

		$user = \Model_User::find_by_username($uname);
		if ( ! $user instanceof \Model_User)
		{
			require_once(APPPATH.'/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'Prof', 'd', 'Author', 'testAuthor@ucf.edu', $pword);
			\Fuel\Tasks\Admin::give_user_role($uname, 'basic_author');
			$user = \Model_User::find_by_username($uname);
		}

		$login = \Service_User::login($uname, $pword);
		$this->assertTrue($login);

		$this->users_to_clean[] = $user;
		return $user;
	}

	// TODO: delete
	protected function _as_author_2()
	{
		\Auth::logout();
		$uname = '~testAuthor2';
		$pword = 'interstellar555!';

		$user = \Model_User::find_by_username($uname);
		if ( ! $user instanceof \Model_User)
		{
			require_once(APPPATH.'/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'author', 'testAuthor2@ucf.edu', $pword);
			\Fuel\Tasks\Admin::give_user_role($uname, 'basic_author');
			$user = \Model_User::find_by_username($uname);
		}

		$login = \Service_User::login($uname, $pword);
		$this->assertTrue($login);
		$this->users_to_clean[] = $user;
		return $user;
	}

	// TODO: delete
	protected function _as_author_3()
	{
		\Auth::logout();
		$uname = '~testAuthor3';
		$pword = 'interstellar555!';

		$user = \Model_User::find_by_username($uname);
		if ( ! $user instanceof \Model_User)
		{
			require_once(APPPATH.'/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'author', 'testAuthor3@ucf.edu', $pword);
			\Fuel\Tasks\Admin::give_user_role($uname, 'basic_author');
			$user = \Model_User::find_by_username($uname);
		}

		$login = \Service_User::login($uname, $pword);
		$this->assertTrue($login);
		$this->users_to_clean[] = $user;
		return $user;
	}

	// TODO: use make_random_super_user
	protected function _as_super_user()
	{
		\Auth::logout();
		$uname = '~testSu';
		$pword = 'interstellar555!';

		$user = \Model_User::find_by_username($uname);
		if ( ! $user instanceof \Model_User)
		{
			require_once(APPPATH.'/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'su', 'testSu@ucf.edu', $pword);
			// TODO: super_user should get all these rights inherently right??????!!!!
			\Fuel\Tasks\Admin::give_user_role($uname, 'super_user');
			\Fuel\Tasks\Admin::give_user_role($uname, 'basic_author');
			$user = \Model_User::find_by_username($uname);
		}

		$login = \Service_User::login($uname, $pword);
		$this->assertTrue($login);
		$this->users_to_clean[] = $user;
		return $user;
	}

	protected function _as_noauth()
	{
		\Auth::logout();
		$uname = '~testNoAuth';
		$pword = 'interstellar555!';

		$user = \Model_User::find_by_username($uname);
		if ( ! $user instanceof \Model_User)
		{
			require_once(APPPATH.'/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'noauth', 'testNoAuth@ucf.edu', $pword);
			// TODO: super_user should get all these rights inherently right??????!!!!
			\Fuel\Tasks\Admin::give_user_role($uname, 'no_author');
			$user = \Model_User::find_by_username($uname);
		}

		$login = \Service_User::login($uname, $pword);
		$this->assertTrue($login);
		$this->users_to_clean[] = $user;
		return $user;
	}

	protected function assert_is_user_array($user)
	{
		$this->assertIsArray($user);
		$this->assertArrayHasKey('id', $user);
		$this->assertArrayHasKey('username', $user);
		$this->assertArrayHasKey('first', $user);
		$this->assertArrayHasKey('last', $user);
		$this->assertArrayHasKey('email', $user);
		$this->assertArrayHasKey('created_at', $user);
		$this->assertArrayHasKey('updated_at', $user);
	}

	protected function assert_is_valid_id($id)
	{
		$this->assertMatchesRegularExpression('/[a-zA-Z0-9]/', $id);
	}

	protected function assert_is_widget($widget)
	{
		$this->assertInstanceOf('\Materia\Widget', $widget);
		$this->assert_is_valid_id($widget->id);
		$this->assertObjectHasAttribute('name', $widget);
		$this->assertObjectHasAttribute('created_at', $widget);
		$this->assertObjectHasAttribute('dir', $widget);
		$this->assertObjectHasAttribute('height', $widget);
		$this->assertObjectHasAttribute('width', $widget);
		$this->assertObjectHasAttribute('meta_data', $widget);
		$this->assertObjectHasAttribute('clean_name', $widget);
	}

	protected function assert_is_widget_instance($inst, $skip_qset=false)
	{
		$this->assertInstanceOf('\Materia\Widget_Instance', $inst);
		$this->assert_is_valid_id($inst->id);
		$this->assertObjectHasAttribute('name', $inst);
		$this->assertObjectHasAttribute('widget', $inst);
		$this->assertObjectHasAttribute('user_id', $inst);
		$this->assertObjectHasAttribute('is_draft', $inst);
		$this->assertObjectHasAttribute('created_at', $inst);
		$this->assertObjectHasAttribute('qset', $inst);
		$this->assertObjectHasAttribute('height', $inst);
		$this->assertObjectHasAttribute('width', $inst);
		$this->assertObjectHasAttribute('open_at', $inst);
		$this->assertObjectHasAttribute('close_at', $inst);
		$this->assertObjectHasAttribute('attempts', $inst);
		if ( ! $skip_qset) $this->assert_is_qset($inst->qset);
	}

	protected function assert_is_qset($qset)
	{
		$this->assertIsObject($qset);
		$this->assertObjectHasAttribute('data', $qset);
		$this->assertObjectHasAttribute('version', $qset);
		$this->assertArrayHasKey('id', $qset->data);
		$questions = \Materia\Widget_Instance::find_questions($qset->data);
		foreach ($questions as $question)
		{
			$this->assertInstanceOf('\Materia\Widget_Question', $question);
			if ($question instanceof \Materia\Widget_Question_Type_QA) $this->assert_question_is_qa($question);
			if ($question instanceof \Materia\Widget_Question_Type_MC) $this->assert_question_is_mc($question);
		}
	}

	protected function assert_question_is_qa($qa)
	{
		$this->assertInstanceOf('\Materia\Widget_Question_Type_QA', $qa);
	}

	protected function assert_question_is_mc($mc)
	{
		$this->assertInstanceOf('\Materia\Widget_Question_Type_MC', $mc);
	}

	protected function mock_widget_play($inst, $context_id=false)
	{
		if ( $inst->is_draft) return new \Materia\Msg(\Materia\Msg::ERROR, 'Drafts are not playable');
		if ( ! $inst->widget->is_playable) return new \Materia\Msg(\Materia\Msg::ERROR, 'Widget is retired');

		$status = $inst->status($context_id);
		if ( ! $status['open']) return new \Materia\Msg(\Materia\Msg::ERROR, 'Widget not available');
		if ( ! $status['has_attempts']) return new \Materia\Msg(\Materia\Msg::ERROR, 'No attempts remaining');

		// create the play
		$play_id = \Materia\Api::session_play_create($inst->id, $context_id);
		return $play_id;
	}

	protected function mock_play_complete($play_id, $logs = [])
	{
		if (empty($logs))
		{
			$log = new stdClass();
			$log->type = 1004;
			$log->game_time = 0.5;
			$logs[] = $log;

			$log = new stdClass();
			$log->type = 2;
			$log->game_time = 1;
			$logs[] = $log;
		}

		$score = \Materia\Api::play_logs_save($play_id, $logs);
		return $score;
	}

	public function test_just_because_its_required()
	{
		self::assertTrue(true);
	}
}
