from django.conf import settings
from django.contrib.auth.decorators import login_required, permission_required
from django.core import serializers
from django.http import JsonResponse, HttpResponseServerError

import json

import logging
logger = logging.getLogger('django')

class UsersApi:
    def get(request):
        return JsonResponse({})
'''
static public function user_get($user_ids = null)
	{
		if (\Service_User::verify_session() !== true) return Msg::no_login();
		$results = [];

		//no user ids provided, return current user
		if ($user_ids === null)
		{
			//$results = \Model_User::find_current();
			$me = \Model_User::find_current_id();
			$results = \Model_User::find($me);
			$results = $results->to_array();
		}
		else
		{
			if (empty($user_ids) || ! is_array($user_ids)) return Msg::invalid_input();
			//user ids provided, get all of the users with the given ids
			$me = \Model_User::find_current_id();

			foreach ($user_ids as $id)
			{
				if (Util_Validator::is_pos_int($id))
				{
					$user = \Model_User::find($id);
					$user = $user->to_array();
					$user['isCurrentUser'] = ($id == $me);
					$results[] = $user;
				}
			}
		}
		return $results;
	}
'''
