<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Scores extends Controller
{
	use Trait_CommonControllerTemplate;

	// Allow LTI launches to score screens
	// In canvas, this is shown on the grade review
	// enabled by launch param ext_outcome_data_values_accepted=url
	public function action_single(string $play_id, string $inst_id)
	{
		$play = new \Materia\Session_Play();
		$play_found = $play->get_by_id($play_id);
		if ( ! $play_found) throw new HttpNotFoundException;
		if ($play->inst_id !== $inst_id) throw new HttpNotFoundException;

		$redirect = null;

		// allow event listeners to redirect users
		// this is mostly to redirect them to failure status pages
		$results = \Event::trigger('before_single_score_review', ['play_id' => $play_id, 'content_id' => $play->context_id], 'array');
		$is_embedded = false;
		foreach ($results as $result)
		{
			// allow events to redirect
			if ( ! empty($result['redirect']))
			{
				$redirect = $result['redirect'];
			}
			if ( ! empty($result['is_embedded']))
			{
				$is_embedded = true;
			}
		}

		if ($redirect)
		{
			return Response::redirect($redirect);
		}

		$this->get_show($play->inst_id, $is_embedded);
	}

	public function get_show(string $inst_id, bool $is_embedded = false)
	{
		// locate instance
		$instances = Materia\Api::widget_instances_get([$inst_id]);
		if ( ! isset($instances[0])) throw new HttpNotFoundException;

		$inst = $instances[0];
		// not allowed to play the widget
		if ( ! $inst->playable_by_current_user())
		{
			Session::set_flash('notice', 'Please log in to view your scores.');
			Response::redirect(Router::get('login').'?redirect='.urlencode(URI::current()));
		}

		Css::push_group(['core', 'scores']);

		Js::push_group(['angular', 'materia', 'student', 'labjs']);

		$token = \Input::get('token', false);
		if ($token)
		{
			Js::push_inline('var LAUNCH_TOKEN = "'.$token.'";');
		}

		if ($is_embedded) $this->_header = 'partials/header_empty';

		$this->theme->get_template()
			->set('title', 'Score Results')
			->set('page_type', 'scores');

		$this->theme->set_partial('footer', 'partials/angular_alert');
		$this->theme->set_partial('content', 'partials/score/full');
	}

	public function get_show_embedded(string $inst_id)
	{
		$this->get_show($inst_id, true);
	}
}
