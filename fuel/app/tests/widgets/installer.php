<?php
/**
 * @group App
 * @group Installer
 * @group Materia
 */

use \Materia\Widget_Installer;

class Test_Widget_Installer extends \Basetest
{

	public function test_generate_install_params()
	{

		$manifest_data = [
			'general' => [
				'name'                => 'THIS IS A Name!',
				'height'              => 55,
				'width'               => 100,
				'is_qset_encrypted'   => false,
				'is_answer_encrypted' => true,
				'is_storage_enabled'  => '1',
				'is_playable'         => '0',
				'is_editable'         => 'true',
				'in_catalog'          => 'false',
				'api_version'         => '2',
			],
			'score' => [
				'score_module' => 'scoreModule',
				'is_scorable'  => 1,
			],
			'files' => [
				'flash_version' => 3,
				'creator' => 'creator.html',
				'player' => 'player.html',
			]
		];

		$expected = [
			'name' => 'THIS IS A Name!',
			'flash_version' => 3,
			'height' => 55,
			'width' => 100,
			'restrict_publish' => '0',
			'is_qset_encrypted' => '0',
			'is_answer_encrypted' => '1',
			'is_storage_enabled' => '1',
			'is_playable' => '0',
			'is_editable' => '0',
			'is_scorable' => '1',
			'in_catalog' => '0',
			'clean_name' => 'this-is-a-name',
			'api_version' => '2',
			'score_module' => 'scoreModule',
			'creator' => 'creator.html',
			'player' => 'player.html',
			'score_screen' => '',
			'creator_guide' => '',
			'player_guide' => ''
		];

		$result = Widget_Installer::generate_install_params($manifest_data, __FILE__);

		self::assertArrayHasKey('package_hash', $result);
		unset($result['package_hash']);

		self::assertArrayHasKey('created_at', $result);
		unset($result['created_at']);

		self::assertEquals($result, $expected);
	}
}
