import React, { useState } from 'react'
import { useQuery } from 'react-query'
import {apiGetNotifications} from '../util/api'
import useDeleteNotification from './hooks/useDeleteNotification'

const Notifications = (user) => {
    const [navOpen, setNavOpen] = useState(false);
    const [showDeleteBtn, setShowDeleteBtn] = useState(-1);
	const deleteNotification = useDeleteNotification()

	const { data: notifications} = useQuery({
		queryKey: 'notifications',
		enabled: user?.loggedIn,
		retry: false,
		refetchInterval: 60000,
		refetchOnMount: false,
		refetchOnWindowFocus: true,
		queryFn: apiGetNotifications,
        staleTime: Infinity
    })

    const toggleNavOpen = () =>
    {
        setNavOpen(!navOpen);
    }
    // Sets the index of the hovered notification
    // Shows delete button on hover
    const showDeleteButton = (index) =>
    {
        setShowDeleteBtn(index);
    }
    const hideDeleteButton = () =>
    {
        setShowDeleteBtn(-1);
    }

    const removeNotification = (index) => {
        let notif = notifications[index];
        deleteNotification.mutate(notif.id);
    }

    let render = null;
    let notificationElements = null;
    let notificationIcon = null;

    if (notifications?.length > 0) {
        notificationElements = notifications.map((notification, index) => {
            let actionButton = null;
            if (notification.action == "access_request")
            {
                actionButton =  <button className="action_button notification_action" onClick={() => notification.button_action_callback()}>Grant Access</button>
            }
            let notifRow = <div className={`notice${notification.deleted ? 'deleted' : ''}`}
                key={notification.id}
                onMouseEnter={() => showDeleteButton(index)}
                onMouseLeave={hideDeleteButton}
                >
                <img className='senderAvatar' src={notification.avatar} />
                <div className='notice_right_side'>
                    <div dangerouslySetInnerHTML={{__html: `<p class='subject'>${notification.subject}</p>`}}></div>
                    { actionButton }
                </div>
                <button
                    className={`noticeClose ${showDeleteBtn == index ? 'show' : ''}`}
                    onClick={() => {removeNotification(index)}}
                ></button>
            </div>

            notificationIcon =
            <button id='notifications_link' className='notEmpty'
                data-notifications={notifications.length}
                onClick={() => toggleNavOpen()}></button>

            return notifRow;
        })
    }
    else
    {
        notificationElements = <h2>You have no messages!</h2>

        notificationIcon =
        <button id='notifications_link'
            onClick={() => toggleNavOpen()}></button>
    }

    render = (
        <div className="notifContainer">
            { notificationIcon }
            { navOpen ?
                <div id='notices'>
                    <h2>Messages:</h2>
                    { notificationElements }
                </div>
            : <></> }
        </div>
    )

    return render;
}

export default Notifications
