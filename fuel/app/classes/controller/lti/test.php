<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Lti_Test extends \Controller_Rest
{

	public function before()
	{
		if (\Fuel::$env == \Fuel::PRODUCTION)
		{
			trace('These tests are not available in production mode');
			throw new \HttpNotFoundException;
		}
		\Js::push_group('jquery');
		parent::before();
	}

	// This will print out any get params it receives
	public function get_dump_launch_presentation_return()
	{
		echo 'These GET vars were sent back to the launch_presentation_return_url';
		echo '<pre>';
		print_r(\Input::get());
		echo '</pre>';
	}

	public function get_sign_and_launch()
	{
		$params   = \Input::get();

		$use_bad_signature = isset($params['use_bad_signature']);
		unset($params['use_bad_signature']);

		if (isset($params['use_random_user']))
		{
			unset($params['use_random_user']);
			$role = 'LEARNER';
			if (isset($params['roles']) && strpos($params['roles'], 'Instructor') !== false)
			{
				$role = 'INSTRUCTOR';
			}
			$random_number = rand(0, 100000);
			$name = "_LTI_{$role}_{$random_number}";
			$params['user_id']                          = $random_number;
			$params['custom_canvas_user_id']            = $random_number;
			$params['lis_person_sourcedid']             = $name;
			$params['lis_person_contact_email_primary'] = "{$name}@mailinator.com";
			$params['lis_person_name_given']            = $name;
			$params['lis_person_name_family']           = $name;
		}

		if (isset($params['use_no_email']))
		{
			unset($params['lis_person_contact_email_primary']);
			unset($params['use_no_email']);
		}

		$endpoint = $params['endpoint'];
		$secret = \Config::get('lti.consumers.default.secret');
		$hmcsha1  = new \Eher\OAuth\HmacSha1();
		$consumer = new \Eher\OAuth\Consumer('', $secret);
		$request  = \Eher\OAuth\Request::from_consumer_and_token($consumer, null, 'POST', $endpoint, $params);
		$request->sign_request($hmcsha1, $consumer, '');
		$signed_params = $request->get_parameters();
		if ($use_bad_signature)
		{
			$signed_params['oauth_signature'] = 'THIS_IS_A_BAD_SIGNATURE';
		}

		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/lti_sign_and_launch')
			->set_safe(['post' => json_encode($signed_params)]);

		return \Response::forge(\Theme::instance()->render());
	}

	public function get_embed()
	{
		$embed_type = \Input::get('embed_type', false);
		$url = \Input::get('url');

		if ( $embed_type != 'basic_lti' ) return;

		$widget = str_replace(\Uri::base(false).'embed/', '', $url);
		$parts = explode('/', $widget);

		//check to see if we have an LTI association for this widget already
		// normally we would only check for 'resource_link', since an assignment can't have more than one widget associated with it
		// but for the purpose of the LTI test provider, we'll relax that requirement
		$check = Model_Lti::query()
			->where('resource_link', 'test-resource')
			->where('item_id', $parts[0])
			->get_one();

		if (empty($check))
		{
			$user = \Model_User::find_current();

			$assoc = Model_Lti::forge();
			$assoc->resource_link = 'test-resource';
			$assoc->consumer_guid = 'test';
			$assoc->item_id       = $parts[0];
			$assoc->user_id       = $user->id;
			$assoc->consumer      = 'default';
			$assoc->name          = $user->first.' '.$user->last;
			$assoc->context_id    = 'test_context';
			$assoc->context_title = 'test_context';
			$assoc->save();
		}

		return \Response::redirect("/lti/success/{$parts[0]}?embed_type={$embed_type}&url={$url}");
	}

	// Generate a bunch of sample lti launch examples to test
	public function get_provider()
	{
		$assignment_url = \Uri::create('lti/assignment');
		$picker_url = \Uri::create('lti/picker');
		$validate_url = \Uri::create('lti/test/validate');
		$login_url = \Uri::create('lti/login');
		$play_launch_url_modern_embed = \Uri::create('embed').'/HASH_ID/HUMAN-FRIENDLY-NAME';
		$play_launch_url_modern_play = \Uri::create('play').'/HASH_ID/HUMAN-FRIENDLY-NAME';
		$play_launch_url_legacy = \Uri::create('lti/assignment').'?widget=HASH_ID';

		$base_params = [
			'resource_link_id'                       => 'test-resource',
			'context_id'                             => 'test-context',
			'lis_result_sourcedid'                   => 'test-source-id',
			'roles'                                  => 'Instructor',
			'oauth_consumer_key'                     => \Config::get('lti.consumers.default.key'),
			'lti_message_type'                       => 'basic-lti-launch-request',
			'tool_consumer_instance_guid'            => 999999,
			'tool_consumer_info_product_family_code' => 'materia_test',
			'tool_consumer_instance_contact_email'   => 'SYSTEM@mailinator.com',
			'launch_presentation_document_target'    => 'iframe',
			'user_id'                                => 999999,
			'custom_canvas_user_id'                  => 999999,
			'lis_person_sourcedid'                   => '_LTI_INSTRUCTOR_',
			'lis_person_contact_email_primary'       => '_LTI_INSTRUCTOR_@mailinator.com',
			'lis_person_name_given'                  => '_LTI_INSTRUCTOR_',
			'lis_person_name_family'                 => '_LTI_INSTRUCTOR_',
			'custom-inst-id'                         => '',
			'selection_directive'                    => '',
		];

		$launch_args = [
			'LTI Assignment Launch' => [
				[
					'label' => 'As Learner (bad signature)',
					'params' => array_merge($base_params, [
						'lti_url'                          => 'lti_url',
						'resource_link'                    => 'use_bad_signature',
						'roles'                            => 'Learner',
						'user_id'                          => 1111111,
						'lis_person_sourcedid'             => '_LTI_LEARNER_',
						'lis_person_contact_email_primary' => '_LTI_LEARNER_@mailinator.com',
						'lis_person_name_given'            => '_LTI_LEARNER_',
						'lis_person_name_family'           => '_LTI_LEARNER_',
						'use_bad_signature'                => true
					]),
					'endpoint' => $assignment_url,
				],
				[
					'label' => 'As Learner',
					'params' => array_merge($base_params, [
						'lti_url'                          => 'lti_url',
						'custom_widget_instance_id'        => 'custom_widget_instance_id',
						'resource_link'                    => 'use_bad_signature',
						'roles'                            => 'Learner',
						'user_id'                          => 1111111,
						'lis_person_sourcedid'             => '_LTI_LEARNER_',
						'lis_person_contact_email_primary' => '_LTI_LEARNER_@mailinator.com',
						'lis_person_name_given'            => '_LTI_LEARNER_',
						'lis_person_name_family'           => '_LTI_LEARNER_',
					]),
					'endpoint' => $assignment_url,
				],
				[
					'label' => 'As Random New Learner',
					'params' => array_merge($base_params, [
						'lti_url'         => 'lti_url',
						'resource_link'   => 'lti_test_launch1',
						'roles'           => 'Learner',
						'user_id'                          => 1111111,
						'lis_person_sourcedid'             => '_LTI_LEARNER_',
						'lis_person_contact_email_primary' => '_LTI_LEARNER_@mailinator.com',
						'lis_person_name_given'            => '_LTI_LEARNER_',
						'lis_person_name_family'           => '_LTI_LEARNER_',
						'use_random_user' => true
					]),
					'endpoint' => $assignment_url,
				],
				[
					'label' => 'As Random New Learner without an email address',
					'params' => array_merge($base_params, [
						'lti_url'         => 'lti_url',
						'resource_link'   => 'lti_test_launch2',
						'roles'           => 'Learner',
						'user_id'                          => 1111111,
						'lis_person_sourcedid'             => '_LTI_LEARNER_',
						'lis_person_contact_email_primary' => '_LTI_LEARNER_@mailinator.com',
						'lis_person_name_given'            => '_LTI_LEARNER_',
						'lis_person_name_family'           => '_LTI_LEARNER_',
						'use_random_user' => true,
						'use_no_email'    => true,
					]),
					'endpoint' => $assignment_url,
				],
				[
					'label' => 'As the guest/test student',
					'params' => array_merge($base_params, [
						'lti_url'                          => 'lti_url',
						'custom_widget_instance_id'        => 'custom_widget_instance_id',
						'resource_link'                    => 'lti_test_launch3',
						'roles'                            => 'Learner',
						'user_id'                          => 1111111,
						'lis_person_sourcedid'             => '_LTI_LEARNER_',
						'lis_person_contact_email_primary' => '_LTI_LEARNER_@mailinator.com',
						'lis_person_name_given'            => '_LTI_LEARNER_',
						'lis_person_name_family'           => '_LTI_LEARNER_',
						'lis_person_sourcedid'             => '',
						'lis_person_contact_email_primary' => 'notifications@instructure.com',
						'lis_person_name_given'            => 'Test',
						'lis_person_name_family'           => 'Student',

					]),
					'endpoint' => $assignment_url,
				],
				[
					'label' => 'As An Instructor',
					'params' => array_merge($base_params, [
						'lti_url'                   => 'lti_url',
						'custom_widget_instance_id' => 'custom_widget_instance_id',
						'resource_link'             => 'lti_test_launch4',
					]),
					'endpoint' => $assignment_url,
				],
				[
					'label' => 'As A Random New Instructor',
					'params' => array_merge($base_params, [
						'lti_url'                   => 'lti_url',
						'custom_widget_instance_id' => 'custom_widget_instance_id',
						'resource_link'             => 'lti_test_launch5',
						'use_random_user' => true,
					]),
					'endpoint' => $assignment_url,
				],
			],
			'LTI Navigation Launch' => [
				[
					'label' => 'Launch as instructor',
					'params' => array_merge($base_params, [
						'selection_directive'              => 'select_link',
					]),
					'endpoint' => $login_url,
				],
				[
					'label' => 'As Random New Learner',
					'params' => array_merge($base_params, [
						'selection_directive'              => 'select_link',
						'lti_url'                          => 'lti_url',
						'resource_link'                    => 'lti_test_launch1',
						'roles'                            => 'Learner',
						'user_id'                          => 1111111,
						'lis_person_sourcedid'             => '_LTI_LEARNER_',
						'lis_person_contact_email_primary' => '_LTI_LEARNER_@mailinator.com',
						'lis_person_name_given'            => '_LTI_LEARNER_',
						'lis_person_name_family'           => '_LTI_LEARNER_',
						'use_random_user'                  => true
					]),
					'endpoint' => $login_url,
				],
				[
					'label' => 'Launch as instructor (bad signature)',
					'params' => array_merge($base_params, [
						'selection_directive'            => 'select_link',
						'use_bad_signature'              => true,
					]),
					'endpoint' => $login_url,
				],
			],
			'LTI Picker Launch' => [
				[
					'label' => 'Launch as instructor',
					'params' => array_merge($base_params, [
						'launch_presentation_return_url' => \Uri::create('lti/test/embed'),
						'selection_directive'            => 'select_link',
					]),
					'endpoint' => $picker_url,
				],
				[
					'label' => 'Launch as Random New Instructor',
					'params' => array_merge($base_params, [
						'launch_presentation_return_url' => \Uri::create('lti/test/embed'),
						'selection_directive'            => 'select_link',
						'use_random_user'                => true
					]),
					'endpoint' => $picker_url,
				],
				[
					'label' => 'Launch as instructor (bad signature)',
					'params' => array_merge($base_params, [
						'launch_presentation_return_url' => \Uri::create('lti/test/embed'),
						'selection_directive'            => 'select_link',
						'use_bad_signature'              => true,
					]),
					'endpoint' => $picker_url,
				],

				[
					'label' => 'Launch as instructor - assignment url for sakai',
					'params' => array_merge($base_params, [
						'launch_presentation_return_url' => \Uri::create('lti/test/embed'),
						'selection_directive'            => 'ContentItemSelectionRequest',
					]),
					'endpoint' => $assignment_url,
				],
				[
					'label' => 'Launch as Random New Instructor - assignment url for sakai',
					'params' => array_merge($base_params, [
						'launch_presentation_return_url' => \Uri::create('lti/test/embed'),
						'selection_directive'            => 'ContentItemSelectionRequest',
						'use_random_user'                => true
					]),
					'endpoint' => $assignment_url,
				],
				[
					'label' => 'Launch as instructor (bad signature) - assignment url for sakai',
					'params' => array_merge($base_params, [
						'launch_presentation_return_url' => \Uri::create('lti/test/embed'),
						'selection_directive'            => 'ContentItemSelectionRequest',
						'use_bad_signature'              => true,
					]),
					'endpoint' => $assignment_url,
				],
			],
			'Other' => [
				[
					'label' => 'Test Validation',
					'params' => $base_params,
					'endpoint' => $validate_url,
				],
				[
					'label' => 'Test Validation (bad signature)',
					'params' => array_merge($base_params, [
						'use_bad_signature' => true,
					]),
					'endpoint' => $validate_url,
				],
				[
					'label' => 'Unknown Assignment Error',
					'params' => array_merge($base_params, ['resource_link_id' => 'this-will-not-work']),
					'endpoint' => $assignment_url,
				],
			]
		];

		$this->theme = \Theme::instance();
		$this->theme->set_template('layouts/test_provider')
			->set([
				'launch_args' => $launch_args,
				'base_params' => $base_params,
				'endpoints' => [
					'assignment_url'    => $assignment_url,
					'picker_url'        => $picker_url,
					'validate_url'      => $validate_url,
					'login_url'         => $login_url,
					'modern_play_embed' => $play_launch_url_modern_embed,
					'modern_play'       => $play_launch_url_modern_play,
					'legacy_play'       => $play_launch_url_legacy,
				]
			]);

		return \Response::forge(\Theme::instance()->render());
	}

	// Reports if OAuth is able to validate the signature
	public function post_validate()
	{
		echo 'LTI OAuth Validation '.(\Oauth::validate_post() ? 'PASSED!' : 'FAILED');
		echo '<pre>';
		print_r(\Input::post());
		echo '</pre>';
	}

}
