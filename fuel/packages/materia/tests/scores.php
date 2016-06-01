<?php
/**
 * @group App
 * @group LTI
 * @group Materia
 */
class Test_Scores extends \Basetest
{

	public function test_set_complete_triggers_event()
	{
		$this->_asAuthor();
		$qset = $this->create_new_qset('question', 'answer');
		$output = \Materia\Api_V1::widget_instance_new(1, 'score test', $qset, false);
		$output->db_store();

		$student = $this->_asStudent();

		$results = \DB::select()
			->from('widget_instance')
			->where('id', $output->id)
			->limit(1)
			->execute()
			->as_array();

		$this->assertCount(1, $results);

		$play = new \Materia\Session_Play();
		$play_id = $play->start($student->id, $results[0]['id']);
		$this->assertInternalType('string', $play_id);

		$event_fired = false;

		$callback = function($event_args) use (&$play, &$event_fired)
		{
			list($play_id, $inst_id, $student_user_id, $latest_score, $max_score) = $event_args;
			$event_fired = true;

			$this->assertEquals($play_id, $play->id);
			$this->assertEquals($student_user_id, $play->user_id);
			$this->assertEquals($latest_score, 77);
			$this->assertEquals($max_score, 77);
		};

		// Register an event listener to make sure it's called and gets the right values
		\Event::register('score_updated', $callback);
		$play->set_complete(77, 100, 77);
		\Event::unregister('score_updated');
		$this->assertTrue($event_fired);
	}

	public function test_max_scores_per_context()
	{
		$this->_asAuthor();

		// ============ MAKE A PUBLISHED WIDGET ============
		$title = "My Test Widget";
		$question = 'Question';
		$answer = 'Answer';
		$widget_id = 1;
		$qset = $this->create_new_qset($question, $answer);

		$saveOutput = \Materia\Api_V1::widget_instance_new($widget_id, $title, $qset, true);
		$this->assertIsWidgetInstance($saveOutput);
		$qset = $saveOutput->qset;

		$student = $this->_asStudent();

		$play = null;
		$target_score = 0;
		$given_score = 0;

		//shortcut function, takes in a few arguments and simulates a play starting and concluding with the given play score/anticipated highest score
		$quick_play = function($given, $target, $student_id, $inst_id, $context=false) use (&$given_score, &$target_score, &$play)
		{
			$given_score = $given;
			$target_score = $target;
			$play = new \Materia\Session_Play();
			$play_id = $play->start($student_id, $inst_id, $context);
			$play->set_complete($given_score, 100, $given_score);
		};

		$callback = function($event_args) use (&$play, &$given_score, &$target_score)
		{
			list($play_id, $inst_id, $student_user_id, $latest_score, $max_score) = $event_args;

			$this->assertEquals($given_score, $latest_score);
			$this->assertEquals($target_score, $max_score);
		};
		// Register an event listener to make sure it's called and gets the right values
		\Event::register('score_updated', $callback);

		$context = 'context_1';
		// ============ LOW SCORE IN FIRST CONTEXT ============
		$quick_play(0, 0, $student->id, $saveOutput->id, $context);
		// ============ HIGH SCORE IN FIRST CONTEXT ============
		$quick_play(100, 100, $student->id, $saveOutput->id, $context);
		// ============ LOW SCORE IN FIRST CONTEXT ============
		$quick_play(0, 100, $student->id, $saveOutput->id, $context);

		$context = 'context_2';
		// ============ LOW SCORE IN SECOND CONTEXT ============
		$quick_play(0, 0, $student->id, $saveOutput->id, $context);
		// ============ HIGH SCORE IN SECOND CONTEXT ============
		$quick_play(100, 100, $student->id, $saveOutput->id, $context);
		// ============ LOW SCORE IN SECOND CONTEXT ============
		$quick_play(0, 100, $student->id, $saveOutput->id, $context);

		// ============ LOW SCORE WITHOUT CONTEXT ============
		$quick_play(0, 0, $student->id, $saveOutput->id);
		// ============ HIGH SCORE WITHOUT CONTEXT ============
		$quick_play(100, 100, $student->id, $saveOutput->id);
		// ============ LOW SCORE WITHOUT CONTEXT ============
		$quick_play(0, 100, $student->id, $saveOutput->id);

		\Event::unregister('score_updated');
		\Materia\Api_V1::widget_instance_delete($saveOutput->id);
	}
}
