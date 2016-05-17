#!/bin/bash
echo "swapping to UCF composer..."

if [ ! -f composer.json.default ] && [ ! -f composer.lock.default ]; then
	mv composer.json composer.json.default
	mv composer.lock composer.lock.default
	mv composer.json.ucf composer.json
	mv composer.lock.ucf composer.lock
	echo "Done, edit composer.json, run composer install, then swap Default composer back in"
else
	echo "Canceled, composer.json.default or composer.lock.default already exists"
fi
