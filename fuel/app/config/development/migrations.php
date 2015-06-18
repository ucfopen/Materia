<?php
return array(
  'version' => 
  array(
    'app' => 
    array(
      'default' => 
      array(
        0 => '001_create_asset',
        1 => '002_create_date_range',
        2 => '003_create_log',
        3 => '004_create_log_activity',
        4 => '005_create_log_play',
        5 => '006_create_log_storage',
        6 => '007_create_map_asset_to_object',
        7 => '008_create_map_object_to_role_perm',
        8 => '009_create_map_question_to_qset',
        9 => '010_create_notification',
        10 => '011_create_perm_object_to_user',
        11 => '012_create_perm_role_to_user',
        12 => '013_create_perm_role_to_perm',
        13 => '014_create_question',
        14 => '015_create_user',
        15 => '016_create_user_meta',
        16 => '017_create_user_role',
        17 => '018_create_widget',
        18 => '019_create_widget_instance',
        19 => '020_create_widget_metadata',
        20 => '021_create_widget_qset',
        21 => '022_clean_user_metadata',
        22 => '023_add_guest_access_to_widget_instance',
      ),
    ),
    'module' => 
    array(
      'lti' => 
      array(
        0 => '001_create_lti',
      ),
    ),
    'package' => 
    array(
      'auth' => 
      array(
        0 => '001_auth_create_usertables',
        1 => '002_auth_create_grouptables',
        2 => '003_auth_create_roletables',
        3 => '004_auth_create_permissiontables',
        4 => '005_auth_create_authdefaults',
        5 => '006_auth_add_authactions',
        6 => '007_auth_add_permissionsfilter',
        7 => '008_auth_create_providers',
        8 => '009_auth_create_oauth2tables',
        9 => '010_auth_fix_jointables',
      ),
    ),
  ),
  'folder' => 'migrations/',
  'table' => 'migration',
);
