<?php

namespace Fuel\Migrations;

class Add_Helper_To_Widget
{
    public function up()
    {
        \DBUtil::add_fields(
            'widget',
            [
                'helper' => [
                    'constraint' => 255, 
                    'type' => 'varchar',
                    'null' => true
                ],
            ]
        );
    }

    public function down()
    {
        \DBUtil::drop_fields('widget', 'helper');
    }
}