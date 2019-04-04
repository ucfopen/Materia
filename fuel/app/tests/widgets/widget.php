<?php
/**
 * @group App
 * @group Widget
 * @group Materia
 */

class Test_Widget extends \Basetest
{
	public function test_publishable_by(): void
	{
		$widget = $this->make_disposable_widget('RestrictPublish', true);

		$student = $this->_as_student();
		$output = $widget->publishable_by($student->id);
		$this->assertFalse($output);

		$author = $this->_as_author();
		$output = $widget->publishable_by($author->id);
		$this->assertTrue($output);
	}
}