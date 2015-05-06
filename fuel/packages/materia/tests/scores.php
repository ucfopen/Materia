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
		$student = $this->_asStudent();

		$results = \DB::select()
			->from('widget_instance')
			->where('is_draft', '0')
			->where('is_deleted', '0')
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

}
