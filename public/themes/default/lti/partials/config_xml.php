<?= '<?xml version="1.0" encoding="UTF-8"?>' ?>
<cartridge_basiclti_link
	xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
	xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
	xmlns:lticm="http://www.imsglobal.org/xsd/imslticm_v1p0"
	xmlns:lticp="http://www.imsglobal.org/xsd/imslticp_v1p0"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0p1.xsd http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
	<blti:title><?= $title ?></blti:title>
	<blti:description><?= $description ?></blti:description>
	<blti:launch_url><?= $launch_url ?></blti:launch_url>
	<blti:extensions platform="<?= $platform ?>">
		<lticm:options name="course_navigation">
			<lticm:property name="enabled">true</lticm:property>
			<lticm:property name="url"><?= $login_url ?></lticm:property>
			<lticm:property name="visibility">public</lticm:property>
		</lticm:options>
		<lticm:options name="resource_selection">
			<lticm:property name="url"><?= $picker_url ?></lticm:property>
			<lticm:property name="text"><?= $title ?></lticm:property>
			<lticm:property name="selection_width">700</lticm:property>
			<lticm:property name="selection_height">600</lticm:property>
			<lticm:property name="enabled">true</lticm:property>
		</lticm:options>
		<lticm:property name="domain"><?= parse_url(Uri::base(false))['host']; ?></lticm:property>
		<lticm:property name="privacy_level"><?= $privacy_level ?></lticm:property>
		<lticm:property name="tool_id">materia_login</lticm:property>
	</blti:extensions>
</cartridge_basiclti_link>