import React, { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { handleRequest } from '../util/api'
import WidgetPlayer from './widget-player'
import Scores from './scores'
import LoadingIcon from './loading-icon'

const EmbeddedPlayer = ({ instanceId }) => {
	const queryClient = useQueryClient()
	const [play, setPlay] = useState(null)
	const [screen, setScreen] = useState('loading')
	const [error, setError] = useState(null)
	const [starting, setStarting] = useState(false)

	const startPlay = async () => {
		setStarting(true)
		setError(null)
		setScreen('loading')
		try {
			const next = await handleRequest('POST', '/api/embedded/play/', { instanceId })
			if (!next?.playId) throw new Error('Materia did not return a play session.')
			history.replaceState(null, '', window.location.pathname)
			queryClient.clear()
			setPlay(next)
			setScreen('play')
		} catch (err) {
			setError(err)
		} finally {
			setStarting(false)
		}
	}

	useEffect(() => {
		const onAuthError = event => setError(event.detail)
		window.addEventListener('materia-embedded-auth-error', onAuthError)
		return () => window.removeEventListener('materia-embedded-auth-error', onAuthError)
	}, [])

	if (error) {
		return (
			<section className="container general" role="alert">
				<h1>{error.status === 401 ? 'Please relaunch this widget' : 'Unable to play this widget'}</h1>
				<p>{error.status === 401
					? 'Your embedded session is unavailable or has expired. Reopen this activity from your LMS.'
					: error.message}</p>
			</section>
		)
	}
	if (screen === 'loading') {
		return starting ? <LoadingIcon size="med" /> : (
			<section className="container general">
				<button className="action_button" onClick={startPlay}>Play Widget</button>
			</section>
		)
	}
	if (screen === 'scores') {
		return <Scores
			key={play.playId}
			instID={instanceId}
			playID={play.playId}
			userID={play.userId}
			contextID={play.contextId}
			isEmbedded={true}
			isPreview={false}
			isSingle={false}
			onPlayAgain={startPlay}
		/>
	}
	return <WidgetPlayer
		key={play.playId}
		instanceId={instanceId}
		playId={play.playId}
		minHeight={play.height}
		minWidth={play.width}
		embedded={true}
		onComplete={() => {
			queryClient.invalidateQueries({ queryKey: ['inst-scores', instanceId, play.contextId] })
			setScreen('scores')
		}}
	/>
}

export default EmbeddedPlayer
