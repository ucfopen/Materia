import { useQuery } from 'react-query'
import { apiUploadSiteImage, apiGetSiteImages, apiDeleteSiteImage } from '../util/api'
import React, { useState, useRef, useEffect } from 'react'
import Header from './header'
import './site-admin-page.scss'


const SiteAdminPage = () => {

	const [state, setState] = useState({
		imageUploadNotice: '',
		isUploadingImage: false,
		imageUploadError: false,
		profileImages: []
	})

	const handleImageUpload = async (event) => {
		event.preventDefault()
		const file = event.target[1].files[0]
		const imgType = event.target[0].value
		if (!file) setState(state => ({...state, imageUploadError: true, imageUploadNotice: 'You must select a file first.'}))
		else  {
			setState(state => ({...state, isUploadingImage: true}))
			apiUploadSiteImage(imgType, file)
			.then(res => {
				refetchProfileImages()
				refetchCatalogImages()
				setState((state) => ({
					...state,
					imageUploadNotice: 'Image uploaded successfully.'
				}))
			})
			.catch(err => {
				setState((state) => ({
					...state,
					isUploadingImage: false,
					imageUploadError: true,
					imageUploadNotice: 'An error occurred while uploading the image.'
				}))
			})
		}
	}

	const handleImageRemoveRequest = async (event) => {
		const id = event.target.dataset.ormid

		apiDeleteSiteImage(id).then(res => {
			console.log('delete image request response!', res)
			refetchProfileImages()
			refetchCatalogImages()
		})
	}

	const {data: profileImages, refetch: refetchProfileImages } = useQuery({
		queryKey: ['profile-images'],
		queryFn: () => apiGetSiteImages('profile'),
		staleTime: Infinity,
		retry: false
	})

	const {data: catalogImages, refetch: refetchCatalogImages } = useQuery({
		queryKey: ['catalog-images'],
		queryFn: () => apiGetSiteImages('catalog'),
		staleTime: Infinity,
		retry: false
	})

	useEffect(() => {
		if (profileImages != undefined) {
			setState((state) => ({
				...state,
				isUploadingImage: false,
				imageUploadError: false,
				profileImages: profileImages,
			}))
		}
	},[profileImages])

	useEffect(() => {
		if (catalogImages != undefined) {
			setState((state) => ({
				...state,
				isUploadingImage: false,
				imageUploadError: false,
				catalogImages: catalogImages,
			}))
		}
	},[catalogImages])


	let profileGalleryRender = null
	if ( !!state.profileImages) {
		const profileImageList = state.profileImages.map((img, index) => {
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
			<ul>
				{profileImageList}
			</ul>
		)
	}

	let catalogGalleryRender = null
	if ( !!state.catalogImages) {
		const catalogImageList = state.catalogImages.map((img, index) => {
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
		catalogGalleryRender = (
			<ul>
				{catalogImageList}
			</ul>
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
									disabled={state.isUploadingImage}>
										Upload
									</button>
							</form>
							<span className={`notice ${state.imageUploadError ? 'error' : ''}`}>{state.imageUploadNotice}</span>
						</section>
						<section className="management-subsection">
							<h3>Catalog Banner</h3>
							{catalogGalleryRender}
						</section>
						<section className="management-subsection">
							<h3>Profile Images</h3>
							{profileGalleryRender}
						</section>
					</section>
				</section>
			</div>
		</>
	)
}

export default SiteAdminPage
