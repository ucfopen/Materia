<?php
/**
 * @group App
 * @group Widget
 * @group Materia
 */

use \Materia\Widget_Instance;
use \Materia\Widget_Manager;

class Test_Widget_Instance extends \Basetest
{

	public function test_db_store()
	{

		$props = [
			'name'            => 'THIS IS A Name!',
			'group'           => 'group',
			'height'          => 55,
			'width'           => 100,
			'is_playable'     => 0,
			'is_editable'     => true,
			'in_catalog'      => false,
			'api_version'     => '2',
			'user_id'         => 1,
			'is_draft'        => false,
			'embedded_only'   => true,
			'embedded_only'   => 1,
			'guest_access'    => 0,
			'is_student_made' => 1,
			'widget'          => Widget_Manager::get_widgets([1])[0],
		];


		$wi = new Widget_Instance($props);
		$x = $wi->db_store();
		self::assertTrue($x);

		$wi->guest_access = 1;
		$wi->embedded_only = false;
		$wi->is_student_made = true;
		$wi->is_draft = true;
		$x = $wi->db_store();

		self::assertTrue($x);
	}
}
