import { useQuery } from 'react-query'
import { apiUploadSiteImage, apiGetSiteImages, apiDeleteSiteImage, apiGetSiteMessages, apiUploadSiteMessage, apiDeleteSiteMessage } from '../util/api'
import React, { useState, useRef, useEffect } from 'react'
import Header from './header'
import './site-admin-page.scss'


const SiteAdminPage = () => {

	const [pageState, setPageState] = useState({
		mode: 'image'
	})

	const [imageState, setImageState] = useState({
		imageUploadNotice: '',
		isUploadingImage: false,
		imageUploadError: false,
		profileImages: []
	})

	const [messageState, setMessageState] = useState({
		messageUploadNotice: '',
		isUploadingMessage: false,
		messageUploadError: false,
		messages: []
	})

	const handleImageUpload = async (event) => {
		event.preventDefault()
		const file = event.target[1].files[0]
		const imgType = event.target[0].value
		if (!file) setImageState(imageState => ({...imageState, imageUploadError: true, imageUploadNotice: 'You must select a file first.'}))
		else  {
			setImageState(imageState => ({...imageState, isUploadingImage: true}))
			apiUploadSiteImage(imgType, file)
			.then(res => {
				refetchProfileImages()
				setImageState((imageState) => ({
					...imageState,
					imageUploadNotice: 'Image uploaded successfully.'
				}))
			})
			.catch(err => {
				setImageState((imageState) => ({
					...imageState,
					isUploadingImage: false,
					imageUploadError: true,
					imageUploadNotice: 'An error occurred while uploading the image.'
				}))
			})
		}
	}

	const handleMessageUpload = async (event) => {
		event.preventDefault()

		const type = event.target.message_type.value
		const content = event.target.message_content.value
		const start_time = event.target.start_time.value || null
		const end_time = event.target.end_time.value || null

		apiUploadSiteMessage(type, content, start_time, end_time)
		.then(res => {
			refetchSiteMessages()
			setMessageState((messageState) => ({
				...messageState,
				messageUploadNotice: 'Message submitted successfully.'
			}))
		})

	}

	const handleImageRemoveRequest = async (event) => {
		const id = event.target.dataset.ormid

		apiDeleteSiteImage(id).then(res => {
			console.log('delete image request response!', res)
			refetchProfileImages()
		})
	}

	const handleMessageClearRequest = async (event) => {
		const id = event.target.dataset.ormid

		apiDeleteSiteMessage(id).then(res => {
			console.log('delete message request response!', res)
			refetchSiteMessages()
		})
		
	}

	const {data: profileImages, refetch: refetchProfileImages } = useQuery({
		queryKey: ['profile-images'],
		queryFn: () => apiGetSiteImages('profile'),
		enabled: pageState.mode == 'image',
		staleTime: Infinity,
		retry: false
	})

	const {data: siteMessages, refetch: refetchSiteMessages } = useQuery({
		queryKey: ['site-messages', 'all'],
		queryFn: () => apiGetSiteMessages([], true),
		enabled: pageState.mode == 'message',
		staleTime: Infinity,
		retry: false
	})

	useEffect(() => {
		const handleHashChange = () => {
			if (window.location.hash === '#images') {
				setPageState((pageState) => ({ ...pageState, mode: 'image' }))
			}
			if (window.location.hash === '#messages') {
				setPageState((pageState) => ({ ...pageState, mode: 'message' }))
			}
		}

		handleHashChange()
		window.addEventListener('hashchange', handleHashChange)

		return () => {
			window.removeEventListener('hashchange', handleHashChange)
		}
	}, [])

	useEffect(() => {
		if (profileImages != undefined) {
			setImageState((imageState) => ({
				...imageState,
				isUploadingImage: false,
				imageUploadError: false,
				profileImages: profileImages,
			}))
		}
	},[profileImages])

	useEffect(() => {
		if (siteMessages != undefined) {
			setMessageState((messageState) => ({
				...messageState,
				isUploadingMessage: false,
				messageUploadError: false,
				messages: siteMessages
			}))
		}
	},[siteMessages])

	let contentRender = null
	if (pageState.mode == 'image') {

		let profileGalleryRender = null
		if ( !!imageState.profileImages) {
			const profileImageList = imageState.profileImages.map((img, index) => {
				return (
					<li className="profile-image" key={index}>
						<img src={img.image_path} alt="" />
						<button 
							className="action_button remove_profile_img"
							data-ormid={img.id}
							onClick={handleImageRemoveRequest}>
								Remove
							</button>
					</li>
				)
			})
			profileGalleryRender = (
				<ul className='profile-images'>
					{profileImageList}
				</ul>
			)
		}

		contentRender = (
			<>
				<h2>Image Management</h2>
				<section className='admin-subsection'>
					<section className="management-subsection">
						<form onSubmit={handleImageUpload}>
							<select
								id="image_uploader_select"
								className="image_uploader_select"
								name="image_type">
									<option value="PROFILE_IMAGE">Profile Image</option>
									<option value="CATALOG_BANNER">Catalog Banner</option>
								</select>
							<input
								id="image_uploader_file"
								className="image_uploader"
								name="image_file"
								type="file" />
							<button
								id="image_uploader_submit"
								className="action_button"
								name="image_uploader_submit"
								type="submit"
								disabled={imageState.isUploadingImage}>
									Upload
								</button>
						</form>
						<span className={`notice ${imageState.imageUploadError ? 'error' : ''}`}>{imageState.imageUploadNotice}</span>
					</section>
					<section className="management-subsection">
						<h3>Catalog Banner</h3>
					</section>
					<section className="management-subsection">
						<h3>Profile Images</h3>
						{profileGalleryRender}
					</section>
				</section>
			</>
		)
	}
	else if (pageState.mode == 'message') {

		let siteMessageListRender = null
		if (!!messageState.messages) {
			const messageList = messageState.messages.map((msg, index) => {
				return (
					<li className='site-message' key={index}>
						<header>{msg.message_type}</header>
						<h5>{msg.message_text}</h5>
						<dl>
							<dt>Start time:</dt>
							<dd>{`${ !!msg.start_at ? msg.start_at : 'Not Set'}`}</dd>
							<dt>End at:</dt>
							<dd>{`${ !!msg.end_at ? msg.end_at : 'Not Set'}`}</dd>
						</dl>
						<button 
							className="action_button"
							data-ormid={msg.id}
							onClick={handleMessageClearRequest}>
								Clear
							</button>
					</li>
				)
			})

			siteMessageListRender = (
				<ul className='site-messages'>
					{ messageList }
				</ul>
			)
		}

		contentRender = (
			<>
				<h2>Site Messaging Management</h2>
				<section className='admin-subsection'>
					<section className="management-subsection">
						<h3>Current Messaging</h3>
						{ siteMessageListRender }
					</section>
					<section className="management-subsection">
						<h3>Update Messaging</h3>
						<form onSubmit={handleMessageUpload}>
							<label htmlFor="message_type">Message Type</label>
							<select
								id="message_uploader_select"
								className="message_uploader_select"
								name="message_type">
									<option value="SITE_NOTIFICATION">System Notification</option>
									<option value="SITE_ALERT">System Alert</option>
									<option value="CATALOG_HEADER">Catalog Header</option>
									<option value="CATALOG_TEXT">Catalog Text</option>
								</select>
							<textarea id="message_content_input" name="message_content" className="message_uploader_input">
							</textarea>
							<section className="form-subsection">
								<p>Note: Start and End values are optional.</p>
								<label htmlFor="message_start_time_input">Start At</label>
								<input
									id="message_start_time_input"
									className="message_datetime"
									name="start_time"
									type="datetime-local"
								/>
								<label htmlFor="message_end_time_input">End At</label>
								<input
									id="message_end_time_input"
									className="message_datetime"
									name="end_time"
									type="datetime-local"
								/>
							</section>
							<button
								id="message_uploader_submit"
								className="action_button"
								name="message_uploader_submit"
								type="submit"
								disabled={false}>
									Submit
								</button>
						</form>
					</section>
				</section>
			</>
		)
	}

	return (
		<>
			<Header />
			<div className="support-page">
				<section className="page">
					<div className="top">
						<h1>Site Admin</h1>
					</div>
					<nav>
						<a className={`nav_button ${pageState.mode == 'image' ? 'selected' : ''}`} href='#images'>Image Management</a>
						<a className={`nav_button ${pageState.mode == 'message' ? 'selected' : ''}`} href='#messages'>Message Management</a>
					</nav>
					{ contentRender }
				</section>
			</div>
		</>
	)
}

export default SiteAdminPage
