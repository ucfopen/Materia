<?php
/**
 * @group App
 * @group Storage
 * @group Materia
 */
class Test_Storage_Manager extends \Basetest
{

	public function test_get_table_summaries_by_inst_id_returns_empty_array_when_inst_isnt_valid()
	{
		$summaries = \Materia\Storage_Manager::get_table_summaries_by_inst_id(999);
		$this->assertEquals([], $summaries);
	}


}
