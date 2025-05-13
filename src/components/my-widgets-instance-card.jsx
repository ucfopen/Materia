import React from 'react'
import createHighlightSpan from '../util/create-highlight-span'

const MyWidgetsInstanceCard = ({inst, indexVal, hidden = false, selected = false, onClick = () => {}, beard = null, searchText = null}) => {
	const {id, widget, name, is_draft, img} = inst
	// Handle multiple conditional classes by keeping an array of all classes to apply, then imploding it in the render
	const classes = ['my-widgets-instance-card', 'widget']
	if (hidden) classes.push('hidden')
	if (is_draft) classes.push('is_draft')
	if (beard) classes.push('bearded', `small_${beard}`)
	if (selected) classes.push('selected')

	// Default widget/instance names to plain text
	let nameTextRender = name
	let widgetNameTextRender = widget.name
	// This will convert one or both of the regular strings into HTML strings containing
	//  spans with styled classes on them, requiring us to use dangerouslySetInnerHTML below
	if ( !hidden && searchText) {
		nameTextRender = createHighlightSpan(nameTextRender, searchText)
		widgetNameTextRender = createHighlightSpan(widgetNameTextRender, searchText)
	}

	const clickHandler = () => {
		return onClick(inst, indexVal)
	}

	const keyInputHandler = (evt) => {
		if (evt.key == 'Enter' || evt.key == ' ') return onClick(inst, indexVal)
	}

	return (
		<div id={`widget_${id}`}
			role='tab'
			tabIndex='0'
			className={classes.join(' ')}
			onClick={clickHandler}
			onKeyDown={keyInputHandler}>
			<img className='icon' src={img} />
			<ul>
				<li className='title searchable'
					dangerouslySetInnerHTML={{ __html: nameTextRender }}>
				</li>
				<li className='type searchable'
					dangerouslySetInnerHTML={{ __html: widgetNameTextRender }}>
				</li>
				<li className='score'>
					{is_draft ? 'Draft' : ''}
				</li>
			</ul>
		</div>
	)
}

export default MyWidgetsInstanceCard
