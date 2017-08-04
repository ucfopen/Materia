<?= '<?xml version="1.0"?>' ?>
<!DOCTYPE cross-domain-policy SYSTEM "http://www.macromedia.com/xml/dtds/cross-domain-policy.dtd">
<cross-domain-policy>
	<?php foreach (\Config::get('materia.crossdomain', []) as $domain) : ?>
		<allow-access-from domain="<?= $domain ?>" />
	<?php endforeach; ?>
	<allow-http-request-headers-from domain="*" headers="Authorization"/>
	<site-control permitted-cross-domain-policies="master-only" />
</cross-domain-policy>
