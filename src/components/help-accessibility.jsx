import React from 'react';
import Commitment from 'MateriaText/help/accessibility/commitment.mdx'
import StandardsAndCompliance from 'MateriaText/help/accessibility/standards-and-compliance.mdx'
import AccessibilityFeatures from 'MateriaText/help/accessibility/accessibility-features.mdx'
import SupportedAssistiveTechnologies from 'MateriaText/help/accessibility/supported-assistive-technologies.mdx'
import WidgetAccessibilitySpecifications from 'MateriaText/help/accessibility/widget-accessibility-specifications.mdx'
import OngoingAccessibilityEfforts from 'MateriaText/help/accessibility/ongoing-accessibility-efforts.mdx'
import ReportIssues from 'MateriaText/help/accessibility/report-issues.mdx'
import LegalDisclaimer from 'MateriaText/help/accessibility/legal.mdx'

const HelpAccessibility = () => {

	return (
		<>
			<section className='full-width'>
				<Commitment />
				<StandardsAndCompliance />
			</section>
			<section className='half-width'>
				<AccessibilityFeatures />
				<SupportedAssistiveTechnologies />
			</section>
			<section className='half-width'>
				<WidgetAccessibilitySpecifications />
				<OngoingAccessibilityEfforts />
			</section>
			<section className='full-width'>
				<ReportIssues />
				<LegalDisclaimer />
			</section>
		</>
	)
}

export default HelpAccessibility
