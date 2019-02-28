<?php
/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @author      ADD NAME HERE
 */

namespace Materia;

class Widget_Question
{
	protected $_question_properties = ['text', 'assets'];
	protected $_answer_properties   = ['id', 'text', 'value', 'options', 'assets'];

	// @codingStandardsIgnoreLine
	public $materiaType = 'question';
	public $id          = 0;
	public $type        = '';
	public $created_at  = 0;
	public $questions   = [];
	public $answers     = [];
	public $options     = [];
	public $assets      = [];

	public function __construct($properties=[])
	{
		if (is_array($properties) && ! empty($properties))
		{
			foreach ($properties as $key => $val)
			{
				if (property_exists($this, $key)) $this->{$key} = $val;
			}
			if ($this->created_at == 0) $this->created_at = time();

			// consume any simple arrays sent to questions or answers objects
			if ( ! empty($this->questions))
			{
				foreach ($this->questions as $key => &$q)
				{
					foreach ($q as $q_prop => &$q_val)
					{
						if ( ! in_array($q_prop, $this->_question_properties)) unset($q[$q_prop]);
						if (is_string($q_val)) $q_val = trim($q_val); // trim all strings
					}
				}
			}
			if ( ! empty($this->answers))
			{
				foreach ($this->answers as $key => &$a)
				{
					foreach ($a as $a_prop => &$a_val)
					{
						if ( ! in_array($a_prop, $this->_answer_properties)) unset($a[$a_prop]);
						if (is_string($a_val)) $a_val = trim($a_val); // trim all strings
					}
				}
			}
		}
		return $this;
	}

	public static function forge($properties=[])
	{
		return new Widget_Question($properties);
	}

	public function from_json($json)
	{
		$input = json_decode($json, true);
		$this->__construct($input);
		return $this;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 * @param unknown NEEDS DOCUMENTATION
	 *
	 * @review Needs code Review
	 */
	public function db_store($qset_id)
	{
		if ( \Materia\Util_Validator::is_pos_int($this->id) ) return false;

		// valid questions have atleast one question and one answer
		if (count($this->questions) < 1 || count($this->answers) < 1 ) return false;

		// loop through questions
		\DB::start_transaction();
		try
		{
			$question_types = [];
			// =============== STORE QUESTION ================
			foreach ($this->questions as &$q)
			{
				// we store this now
				try
				{
					list($id, $num) = \DB::insert('question')
						->set([
							'user_id'    => \Model_User::find_current_id(),
							'type'       => $this->type,
							'text'       => $q['text'],
							'created_at' => $this->created_at,
							'data'       => base64_encode(json_encode($this)),
							'hash'       => $this->create_question_hash($this)
						])
						->execute();
					$question_types[] = $this->type;
					$this->id = $id;
				}
				catch (\Database_Exception $e)
				{
					if ($e->getCode() == 23000)
					{
						$existing_id_query = \DB::select('id')->from('question')->where('hash', '=', $this->create_question_hash($this))->execute();

						if (count($existing_id_query) > 0)
						{
							$existing_id = $existing_id_query[0];
							$this->id = $existing_id['id'];
						}
					}
					continue;// check for error 1062 (Duplicate entry for key 'hash_unique')
				}
			}

			// delete question cache
			foreach ($question_types as $type)
			{
				\Cache::delete('questions.user-'.\Model_User::find_current_id().'.'.$type);
			}
			\Cache::delete('questions.user-'.\Model_User::find_current_id().'.all');

			//============ SET OWNERSHIP ================
			// disabling this, as it's been deemed that setting ownership is unnecessary.
			// Perm_Manager::set_user_object_perms($this->id, Perm::QUESTION, $this->user_id, [Perm::FULL => Perm::ENABLE]);

			//============ MAPPING ASSETS TO QUESTION / QSET ================
			if (is_array($this->assets) && count($this->assets) > 0)
			{
				Widget_Asset_Manager::register_assets_to_item(Widget_Asset::MAP_TYPE_QUESTION, $this->id, $this->assets);// link assets to question
				if ($qset_id) Widget_Asset_Manager::register_assets_to_item(Widget_Asset::MAP_TYPE_QSET, $qset_id, $this->assets);// link assets to qset
			}

			//============ MAPPING QUESTION TO QSET ================
			if ($qset_id)
			{
				\DB::insert('map_question_to_qset')
					->set([
						'qset_id'     => $qset_id,
						'question_id' => $this->id
					])
					->execute();
			}

			\DB::commit_transaction();
			\Cache::delete('questions.user-'.\Model_User::find_current_id());
		}
		catch (Exception $e)
		{
			trace($e);
			\DB::rollback_transaction();
			throw $e;
		}

		return $this;
	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	public function db_remove()
	{

		if ($this->id > 0)
		{
			\DB::start_transaction();

			try
			{
				// remove the question
				\DB::delete('question')
					->where('id', $this->id)
					->limit(1)
					->execute();
				// remove the options linked to the question
				\DB::delete('question_option')
					->where('question_id', $this->id)
					->execute();

				// remove all permissions for this object
				Perm_Manager::clear_all_perms_for_object($this->id, Perm::QUESTION);

				\DB::commit_transaction();

				// now clean up the assets
				$this->remove_asset_links();
				\Cache::delete('questions.user-'.\Model_User::find_current_id());
			}
			catch (Exception $e)
			{
				\DB::rollback_transaction();
			}
		}

	}
	/**
	 * NEEDS DOCUMENTATION
	 *
	 * @param unknown NEEDS DOCUMENTATION
	 */
	public function db_get($id)
	{
		$results = \DB::select()
			->from('question')
			->where('id', $id)
			->execute();

		if ($results->count() == 1)
		{
			$this->from_json(base64_decode($results[0]['data']));
			return $this;
		}

		throw(new \Exception("Question $id not found"));
		return false;
	}

	/**
	 * NEEDS DOCUMENTATION
	 *
	 */
	protected function remove_asset_links()
	{
		Widget_Asset_Manager::un_register_assets_to_item(Widget_Asset::MAP_TYPE_QUESTION, $this->id, $this->assets);
	}

	/**
	 * Creates a hash of the question/answer pair used to uniquely identify a question's signature
	 * @param  Widget_Question $question Widget_Question Object to create hash signature for
	 * @return string                         [description]
	 */
	protected function create_question_hash(Widget_Question $question)
	{
		$signature = [];

		foreach ($question->questions as $q)
		{
			if ( ! empty($q['text'])) $signature[] = $q['text'];
		}

		foreach ($question->answers as $a)
		{
			if ( ! empty($a['text'])) $signature[] = $a['text'];
			if ( ! empty($a['options'])) $signature[] = $a['options'];
			if ( ! empty($a['value'])) $signature[] = $a['value'];
		}

		$signature[] = \Model_User::find_current_id();
		$signature[] = $question->type;
		$signature[] = $question->options;

		return md5(json_encode($signature));
	}

	// Remove all information specific to this Materia Install
	public function export()
	{
		unset($this->id);
		unset($this->created_at);
		if (empty($this->options)) unset($this->options);
		if (empty($this->assets)) unset($this->assets);

		if ( ! empty($this->questions))
		{
			foreach ($this->questions as $q)
			{
				unset($q->id);
				unset($q->created_at);
				unset($q->questions);
				unset($q->answers);
				if (empty($q->type)) unset($q->type);
				if (empty($q->options)) unset($q->options);
				if (empty($q->assets)) unset($q->assets);
			}
		}
		if ( ! empty($this->answers))
		{
			foreach ($this->answers as $a)
			{
				unset($a->id);
				if (empty($a->options)) unset($a->options);
				if (empty($a->assets)) unset($a->assets);
			}
		}
	}

}
