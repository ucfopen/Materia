import React, { useState } from 'react'
import { useQuery } from 'react-query'
import {apiGetNotifications} from '../util/api'
import useDeleteNotification from './hooks/useDeleteNotification'

const Notifications = (user) => {
    const [navOpen, setNavOpen] = useState(false);
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

    let render = null;

    if (notifications?.length > 0) {
        console.log(notifications);
        const notificationElements = notifications.map(notification => (
            <div className={`notice${notification.deleted ? 'deleted' : ''}`}
                key={notification.id}>
                <img className='senderAvatar' src={notification.avatar} />
                <div className='notice_right_side'>
                    <div dangerouslySetInnerHTML={{__html: `<p class='subject'>${notification.subject}</p>`}}></div>
                    <button className="action_button notification_action" onClick={() => notification.button_action_callback()}>{notification.button_action_text}</button>
                </div>
                <button
                    className='noticeClose'
                    onClick={() => {deleteNotification.mutate(notification.id)}}
                ></button>
            </div>
        ))

        render = (
            <div className="notifContainer">
                <button id='notifications_link'
                    data-notifications={notifications.length}
                    onClick={() => toggleNavOpen()}></button>
                { navOpen ?
                    <div id='notices'>
                        <h2>Messages:</h2>
                        { notificationElements }
                    </div>
                : <></> }
            </div>
        )
    }

    return render;
}

export default Notifications
