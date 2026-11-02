import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { handleRequest } from '../util/api'
import EmbeddedPlayer from './embedded-player'
import PostLogin from './lti/post-login'
import OpenPreview from './lti/open-preview'
import SelectItem from './lti/select-item'
import Scores from './scores'
import LoadingIcon from './loading-icon'

const EmbeddedShell = () => {
	const [authError, setAuthError] = useState(null)
	const { data: context, error } = useQuery({
		queryKey: ['embedded-context'],
		queryFn: async () => {
			const data = await handleRequest('GET', '/api/embedded/context/')
			if (!data?.view) throw new Error('Materia did not return an embedded launch context.')
			return data
		},
		staleTime: Infinity,
		retry: false
	})
	useEffect(() => {
		const onError = event => setAuthError(event.detail)
		window.addEventListener('materia-embedded-auth-error', onError)
		return () => window.removeEventListener('materia-embedded-auth-error', onError)
	}, [])
	const failure = authError || error
	if (failure) return (
		<section className="container general" role="alert">
			<h1>{failure.status === 401 ? 'Please relaunch from your LMS' : 'Unable to open this view'}</h1>
			<p>{failure.status === 401
				? 'Your embedded session is unavailable or has expired. Reopen this activity from your LMS.'
				: failure.message}</p>
		</section>
	)
	if (!context) return <LoadingIcon size="med" />
	switch (context.view) {
		case 'player': return <EmbeddedPlayer instanceId={context.instanceId} />
		case 'course-navigation': return <PostLogin embeddedContext={context} />
		case 'instructor-resource': return <OpenPreview embeddedContext={context} />
		case 'deep-link': return <SelectItem embedded={true} />
		case 'scores': return <Scores
			instID={context.instanceId}
			playID={context.playId}
			userID={context.userId}
			contextID={context.contextId}
			isEmbedded={true}
			isPreview={false}
			isSingle={context.isSingle}
			embeddedReview={true}
		/>
		default: return <p role="alert">This embedded view is not supported. Relaunch from your LMS.</p>
	}
}

export default EmbeddedShell
