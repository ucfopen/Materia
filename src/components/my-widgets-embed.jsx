import React, { useState } from 'react'

const getEmbedLink = (inst, autoplayToggle = true) => {
	if (inst === null) {
		return ''
	}

	const width =
		String(inst.widget.width) !== '0'
			? inst.widget.width
			: 800

	const height =
		String(inst.widget.height) !== '0'
			? inst.widget.height
			: 600
			
	return `<iframe src="${inst.embed_url}?autoplay=${autoplayToggle?'true':'false'}" width="${width}" height="${height}" style="margin:0;padding:0;border:0;"></iframe>`
}

const MyWidgetEmbedInfo = ({inst}) => {
	const [autoplay, setAutoplay] = useState(true)
	
	return (
		<div className="embed-options">
			<h3>Embed Code</h3>
			<p>Paste this HTML into a course page to embed.</p>
			<textarea id="embed_link" readOnly value={ getEmbedLink(inst, autoplay) }></textarea>
			<label htmlFor="embed-code-autoplay">Autoplay: </label>
			<input id="embed-code-autoplay"
				type="checkbox"
				className="unstyled"
				checked={autoplay}
				onChange={() => {setAutoplay(!autoplay)}}
			/>
			{autoplay
				? <span>(widget starts automatically)</span>
				: <span>(widget starts after clicking play)</span>
			}
		</div>
	)
}

export default MyWidgetEmbedInfo
