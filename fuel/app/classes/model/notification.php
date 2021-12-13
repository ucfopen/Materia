<?php

class Model_Notification extends \Orm\Model
{

	protected static $_table_name = 'notification';

	protected static $_properties = [
		'id',
		'from_id',
		'to_id',
		'item_type',
		'item_id',
		'is_email_sent',
		'is_read',
		'subject',
		'avatar',
		'created_at',
		'updated_at',
		'action'
	];

	protected static $_observers = [
		'Orm\Observer_CreatedAt' => [
			'events' => ['before_insert'],
			'mysql_timestamp' => false,
		],
		'Orm\Observer_UpdatedAt' => [
			'events' => ['before_save'],
			'mysql_timestamp' => false,
		],
	];

	public static function on_widget_delete_event($event_args)
	{
		$from_user_id = $event_args['deleted_by_id'];
		$inst_id      = $event_args['inst_id'];

		// user_ids for all users that have permissions to this widget
		$perms = \Materia\Perm_Manager::get_all_users_with_perms_to($inst_id , \Materia\Perm::INSTANCE);
		$user_ids = array_keys($perms);

		foreach ($user_ids as $to_user_id)
		{
			\Model_Notification::send_item_notification($from_user_id, $to_user_id, \Materia\Perm::INSTANCE, $inst_id, 'deleted');
		}
	}

	/**
	 * Generates a notification and places it in the database.
	 *
	 * @param int User ID of sender.
	 * @param int User ID of recipient.
	 * @param int Integer referring to item type (widget, asset, etc.).
	 * @param string ID of the item referred to in the notification.
	 * @param string The condition of the notification, i.e. 'enabled', 'disabled', or 'changed'.
	 * @param int Integer referring to the enabled permission, currently only 30 (view) or 0 (own).
	 * @param string (Optional) Customized message to attach to the notificaton, default is no message.
	 * @param bool (Optional) Determines whether or not to send an e-mail along with notification, default is false.
	 */
	public static function send_item_notification(int $from_user_id, int $to_user_id, int $item_type, string $inst_id, string $mode = null, int $new_perm = null): bool
	{
		if ($from_user_id == $to_user_id) return false; //no need to self-notify

		// if the user has the email notifications setting turned on
		$user_meta = \Model_User::find($to_user_id)->profile_fields;
		$send_email = ( ! empty($user_meta['notify']));

		switch ($item_type)
		{
			case \Materia\Perm::INSTANCE:
				$from = static::get_user_or_system($from_user_id);
				$inst = new \Materia\Widget_Instance();
				$inst->db_get($inst_id, false);

				$user_link = $from->first.' '.$from->last.' ('.$from->username.')';
				$widget_link = Html::anchor(\Config::get('materia.urls.root').'my-widgets#/'.$inst_id, $inst->name);
				$widget_name = $inst->name;
				$widget_type = $inst->widget->name;

				$action = '';

				switch ($new_perm)
				{
					case \Materia\Perm::FULL:
						$perm_string = 'Full';
						break;

					case \Materia\Perm::VISIBLE:
						$perm_string = 'View Scores';
						break;
				}

				switch ($mode)
				{
					case 'disabled':
						$subject = "<b>$user_link is no longer sharing \"$widget_name\" with you.</b>";
						break;

					case 'changed':
						$subject = "<b>$user_link changed your access to widget \"$widget_link\".</b><br/> You now have $perm_string access.";
						break;

					case 'expired':
						$subject = "<b>Your access to \"$widget_name\" has automatically expired.</b>";
						break;

					case 'deleted':
						$subject = "<b>$user_link deleted $widget_type widget \"$widget_name\".</b>";
						break;

					case 'access_request':
						$subject = "<b>$user_link is requesting access to your widget \"$widget_name\".</b><br /> The widget is currently being used within a course in your LMS.";
						$action = 'access_request';
						break;

					default:
						return false;
				}
				break;

			case \Materia\Perm::ASSET:
			case \Materia\Perm::QUESTION:
			default:
				return false;
		}

		$notification = \Model_Notification::forge([
			'from_id'       => $from_user_id,
			'to_id'         => $to_user_id,
			'item_type'     => $item_type,
			'item_id'       => $inst_id,
			'is_email_sent' => ($send_email ? '0' : '1'),
			'is_read'       => '0',
			'subject'       => $subject,
			'avatar'        => \Materia\Utils::get_avatar(50),
			'action'        => $action
		]);

		$notification->save();

		if ($send_email) $notification->send_email();

		return true;
	}

	/**
	 * Send an e-mail copy of the given notification.
	 *
	 * @param int ID of the notification to send an e-mail for.
	 */
	public function send_email()
	{
		if ( ! \Config::get('materia.send_emails', true)) return;

		\Package::load('email');
		$email = \Email::forge();

		$from = static::get_user_or_system($this->from_id);
		$to = \Model_User::find($this->to_id);

		$email->from(\Config::get('materia.system_email'), $from->first.' '.$from->last);
		$email->reply_to($from->email, $from->first.' '.$from->last);
		$email->to($to->email, $to->first.' '.$to->last);
		$email->subject(\Config::get('materia.name').' Notification');
		$email->html_body($this->subject);

		try
		{
			$email->send();
			$this->is_email_sent = '1';
			$this->save();
		}
		catch (\EmailValidationFailedException $e)
		{
			trace('EMAIL VALIDATION ERROR');
			trace($e->getMessage());
		}
		catch (\EmailSendingFailedException $e)
		{
			trace('EMAIL SEND ERROR');
			trace($e->getMessage());
		}
	}

	public static function get_user_or_system($user_id)
	{
		// 0 indicates the message is from a system event
		if ($user_id === 0)
		{
			// create a mock user
			return (object)[
				'first' => 'Materia',
				'last' => '',
				'email' => \Config::get('materia.system_email'),
				'username' => 'Server'
			];
		}

		return \Model_User::find($user_id);
	}
}
