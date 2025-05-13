import React from 'react';
import GetSupport from 'MateriaText/help/students/get-support.mdx'
import ForStudents from 'MateriaText/help/students/for-students.mdx'
import CommonQuestions from 'MateriaText/help/students/common-questions.mdx'

const HelpForStudents = () => {

	return (
		<>
			<section className='half-width'>
				<ForStudents />
			</section>
			<section className="half-width">
				<GetSupport />
			</section>
			<section className='full-width'>
				<CommonQuestions />
			</section>
		</>
	)
}

export default HelpForStudents
