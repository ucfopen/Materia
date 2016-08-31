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
	];

	protected static $_observers = [
		'Orm\Observer_CreatedAt' => [
			'events' => array('before_insert'),
			'mysql_timestamp' => false,
		],
		'Orm\Observer_UpdatedAt' => [
			'events' => array('before_save'),
			'mysql_timestamp' => false,
		],
	];

	public static function on_widget_delete_event($assoc_param_array)
	{
		$from_user_id = $assoc_param_array['user_id'];
		$object_id    = $assoc_param_array['object_id'];
		$object_type  = $assoc_param_array['object_type'];

		// user_ids for all users that have permissions to this widget
		$user_ids = array_keys(\Materia\Perm_Manager::get_all_users_explicit_perms($object_id, $object_type)['widget_user_perms']);

		foreach ($user_ids as $user_id)
		{
			\Model_Notification::send_item_notification($from_user_id, $user_id, $object_type, $object_id, 'deleted');
		}
	}

	/**
	 * Generates a notification and places it in the database.
	 *
	 * @param int User ID of sender.
	 * @param int User ID of recipient.
	 * @param int Integer referring to item type (widget, asset, etc.).
	 * @param int ID of the item referred to in the notification.
	 * @param string The condition of the notification, i.e. 'enabled', 'disabled', or 'changed'.
	 * @param int Integer referring to the enabled permission, currently only 30 (view) or 0 (own).
	 * @param string (Optional) Customized message to attach to the notificaton, default is no message.
	 * @param bool (Optional) Determines whether or not to send an e-mail along with notification, default is false.
	 */
	public static function send_item_notification($from_user_id, $to_user_id, $item_type, $inst_id, $mode='', $new_perm='')
	{
		// if the user has the email notifications setting turned on
		$user_meta = \Model_User::find($to_user_id)->profile_fields;
		$send_email = ( ! empty($user_meta['notify']));

		switch ($item_type)
		{
			case \Materia\Perm::INSTANCE:
				if ($from_user_id == $to_user_id) return false; //no need to self-notify

				$user = \Model_User::find($from_user_id);

				$inst = new \Materia\Widget_Instance();
				$inst->db_get($inst_id, false);

				$user_link   = $user->first.' '.$user->last.' ('.$user->username.')';
				$widget_link = Html::anchor(\Config::get('materia.urls.root').'my-widgets/#'.$inst_id, $inst->name);
				$widget_name = $inst->name;
				$widget_type = $inst->widget->name;

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

					default:
						return false;
				}
				break;

			case \Materia\Perm::DOCUMENT:
				$inst = new \Materia\Widget_Instance();
				$inst->db_get($inst_id, false);
				$inst->widget->name;

				$filename = basename($mode);
				$link = \File::get_url($filename, [], 'documents');
				$subject = "Your data export for \"<b>{$inst->name}</b>\" ({$inst->widget->name}) is ready.</br><a target=\"_blank\" rel=\"noopener noreferrer\" href=\"{$link}\">Download {$filename}</a>";

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
		]);

		$notification->save();

		if ($send_email) \Model_Notification::send_email_notifications();

		return true;
	}

		/**
	 * Send an e-mail copy of the given notification.
	 *
	 * @param int ID of the notification to send an e-mail for.
	 */
	protected static function send_email_notifications()
	{
		if ( ! \Config::get('materia.send_emails', true)) return;

		\Package::load('email');
		$email = \Email::forge();

		$notes = \Model_Notification::query()
			->where('is_email_sent', '0')
			->limit(100)
			->get();

		foreach ($notes as $note)
		{
			$from = \Model_User::find($note->from_id);
			$to = \Model_User::find($note->to_id);

			$email->from(\Config::get('materia.system_email'), $from->first.' '.$from->last);
			$email->reply_to($from->email,$from->first.' '.$from->last);
			$email->to($to->email, $to->first.' '.$to->last);
			$email->subject(\Config::get('materia.name').' Notification');
			$email->html_body($note->subject);

			try
			{
				$email->send();
				$note->is_email_sent = '1';
				$note->save();
			}
			catch (\EmailValidationFailedException $e)
			{
				trace('VALIDATION ERROR');
				trace($e);
			}
			catch (\EmailSendingFailedException $e)
			{
				trace('SEND ERROR');
				trace($e);
			}
		}
	}
}