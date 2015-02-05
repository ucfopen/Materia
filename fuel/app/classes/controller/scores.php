<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Scores extends Controller
{

	protected $_header = 'partials/header';

	public function before()
	{
		$this->theme = Theme::instance();
		$this->theme->set_template('layouts/main');
	}

	public function after($response)
	{
		// If no response object was returned by the action,
		if (empty($response) or ! $response instanceof Response)
		{
			// render the defined template
			$this->theme->set_partial('header', $this->_header)->set('me', Model_User::find_current());
			// add google analytics
			if ($gid = Config::get('materia.google_tracking_id', false))
			{
				Js::push_inline($this->theme->view('partials/google_analytics', array('id' => $gid)));
			}

			Js::push_inline('var BASE_URL = "'.Uri::base().'";');
			Js::push_inline('var WIDGET_URL = "'.Config::get('materia.urls.engines').'";');
			Js::push_inline('var STATIC_CROSSDOMAIN = "'.Config::get('materia.urls.static_crossdomain').'";');

			$response = Response::forge(Theme::instance()->render());
		}


		return parent::after($response);
	}

	public function get_show($inst_id)
	{
		if (Materia\Api::session_valid() !== true)
		{
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
		}

		Css::push_group(['core', 'scores']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student', 'labjs']);

		$this->theme->get_template()
			->set('title', 'Score Results')
			->set('page_type', 'scores');

		$this->theme->set_partial('content', 'partials/score/full');
	}

	public function get_show_embedded($inst_id)
	{
		if (Materia\Api::session_valid() !== true)
		{
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
		}

		Css::push_group(['core', 'embed_scores']);

		// TODO: remove ngmodal, jquery, convert author to something else, materia is a mess
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'author', 'student']);


		$lti_token = \Input::get('ltitoken', false);
		if ($lti_token)
		{
			Js::push_inline('var __LTI_TOKEN = "'.$lti_token.'";');
		}

		$this->_header = 'partials/header_empty';
		$this->theme->get_template()
			->set('title', 'Score Results')
			->set('page_type', 'scores');

		$this->theme->set_partial('content', 'partials/score/full');
	}

	/**
	 * Prepares and then pushes a csv file
	 *
	 * @param int the game instance id
	 * @param string Comma seperated semester list like "2012-Summer,2012-Spring"
	 */
	public function get_csv($inst_id, $semesters_string)
	{

		if (Materia\Api::session_valid() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login'));
		}

		$inst = Materia\Widget_Instance_Manager::get($inst_id);

		if ( ! Materia\Perm_Manager::check_user_perm_to_object(\Auth::instance()->get_user_id()[1], $inst_id, Materia\Perm::INSTANCE, [Materia\Perm::VISIBLE, Materia\Perm::FULL]) && ! \Model_User::verify_session(\RocketDuck\Perm_Role::SU))
		{
			return new Response('', 403);
		}

		$semesters = explode(',', $semesters_string);
		$play_logs = [];
		$results   = [];

		foreach ($semesters as $semester)
		{
			list($year, $term) = explode('-', $semester);
		 	// Get all scores for each semester
		 	$logs = $play_logs[$year.' '.$term] = Materia\Session_Play::get_by_inst_id($inst_id, $term, $year);

			foreach ($logs as $play)
			{
				$uname = $play['username'];

				if ( ! isset($results[$uname])) $results[$uname] = ['score' => 0];

				$results[$uname]['semester']   = $semester;
				$results[$uname]['last_name']  = $play['last'];
				$results[$uname]['first_name'] = $play['first'];
				$results[$uname]['score']      = max($results[$uname]['score'], $play['perc']);
			}
		}

		// If there aren't any logs throw a 404 error
		if (count($play_logs) == 0) throw new HttpNotFoundException;

		// Table headers
		$csv = "User ID,Last Name,First Name,Score,Semester\r\n";

		foreach ($results as $userid => $r)
		{
			$csv .= "$userid,{$r['last_name']},{$r['first_name']},{$r['score']},{$r['semester']}\r\n";
		}

		return $this->build_download_response($csv, $inst->name.'.csv');
	}

	/**
	 * Prepares and then pushes a csv file
	 *
	 * @param int the game instance id
	 * @param string Comma seperated semester list like "2012-Summer,2012-Spring"
	 */
	public function get_raw($inst_id, $semesters_string)
	{

		if (Materia\Api::session_valid() !== true)
		{
			Session::set('redirect_url', URI::current());
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login'));
		}

		$inst = Materia\Widget_Instance_Manager::get($inst_id);

		if ( ! Materia\Perm_Manager::check_user_perm_to_object(\Auth::instance()->get_user_id()[1], $inst_id, Materia\Perm::INSTANCE, [Materia\Perm::VISIBLE, Materia\Perm::FULL]) && ! \Model_User::verify_session(\RocketDuck\Perm_Role::SU))
		{
			return new Response('', 403);
		}

		$semesters = explode(',', $semesters_string);
		$play_logs = [];
		$results   = [];

		foreach ($semesters as $semester)
		{
			list($year, $term) = explode('-', $semester);
		 	// Get all scores for each semester
		 	$logs = $play_logs[$year.' '.$term] = Materia\Session_Play::get_by_inst_id($inst_id, $term, $year);

			foreach ($logs as $play)
			{
				$uname = $play['username'];

				if ( ! isset($results[$uname])) $results[$uname] = ['score' => 0];

				$play_events = Materia\Session_Logger::get_logs($play['id']);

				foreach ($play_events as $play_event)
				{
					$r = [];
					$r['semester']   = $semester;
					$r['last_name']  = $play['last'];
					$r['first_name'] = $play['first'];
					$r['type']       = $play_event->type;
					$r['item_id']	 = $play_event->item_id;
					$r['text']       = $play_event->text;
					$r['value']      = $play_event->value;
					$r['game_time']  = $play_event->game_time;
					$r['created_at'] = $play_event->created_at;
					$results[$uname][] = $r;
				}
			}
		}

		// If there aren't any logs throw a 404 error
		if (count($play_logs) == 0) throw new HttpNotFoundException;

		// Table headers
		$csv_playlog_text = "User ID,Last Name,First Name,Semester,Type,Item Id,Text,Value,Game Time,Created At\r\n";

		foreach ($results as $userid => $userlog)
		{
			foreach ($userlog as $r)
			{
				$csv_playlog_text .= "$userid,{$r['last_name']},{$r['first_name']},{$r['semester']},{$r['type']},{$r['item_id']},{$r['text']},{$r['value']},{$r['game_time']},{$r['created_at']}\r\n";
			}
		}

		$inst->get_qset($inst_id);

		$questions = \Materia\Widget_Instance::find_questions($inst->qset->data);

		if (isset($questions[0]) && isset($questions[0]['items']))
		{
			$questions = $questions[0]['items'];
		}

		$csv_answers = [];
		$csv_questions = [];
		$options = [];

		foreach ($questions as $question)
		{
			foreach ($question->questions as $q)
			{
				$csv_question = [];
				$csv_question['question_id'] = $question->id;
				$csv_question['id'] = isset($q['id']) ? $q['id'] : '';
				$csv_question['options'] = $question->options;
				$csv_question['text'] = $q['text'];
				$csv_questions[] = $csv_question;
			}

			foreach ($question->options as $key => $value)
			{
				if ( ! in_array($key, $options))
				{
					$options[] = $key;
				}
			}

			foreach ($question->answers as $answer)
			{
				$csv_answer = [];
				$csv_answer['id'] = isset($answer['id']) ? $answer['id'] : '';
				$csv_answer['text'] = isset($answer['text']) ? $answer['text'] : '';
				$csv_answer['value'] = isset($answer['value']) ? $answer['value'] : '';
				$csv_answer['question_id'] = $question->id;
				$csv_answers[] = $csv_answer;
			}
		}

		$csv_question_text = 'question_id,id,text';

		foreach ($options as $key)
		{
			$csv_question_text .= ",$key";
		}

		foreach ($csv_questions as $question)
		{
			$csv_question_text .= "\r\n{$question['question_id']},{$question['id']},{$question['text']}";

			foreach ($options as $key)
			{
				$val = isset($question['options']) && isset($question['options'][$key]) ? $question['options'][$key] : '';
				$csv_question_text .= ",$val";
			}
		}

		$csv_answer_text = 'question_id,id,text,value';
		foreach ($csv_answers as $answer)
		{
			$csv_answer_text .= "\r\n{$answer['question_id']},{$answer['id']},{$answer['text']},{$answer['value']}";
		}

		$tempname = tempnam('/tmp', 'materia_csv');

		$zip = new ZipArchive();
		$zip->open($tempname);
		$zip->addFromString('questions.csv', $csv_question_text);
		$zip->addFromString('answers.csv', $csv_answer_text);
		$zip->addFromString('logs.csv', $csv_playlog_text);
		$zip->close();

		$data = file_get_contents($tempname);
		unlink($tempname);

		return $this->build_download_response($data, $inst->name.'.zip');
	}

	public function get_storage($inst_id, $table_name, $semesters)
	{
		$table_name = html_entity_decode($table_name);
		$csv        = \Materia\Storage_Manager::get_csv_logs_by_inst_id($inst_id, $table_name, explode(',', $semesters));
		$inst       = \Materia\Widget_Instance_Manager::get($inst_id);

		return $this->build_download_response($csv, "$table_name [$inst->name].csv");
	}

	private function build_download_response($data, $filename)
	{
		return Response::forge()
			->body($data)
			->set_header('Pragma', 'public')
			->set_header('Expires', '0')
			->set_header('Cache-Control', 'must-revalidate, post-check=0, pre-check=0')
			->set_header('Content-Type', 'application/force-download')
			->set_header('Content-Type', 'application/octet-stream')
			->set_header('Content-Type', 'application/download')
			->set_header('Content-Disposition', "attachment; filename=\"$filename\"");
	}
}
