#!/bin/bash
echo "swapping back to Default composer..."


if [ ! -f composer.json.ucf ] && [ ! -f composer.lock.ucf ]; then
	mv composer.json composer.json.ucf
	mv composer.lock composer.lock.ucf
	mv composer.json.default composer.json
	mv composer.lock.default composer.lock

	echo "Ok, you should be able to commit your changes to composer.*.ucf files!"
else
	echo "Canceled, composer.json.ucf or composer.lock.ucf already exists"
fi
