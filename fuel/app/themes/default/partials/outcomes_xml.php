<?= '<?xml version = "1.0" encoding = "UTF-8"?>' ?>
<imsx_POXEnvelopeRequest xmlns = "http://www.imsglobal.org/lis/oms1p0/pox">
	<imsx_POXHeader>
		<imsx_POXRequestHeaderInfo>
			<imsx_version>V1.0</imsx_version>
			<imsx_messageIdentifier><?= $message ?></imsx_messageIdentifier>
		</imsx_POXRequestHeaderInfo>
	</imsx_POXHeader>
	<imsx_POXBody>
		<replaceResultRequest>
			<resultRecord>
				<sourcedGUID>
					<sourcedId><?= $source_id ?></sourcedId>
				</sourcedGUID>
				<result>
					<resultScore>
						<language>en</language>
						<textString><?= $score ?></textString>
					</resultScore>
					<?php if ($extension_type && $extension_value): ?>

						<resultData>
							<<?= $extension_type ?>><?= $extension_value ?></<?= $extension_type ?>>
						</resultData>
					<?php endif ?>
				</result>
			</resultRecord>
		</replaceResultRequest>
	</imsx_POXBody>
</imsx_POXEnvelopeRequest>
