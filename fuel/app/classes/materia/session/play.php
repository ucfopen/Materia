<?php
/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  logging * @author      ADD NAME HERE
 */

namespace Materia;

class Session_Play
{
	const MAX_HASH_GENERATION_ATTEMPTS = 10;

	public $auth;
	public $created_at;
	public $elapsed;
	public $environment_data;
	public $id;
	public $context_id;
	public $semester;
	public $inst_id;
	public $ip;
	public $is_complete;
	public $is_preview;
	public $is_valid;
	public $percent;
	public $qset_id;
	public $referrer_url;
	public $score;
	public $user_id;

	/**
	 * NEEDS DOCUMENTAION
	 *
	 * @param object The Database Manager
	 * @param int NEEDS DOCUMENTATION
	 * @param int NEEDS DOCUMENTATION
	 * @param bool NEEDS DOCUMENTATION
	 */
	public function start($user_id=0, $inst_id=0, $context_id=false, $is_preview=false)
	{
		if (\Materia\Util_Validator::is_valid_hash($inst_id))
		{
			$instance = Widget_Instance_Manager::get($inst_id);
			$instance->get_qset($inst_id);

			if ( ! $context_id) $context_id = '';

			$this->created_at       = time();
			$this->user_id          = $instance->guest_access ? 0 : $user_id;
			$this->inst_id          = $inst_id;
			$this->context_id       = $context_id;
			$this->is_preview       = $is_preview;
			$this->qset_id          = $instance->qset->id;
			$this->environment_data = [
				'input'      => \Input::all(),
				'ip_address' => \Input::ip(),
				'referrer'   => \Input::referrer(),
			];

			// @TODO: This is a hack - assuming 'lti_message_type' in POST or 'token' in GET implies an LTI.
			// Essentially true but fragile.
			$is_lti = array_key_exists('lti_message_type', $this->environment_data['input']) || array_key_exists('token', $this->environment_data['input']);
			$this->auth = $is_lti ? 'lti' : '';
			$this->referrer_url = \Input::referrer();

			// Preview Plays dont log anything
			if ($is_preview) return static::start_preview($inst_id);

			// Grab the current semester's date range so the right cache can be targeted and removed
			$semester = Semester::get_current_semester();
			$this->semester = $semester;

			// clear play log summary cache
			\Cache::delete("play-logs.{$this->inst_id}.{$semester}");
			\Cache::delete("play-logs.{$this->inst_id}.all");

			if ( ! $this->save_new_play())
			{
				\Log::error("Unable to generate play_id! inst:{$this->inst_id}, user:{$this->user_id}");
				throw new \HttpServerErrorException;
			}

			static::set_user_is_playing();
			$logger = new Session_Logger();
			$logger->add_log($this->id, Session_Log::TYPE_PLAY_CREATED, 0, '', $this->id, -1, time());
			\Event::trigger('play_start', ['play_id' => $this->id, 'inst_id' => $inst_id, 'context_id' => $this->context_id]);
			return $this->id;
		}
		return false;
	}

	// used to indicate a user is playing a widget even if they are a guest
	public static function is_user_playing()
	{
		return \Session::get('user_is_playing', false);
	}

	protected static function set_user_is_playing()
	{
		\Session::set('user_is_playing', true);
	}

	protected static function start_preview($inst_id)
	{
		$previews = \Session::get('widgetPreviews', [0 => '']);
		$previews[] = $inst_id;
		\Session::set('widgetPreviews', $previews);
		Score_Manager::init_preview($inst_id);
		return -(count($previews) - 1);
	}

	protected function save_new_play()
	{
		for ($i = static::MAX_HASH_GENERATION_ATTEMPTS; $i > 0; $i--)
		{
			$hash = Widget_Instance_Hash::generate_long_hash();

			try
			{
				if ($this->insert_play($hash))
				{
					$this->id = $hash;
					return true;
				}
			}
			catch (\Database_Exception $e)
			{
				// DB collision - absorb the error since
				// we'll try again.
				\Log::warning('Failed creating play - this can happen on hash collision but could be something worse');
				\Log::warning($e->getMessage());
			}
		}

		return false;
	}

	protected function insert_play($hash)
	{
		list($insert_id, $num_affected) = \DB::insert('log_play')
			->set([
				'id'               => $hash,
				'inst_id'          => $this->inst_id,
				'created_at'       => $this->created_at,
				'user_id'          => $this->user_id,
				'is_valid'         => '1',
				'ip'               => $_SERVER['REMOTE_ADDR'],
				'qset_id'          => $this->qset_id,
				'environment_data' => base64_encode(json_encode($this->environment_data)),
				'auth'             => $this->auth,
				'referrer_url'     => $this->referrer_url,
				'context_id'       => $this->context_id,
				'semester'         => $this->semester
			])
			->execute();

		return $num_affected > 0;
	}

	/**
	 * Attempt to resume a play
	 *
	 * @param object The Database Manager
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * @return bool True if successful, else false.
	 */
	public function resume($play_id)
	{
		// if resuming a preview, look for it in the session and return true
		if ($play_id < 0)
		{
			$previews = \Session::get('widgetPreviews', []);
			return isset($previews[-$play_id]);
		}

			// Grab the current semester's date range so the right cache can be targeted and removed
			$semester = Semester::get_current_semester();

			\Cache::delete('play-logs.'.$this->inst_id.'.'.$semester);
			\Cache::delete('play-logs.'.$this->inst_id.'.all');

		try
		{
			// invalidate all previous playids
			\DB::update('log_play')
				->set(['is_valid' => '0'])
				->where('user_id', $this->user_id)
				->execute();

			\DB::update('log_play')
				->set(['is_valid' => '1'])
				->where('user_id', $this->user_id)
				->where('inst_id', $this->inst_id)
				->where('id', $this->id)
				->execute();

			return true;
		}
		catch (Exception $e)
		{
			return false;
		}
		return false;
	}

	/**
	 *  Builds a fast list of every play log with the associated user data.
	 *  Must be fast because it can be asked to retrieve large data sets
	 *
	 */
	public static function get_by_inst_id($inst_id, $semester='all', $year='all')
	{
		if ($semester != 'all' && $year != 'all')
		{
			$date = new Semester();
			$date->get($semester, $year);
			$cache_id = $date->id;
		}
		else
		{
			$cache_id = 'all';
		}

		$plays = \Cache::easy_get('play-logs.'.$inst_id.'.'.$cache_id);

		if (is_null($plays))
		{
			$query = \DB::select(
					's.id',
					['s.created_at', 'time'],
					['s.is_complete', 'done'],
					['s.percent', 'perc'],
					['s.elapsed', 'elapsed'],
					['s.qset_id', 'qset_id'],
					'user_id',
					['u.first', 'first'],
					['u.last', 'last'],
					'username'
				)
				->from(['log_play', 's'])
				->join(['users', 'u'], 'LEFT OUTER')
					->on('u.id', '=', 's.user_id')
				->where('s.inst_id', $inst_id);

			if (isset($date))
			{
				$query->where('s.created_at', '>', $date->start_at)
					->where('s.created_at', '<', $date->end_at);
			}
			$plays = $query->execute()->as_array();

			\Cache::set('play-logs.'.$inst_id.'.'.$cache_id, $plays);
		}

		return $plays;
	}

	/**
	 * NEEDS DOCUMENTAION
	 *
	 * @param object The Database Manager
	 * @param int NEEDS DOCUMENTATION
	 */
	public function get_by_id($play_id=0)
	{
		// if resuming a preview, look for it in the session and return true
		if ( ! \Materia\Util_Validator::is_valid_long_hash($play_id))
		{
			$previews = \Session::get('widgetPreviews', []);
			if (isset($previews[-$play_id]))
			{
				$this->id          = $play_id;
				$this->inst_id     = $previews[-$play_id]; // preview play_ids are inverse (-) of their actual index
				$this->is_valid    = 1;
				$this->created_at  = 0;
				$this->user_id     = \Model_User::find_current_id();
				$this->ip          = $_SERVER['REMOTE_ADDR'];
				$this->is_complete = 0;
				$this->score       = 0;
				$this->percent     = 0;
				$this->elapsed     = 0;
				$this->is_preview  = true;
				$this->context_id  = '';
				$this->semester    = Semester::get_current_semester();
				return true;
			}
		}
		if (\Materia\Util_Validator::is_valid_long_hash($play_id))
		{
			$results = \DB::select()
				->from('log_play')
				->where('id', $play_id)
				->limit(1)
				->execute();

			if ($results->count() > 0)
			{
				$r                 = $results[0];
				$this->id          = $r['id'];
				$this->inst_id     = $r['inst_id'];
				$this->is_valid    = $r['is_valid'];
				$this->created_at  = $r['created_at'];
				$this->user_id     = $r['user_id'];
				$this->ip          = $r['ip'];
				$this->is_complete = $r['is_complete'];
				$this->score       = $r['score'];
				$this->percent     = $r['percent'];
				$this->elapsed     = $r['elapsed'];
				$this->context_id  = $r['context_id'];
				$this->semester    = $r['semester'];
				return true;
			}
		}
		return false;
	}

	public function set_complete($score, $possible, $percent)
	{
		// set max score to the current score
		$max_percent = $percent;

		if ($this->is_preview != true)
		{
			$this->invalidate();

			// Grab the current semester's date range so the right cache can be targeted and removed
			$semester = Semester::get_current_semester();

			\Cache::delete('play-logs.'.$this->inst_id.'.'.$semester);
			\Cache::delete('play-logs.'.$this->inst_id.'.all');

			\DB::update('log_play')
				->set([
					'is_complete'    => '1',
					'score'          => $score,
					'score_possible' => $possible,
					'percent'        => $percent
				])
				->where('id', $this->id)
				->execute();

			// Determine the highest score of all my history (guest plays do not know youre history)
			$score_history = \Materia\Score_Manager::get_instance_score_history($this->inst_id, $this->context_id);

			foreach ($score_history as $score_history_item)
			{
				$max_percent = max($max_percent, $score_history_item['percent']);
			}
		}
		// Notify any plugins that the score has been saved
		\Event::trigger('score_updated', [$this->id, $this->inst_id, $this->user_id, $percent, $max_percent], 'string');
	}

	public function update_elapsed()
	{
		if ($this->is_preview != true)
		{
			// Grab the current semester's date range so the right cache can be targeted and removed
			$semester = Semester::get_current_semester();

			\Cache::delete('play-logs.'.$this->inst_id.'.'.$semester);
			\Cache::delete('play-logs.'.$this->inst_id.'.all');

			\DB::update('log_play')
				->set([
					'elapsed' => \DB::expr(time().' - created_at')
				])
				->where('id', $this->id)
				->execute();
		}
	}
	/**
	 * NEEDS DOCUMENTAION
	 *
	 * @param object The Database Manager
	 * @param bool NEEDS DOCUMENTATION
	 */
	public function invalidate($play_id=null)
	{
		$play_id = ($play_id === null ? $this->id : $play_id);

		// destroy the preview key
		if ($play_id < 0)
		{
			$previews = \Session::get('widgetPreviews', []);
			unset($previews[-$play_id]);
			\Session::set('widgetPreviews', $previews);
		}
		// destroy the db play
		else
		{
			// Grab the current semester's date range so the right cache can be targeted and removed
			$semester = Semester::get_current_semester();

			\Cache::delete('play-logs.'.$this->inst_id.'.'.$semester);
			\Cache::delete('play-logs.'.$this->inst_id.'.all');

			\DB::update('log_play')
				->set(['is_valid' => '0'])
				->where('id', $play_id)
				->execute();
		}
	}

	/**
	 * Retreives play logs for a specific user and get the title of the game played
	 *
	 * @param object The Database Manager
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 */
	public function get_plays_by_user_id($user_id, $start, $range)
	{

		// grab all plays for the user and get the title of the game played

		return \DB::select(
				['p.id','play_id'],
				'p.created_at',
				'p.score',
				'p.percent',
				'p.is_complete',
				'p.inst_id',
				['w.name', 'widget_name'],
				['i.name', 'inst_name']
			)
			->from( ['log_play', 'p'])
			->join( ['widget_instance', 'i'], 'LEFT')
				->on('p.inst_id', '=', 'i.id')
			->join( ['widget', 'w'], 'LEFT')
				->on('i.widget_id', '=', 'w.id')
			->where('p.user_id', $user_id)
			->order_by('p.created_at', 'DESC')
			->limit($range)
			->offset($start)
			->execute()
			->as_array();
	}

	// grab recent plays by a specific uid
	public function get_play_inst_ids_by_user_id($user_id, $start, $range, $distinct = false)
	{

		return \DB::select('p.created_at',
				'p.inst_id',
				'p.user_id',
				'i.id',
				'i.created_at',
				'w.is_scorable',
				'i.widget_id'
			)
			->from(['log_play', 'p'])
			->join(['widget_instance', 'i'])
				->on('i.id', '=', 'p.inst_id')
			->join(['widget', 'w'])
				->on('w.id', 'i.widget_id')
			->where('p.user_id', $user_id)
			->where('w.is_scorable', 1)
			->where('i.widget_id', 'NOT IN', \DB::select('widget_id')
				->from('widget_metadata')
				->where('name', 'studyonly')
				->where('value', 1))
			->order_by('p.created_at', 'DESC')
			->limit($range)
			->as_object()
			->execute();
	}
}
