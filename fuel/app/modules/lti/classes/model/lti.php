<?php

namespace Lti;

class Model_Lti extends \Orm\Model
{

	public static $_table_name = 'lti';

	protected static $_properties = [
		'id',
		'item_id',
		'resource_link',
		'consumer',
		'consumer_guid',
		'user_id',
		'name',
		'context_id',
		'context_title',
		'created_at',
		'updated_at'
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
}
