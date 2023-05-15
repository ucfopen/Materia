import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from 'react-query'
import { apiGetNotifications } from '../util/api'
import useDeleteNotification from './hooks/useDeleteNotification'
import setUserInstancePerms from './hooks/useSetUserInstancePerms'

const Notifications = (user) => {
    const [navOpen, setNavOpen] = useState(false);
    const [showDeleteBtn, setShowDeleteBtn] = useState(-1);
	const deleteNotification = useDeleteNotification()
	const queryClient = useQueryClient()
    const setUserPerms = setUserInstancePerms()
    const [errorMsg, setErrorMsg] = useState('');
    let modalRef = useRef();

	const { data: notifications} = useQuery({
		queryKey: 'notifications',
		enabled: user?.loggedIn,
		retry: false,
		refetchInterval: 60000,
		refetchOnMount: false,
		refetchOnWindowFocus: true,
		queryFn: apiGetNotifications,
        staleTime: Infinity,
        onSuccess: (data) => console.log(data)
    })

    // Close notification modal if user clicks outside of it
    useEffect(() => {
        if (navOpen)
        {
            const checkIfClickedOutsideModal = e => {
                if (modalRef.current && !modalRef.current.contains(e.target) && !e.target.className.includes("noticeClose"))
                {
                    console.log(e.target)
                    setNavOpen(false);
                }
            }
            document.addEventListener("click", checkIfClickedOutsideModal);

            return () => {
                document.removeEventListener("click", checkIfClickedOutsideModal);
            }
        }
    }, [navOpen])

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

    const onClickGrantAccess = (notif) => {
        const accessLevel = 30;
        const expireTime = null;

        const userPerms = [{
            user_id: notif.from_id,
            expiration: expireTime,
            perms: {
                [accessLevel]: true
            },
        }]
        setUserPerms.mutate({
            instId: notif.item_id,
            permsObj: userPerms,
            successFunc: (data) => {
                if (data.status == 200)
                {
                    // Redirect to widget
                    if (!window.location.pathname.includes('my-widgets'))
                    {
                        // No idea why this works
                        // But setting hash after setting pathname would set the hash first and then the pathname in URL
                        window.location.hash = notif.item_id + '-collab';
                        window.location.pathname = '/my-widgets'
                    }
                    else
                    {
                        queryClient.invalidateQueries(['user-perms', notif.item_id])
                        window.location.hash = notif.item_id + '-collab';
                    }

                    setErrorMsg('');

                    // Remove notification
                    deleteNotification.mutate(notif.id);

                    // Close notifications
                    setNavOpen(false)

                }
                else
                {
                    setErrorMsg('Action failed.');
                }
            }
        })


    }

    let render = null;
    let notificationElements = null;
    let notificationIcon = null;

    if (notifications?.length > 0) {
        notificationElements = notifications.map((notification, index) => {
            console.log(notification)
            let actionButton = null;
            if (notification.action == "access_request")
            {
                actionButton =  <button className="action_button notification_action" onClick={() => onClickGrantAccess(notification)}>Grant Access</button>
            }
            let createdAt = new Date(0);
            createdAt.setUTCSeconds(notification.created_at)
            let notifRow = <div className={`notice${notification.deleted ? 'deleted' : ''}`}
                key={notification.id}
                onMouseEnter={() => showDeleteButton(index)}
                onMouseLeave={hideDeleteButton}
                >
                <img className='senderAvatar' src={notification.avatar} />
                <div className='notice_right_side'>
                    <div dangerouslySetInnerHTML={{__html: `<p class='subject'>${notification.subject}</p>`}}></div>
                    { actionButton }
                    <p className="notif-date">Sent on {createdAt.toLocaleString()}</p>
                </div>
                <img src="/img/icon-cancel.svg"
                    className={`noticeClose ${showDeleteBtn == index ? 'show' : ''}`}
                    onClick={() => {removeNotification(index)}}
                />
                <p id="errorMsg">{errorMsg}</p>
            </div>

            notificationIcon =
            <button id='notifications_link' className='notEmpty'
                data-notifications={notifications.length}
                onClick={() => toggleNavOpen()}></button>

            return notifRow;
        })

        render = (
            <div className="notifContainer">
                { notificationIcon }
                { navOpen ?
                    <div id='notices' ref={modalRef}>
                        <h2>Messages:</h2>
                        { notificationElements }
                    </div>
                : <></> }
            </div>
        )
    }
    else
    {
        render = null;

        // Keeping this here in case the empty notification icon gets used
        notificationElements = <h2>You have no messages!</h2>

        notificationIcon =
        <button id='notifications_link'
            onClick={() => toggleNavOpen()}></button>
    }

    return render;
}

export default Notifications
