<?php

namespace Fuel\Migrations;

class Add_is_generable_field_to_widget_table
{
    public function up()
    {
        \DBUtil::add_fields('widget', array(
            'is_generable' => ['constraint' => "'0','1'", 'type' => 'enum', 'default' => '0'],
        ));
    }

    public function down()
    {
        \DBUtil::drop_fields('widget', array(
            'is_generable',
        ));
    }
}
