/**
 * It's a React component that takes in a parseMethod function and a children component, and returns a
 * div that handles the drag and drop events.
 * @param parseMethod is the method pass
 * @param idStr the id for the div component.
 */
const DragAndDrop = ({ children, parseMethod, idStr }) => {
	const handleDragEvent = (ev) => {
		ev.preventDefault()
		ev.stopPropagation()
	}

	const handleOnChange = (ev) => {
		ev.preventDefault()
		ev.stopPropagation()
		parseMethod(ev) // parse function
	}

	return (
		<div
			id={idStr}
			onDragEnter={(ev) => {
				handleDragEvent(ev)
			}}
			onDragEnd={(ev) => {
				handleDragEvent(ev)
			}}
			onDrag={(ev) => {
				handleDragEvent(ev)
			}}
			onDragOver={(ev) => {
				handleDragEvent(ev)
			}}
			onDrop={(ev) => {
				handleOnChange(ev)
			}}
		>
			{children}
		</div>
	)
}

export default DragAndDrop
