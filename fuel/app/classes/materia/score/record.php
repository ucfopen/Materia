<?php
/**
 * NEEDS DOCUMENTATION
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  scoring
  * @author      ADD NAME HERE
 */

namespace Materia;

class Score_Record
{

	/** @var string NEEDS DOCUMENTATION */
	public $message;
	/** @var int Log type, found in Session_Log */
	public $type;
	/** @var string The actual question */
	public $question_text;
	/** @var mixed[array|String] The correct answer to the question */
	public $correct_answers;
	/** @var string Answer submitted by user. Directly from add_log command in AS code */
	public $user_answer;
	/** @var int The score received for this record */
	public $score;
	/** @var array Contains information on subsequent attempts of same question */
	public $sub_records;
	/** @var array Contains feedback (sent from widget) to display to the user */
	public $feedback;
	/**
	 * @var int The question identifier for this object. If this is zero, feedback
	 *           and message types will be assigned to the game itself.
	 */
	public $identifier;

	public function __construct()
	{
		$sub_records = [];
		$feedback = [];
	}

}
