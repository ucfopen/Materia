<?php
namespace Fuel\Migrations;
class Add_type_score_participation_to_log
{
	public function up()
	{
		\DBUtil::modify_fields(
			'log',
			[
				'type' => ['type' => 'enum', 'constraint' => "'BUTTON_PRESS', 'ERROR_GENERAL', 'ERROR_TIME_VALIDATION', 'KEY_PRESS', 'SCORE_ACTIVITY_FROM_CLIENT', 'SCORE_FINAL_FROM_CLIENT', 'SCORE_QUESTION_ANSWERED', 'SCORE_WIDGET_INTERACTION', 'SCORE_PARTICIPATION', 'WIDGET_CORE_INIT', 'WIDGET_END', 'WIDGET_LOAD_DONE', 'WIDGET_LOAD_START', 'WIDGET_LOGIN', 'WIDGET_PLAY_REQ', 'WIDGET_PLAY_START', 'WIDGET_RESTART', 'WIDGET_START', 'WIDGET_STATE', 'DATA'", 'null' => true]
			]
    );
  }

	public function down()
	{
		\DB::delete('log')->where('type', 'TYPE_SCORE_PARTICIPATION')->execute();

		\DBUtil::modify_fields(
			'log',
			[
				'type' => ['type' => 'enum', 'constraint' => "'BUTTON_PRESS', 'ERROR_GENERAL', 'ERROR_TIME_VALIDATION', 'KEY_PRESS', 'SCORE_ACTIVITY_FROM_CLIENT', 'SCORE_FINAL_FROM_CLIENT', 'SCORE_QUESTION_ANSWERED', 'SCORE_WIDGET_INTERACTION', 'WIDGET_CORE_INIT', 'WIDGET_END', 'WIDGET_LOAD_DONE', 'WIDGET_LOAD_START', 'WIDGET_LOGIN', 'WIDGET_PLAY_REQ', 'WIDGET_PLAY_START', 'WIDGET_RESTART', 'WIDGET_START', 'WIDGET_STATE', 'DATA'", 'null' => true]
			]
    );
  }
}
