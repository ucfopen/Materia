import React from 'react';
import ForInstructors from 'MateriaText/help/instructors/for-instructors.mdx'
import CommonQuestions from 'MateriaText/help/instructors/common-questions.mdx'

const HelpForInstructors = () => {

	return (
		<>
			<section className='full-width'>
				<ForInstructors />
			</section>
			<section className='full-width'>
				<CommonQuestions />
			</section>
		</>
	)
}

export default HelpForInstructors
