<?= '<?xml version="1.0" encoding="UTF-8"?>' ?>
<cartridge_basiclti_link
	xmlns="https://www.imsglobal.org/xsd/imslticc_v1p0"
	xmlns:blti="https://www.imsglobal.org/xsd/imsbasiclti_v1p0"
	xmlns:lticm="https://www.imsglobal.org/xsd/imslticm_v1p0"
	xmlns:lticp="https://www.imsglobal.org/xsd/imslticp_v1p0"
	xmlns:xsi="https://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="https://www.imsglobal.org/xsd/imslticc_v1p0 https://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd https://www.imsglobal.org/xsd/imsbasiclti_v1p0 https://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0p1.xsd https://www.imsglobal.org/xsd/imslticm_v1p0 https://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd https://www.imsglobal.org/xsd/imslticp_v1p0 https://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
	<blti:title><?= $title ?></blti:title>
	<blti:description><?= $description ?></blti:description>
	<blti:launch_url><?= $launch_url ?></blti:launch_url>
	<blti:extensions platform="<?= $platform ?>">
		<lticm:options name="course_navigation">
			<lticm:property name="default"><?= $course_nav_default ?></lticm:property>
			<lticm:property name="enabled"><?= $course_nav_enabled ?></lticm:property>
			<lticm:property name="text"><?= $course_nav_text ?></lticm:property>
			<lticm:property name="url"><?= $login_url ?></lticm:property>
			<lticm:property name="visibility"><?= $course_nav_visibility ?></lticm:property>
		</lticm:options>
		<lticm:property name="domain"><?= parse_url(Uri::base(false))['host']; ?></lticm:property>
		<lticm:property name="privacy_level"><?= $privacy_level ?></lticm:property>
		<lticm:options name="resource_selection">
			<lticm:property name="enabled">true</lticm:property>
			<lticm:property name="selection_height">600</lticm:property>
			<lticm:property name="selection_width">700</lticm:property>
			<lticm:property name="text"><?= $title ?></lticm:property>
			<lticm:property name="url"><?= $picker_url ?></lticm:property>
		</lticm:options>
		<lticm:property name="tool_id"><?= $tool_id ?></lticm:property>
	</blti:extensions>
</cartridge_basiclti_link>
