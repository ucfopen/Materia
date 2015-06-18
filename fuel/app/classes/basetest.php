<?
class Basetest extends TestCase
{
	// Runs before every single test
	protected function setUp()
	{
		Config::set('errors.throttle', 5000);
		$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
		\Fuel::$is_cli = true;
	}

	protected function tearDown()
	{
		\Fuel::$is_cli = false;
		\Auth::logout();
	}


	protected static function clear_fuel_input()
	{
		// reset fuelphp's input class
		$class = new ReflectionClass("\Fuel\Core\Input");
		foreach (['detected_uri', 'detected_ext', 'input', 'put_patch_delete', 'php_input', 'json', 'xml'] as $value)
		{
			$property = $class->getProperty($value);
			$property->setAccessible(true);
			$property->setValue(null);
		}
	}

	protected function create_new_qset($question_text, $asnwerText, $version=0)
	{
		$qset = (object) ['version' => '1', 'data' => null];

		switch($version)
		{
			case 0:
			default:
				$qset->data = json_decode('{"items":[{"items":[{"name":null,"type":"QA","assets":null,"answers":[{"text":"'.$asnwerText.'","options":{},"value":"100"}],"questions":[{"text":"'.$question_text.'","options":{},"value":""}],"options":{},"id":0}],"name":"","options":{},"assets":[],"rand":false}],"name":"","options":{"partial":false,"attempts":5},"assets":[],"rand":false}');
				break;
			case 1:
				$qset->data =  json_decode('{"items":[{"items":[{"name":null,"type":"QA","assets":null,"answers":[{"text":"'.$asnwerText.'","options":{},"value":"100"}],"questions":[{"text":"'.$question_text.'","options":{},"value":""}],"options":{},"id":0}],"name":"","options":{},"assets":[],"rand":false}],"name":"","options":{"partial":false,"attempts":5},"assets":[],"rand":false}');
				break;
		}
		return $qset;
	}

	protected function _find_widget_id($search)
	{
		return \Materia\Widget_Manager::search($search)[0]->id;
	}

	protected function _asStudent()
	{
		\Auth::logout();
		$uname = '~student';
		$pword = 'kogneato';

		$user = \Model_User::query()->where('username', $uname)->get_one();
		if ( ! $user instanceof \Model_User)
		{
			require_once(PKGPATH . 'materia/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'student', 'testStudent@ucf.edu', $pword);
			$user = \Model_User::query()->where('username', $uname)->get_one();
		}

		$login = \Model_User::login($uname, $pword);
		$this->assertTrue($login);

		return $user;
	}

	protected function _asAuthor()
	{
		\Auth::logout();
		$uname = '~author';
		$pword = 'kogneato';

		$user = \Model_User::query()->where('username', $uname)->get_one();
		if ( ! $user instanceof \Model_User)
		{
			require_once(PKGPATH . 'materia/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'Prof', 'd', 'Author', 'testAuthor@ucf.edu', $pword);
			\Fuel\Tasks\Admin::give_user_role($uname, 'basic_author');
			$user = \Model_User::query()->where('username', $uname)->get_one();
		}

		$login = \Model_User::login($uname, $pword);
		$this->assertTrue($login);

		return $user;
	}
	protected function _asAuthor2()
	{
		\Auth::logout();
		$uname = '~testAuthor2';
		$pword = 'interstellar555!';

		$user = \Model_User::query()->where('username', $uname)->get_one();
		if ( ! $user instanceof \Model_User)
		{
			require_once(PKGPATH . 'materia/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'author', 'testAuthor2@ucf.edu', $pword);
			\Fuel\Tasks\Admin::give_user_role($uname, 'basic_author');
			$user = \Model_User::query()->where('username', $uname)->get_one();
		}

		$login = \Model_User::login($uname, $pword);
		$this->assertTrue($login);

		return $user;
	}
	protected function _asAuthor3()
	{
		\Auth::logout();
		$uname = '~testAuthor3';
		$pword = 'interstellar555!';

		$user = \Model_User::query()->where('username', $uname)->get_one();
		if ( ! $user instanceof \Model_User)
		{
			require_once(PKGPATH . 'materia/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'author', 'testAuthor3@ucf.edu', $pword);
			\Fuel\Tasks\Admin::give_user_role($uname, 'basic_author');
			$user = \Model_User::query()->where('username', $uname)->get_one();
		}

		$login = \Model_User::login($uname, $pword);
		$this->assertTrue($login);

		return $user;
	}

	protected function _asSu()
	{
		\Auth::logout();
		$uname = '~testSu';
		$pword = 'interstellar555!';

		$user = \Model_User::query()->where('username', $uname)->get_one();
		if( ! $user instanceof \Model_User)
		{
			require_once(PKGPATH . 'materia/tasks/admin.php');
			\Fuel\Tasks\Admin::new_user($uname, 'test', 'd', 'su', 'testSu@ucf.edu', $pword);
			// TODO: super_user should get all these rights inherently right??????!!!!
			\Fuel\Tasks\Admin::give_user_role($uname, 'super_user');
			\Fuel\Tasks\Admin::give_user_role($uname, 'admin');
			\Fuel\Tasks\Admin::give_user_role($uname, 'basic_author');
			$user = \Model_User::query()->where('username', $uname)->get_one();
		}

		$login = \Model_User::login($uname, $pword);
		$this->assertTrue($login);

		return $user;
	}

	protected function assertIsUser($user)
	{
		$this->assertInstanceOf('\Model_User', $user);
		$user_array = $user->to_array();
		$this->assertIsUserArray($user->to_array());
	}

	protected function assertIsUserArray($user)
	{
		$this->assertInternalType('array', $user);
		$this->assertArrayHasKey('id', $user);
		$this->assertArrayHasKey('username', $user);
		$this->assertArrayHasKey('first', $user);
		$this->assertArrayHasKey('last', $user);
		$this->assertArrayHasKey('email', $user);
		$this->assertArrayHasKey('created_at', $user);
		$this->assertArrayHasKey('updated_at', $user);
	}

	protected function assertIsValidID($id)
	{
		$this->assertRegExp('/[a-zA-Z0-9]/', $id);
	}
	protected function assertIsWidget($widget)
	{
		$this->assertInstanceOf('\Materia\Widget', $widget);
		$this->assertIsValidID($widget->id);
		$this->assertObjectHasAttribute('name', $widget);
		$this->assertObjectHasAttribute('created_at', $widget);
		$this->assertObjectHasAttribute('dir', $widget);
		$this->assertObjectHasAttribute('height', $widget);
		$this->assertObjectHasAttribute('width', $widget);
		$this->assertObjectHasAttribute('meta_data', $widget);
		$this->assertObjectHasAttribute('clean_name', $widget);
		$this->assertObjectHasAttribute('group', $widget);
	}

	protected function assertIsWidgetInstance($inst, $skipQset=false)
	{
		$this->assertInstanceOf('\Materia\Widget_Instance', $inst);
		$this->assertIsValidID($inst->id);
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
		if(!$skipQset) $this->assertIsQset($inst->qset);
	}

	protected function assertIsQset($qset)
	{
		$this->assertInternalType('object', $qset);
		$this->assertObjectHasAttribute('data', $qset);
		$this->assertObjectHasAttribute('version', $qset);
		$this->assertArrayHasKey('id', $qset->data);
		$questions = \Materia\Widget_Instance::find_questions($qset->data);
		foreach ($questions as $question)
		{
			$this->assertInstanceOf('\Materia\Widget_Question', $question);
			if($question instanceof \Materia\Widget_Question_Type_QA) $this->assertIsQA($question);
			if($question instanceof \Materia\Widget_Question_Type_MC) $this->assertIsMC($question);
		}
	}

	protected function assertIsQA($qa)
	{
		$this->assertInstanceOf('\Materia\Widget_Question_Type_QA', $qa);
		// echo 'more testing needed for QA';
	}

	protected function assertIsMC($mc)
	{
		$this->assertInstanceOf('\Materia\Widget_Question_Type_MC', $mc);
		// echo 'more testing needed for MC';
	}

	protected function assertIsSemesterRage($semester)
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

	protected function assertNotificationExists($notification_array, $from_id, $to_id, $widget_id)
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

	protected function assertNotMessage($result)
	{
		$this->assertFalse($result instanceof \RocketDuck\Msg);
	}

	protected function assertInvalidLoginMessage($msg)
	{
		$this->assertInstanceOf('\RocketDuck\Msg', $msg);
		$this->assertEquals('Invalid Login', $msg->title);
	}

	protected function assertPermissionDeniedMessage($msg)
	{
		$this->assertInstanceOf('\RocketDuck\Msg', $msg);
		$this->assertEquals('Permission Denied', $msg->title);
	}

	protected function assertStudentAccessMessage($msg)
	{
		$this->assertInstanceOf('\RocketDuck\Msg', $msg);
		$this->assertEquals('No Notifications', $msg->title);
	}

	public function test_just_because_its_required()
	{
	}
}
