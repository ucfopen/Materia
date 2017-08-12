<?php
/**
 * Materia
 * License outlined in licenses folder
 */

class Controller_Admin extends Controller
{

	use Trait_CommonControllerTemplateTrait {
		before as public common_before;
	}

	public function before()
	{
		$this->common_before();
		Css::push_group('admin');
		Js::push_group(['angular', 'ng_modal', 'jquery', 'materia', 'admin', 'author', 'student']);
	}

	public function get_widget()
	{
		$this->theme->get_template()->set('title', 'Widget Admin');
		$this->theme->set_partial('content', 'partials/admin/widget');
	}

	public function get_user()
	{
		$this->theme->get_template()->set('title', 'User Admin');
		$this->theme->set_partial('content', 'partials/admin/user');
	}
}
