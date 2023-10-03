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
    const numNotifications = useRef(0);
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
        onSuccess: (data) => {
            numNotifications.current = 0;
            if (data && data.length > 0) data.forEach(element => {
                if (!element.remove) numNotifications.current++;
            });
        }
    })

    // Close notification modal if user clicks outside of it
    useEffect(() => {
        if (navOpen)
        {
            const checkIfClickedOutsideModal = e => {
                if (modalRef.current && !modalRef.current.contains(e.target) && !e.target.className.includes("noticeClose"))
                {
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

    const removeNotification = (index, id = null) => {
        let notif = null;
        if (index >= 0) notif = notifications[index];
        if (id == null) id = notif.id;

        deleteNotification.mutate({
            notifId: id,
            deleteAll: false,
            successFunc: () => {
                Object.keys(notifications).forEach((key, index) => {
                    if (notifications[key].id == id)
                    {
                        notifications[key].remove = true;
                        numNotifications.current--;
                        return;
                    }
                })
            }
        });
    }

    const removeAllNotifications = () => {
        deleteNotification.mutate({
            notifId: '',
            deleteAll: true,
            successFunc: () => {}
        });
    }

    const onChangeAccessLevel = (notif, access) => {
        if (access != "")
        {
            document.getElementById(notif.id + '_action_button').className = "action_button notification_action enabled";
        }
    }

    const onClickGrantAccess = (notif) => {
        let accessLevel = document.getElementById(notif.id + '-access-level').value;

        if (accessLevel == "")
        {
            return;
        }

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
                if (data && data.status == 200)
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

                    removeNotification(-1, notif.id);

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
        notificationElements = []
        for (let index = notifications.length - 1; index >= 0; index--)
        {
            const notification = notifications[index];
            // If notification was deleted don't show
            if (notification.remove) continue;

            let actionButton = null;
            let grantAccessDropdown = null;
            if (notification.action == "access_request")
            {
                grantAccessDropdown = <div>
                <h3 className="grantAccessTitle">Grant Access</h3>
                    <select name="access-level" id={notification.id + "-access-level"} defaultValue="" onChange={(value) => onChangeAccessLevel(notification, value)}>
                        <option value="30">Full</option>
                        <option value="1">View Scores</option>
                        <option value="" disabled hidden>Select Access Level</option>
                    </select>
                </div>
                actionButton =  <button className="action_button notification_action" id={notification.id + "_action_button"} onClick={() => onClickGrantAccess(notification)}>Grant Access</button>
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
                    { grantAccessDropdown }
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
                data-notifications={numNotifications.current}
                onClick={() => toggleNavOpen()}></button>

            notificationElements.push(notifRow)
        }

        // In the case that some notifications were removed, we don't want to render the empty notificationElements
        if (notificationElements.length > 0)
        {
            render = (
                <div className="notifContainer">
                    { notificationIcon }
                    { navOpen ?
                        <div id='notices' ref={modalRef}>
                            <h2>Messages:</h2>
                            { notificationElements }
                            <a id="removeAllNotifications" onClick={()=>removeAllNotifications()}>Remove all Notifications</a>
                        </div>
                    : <></> }
                </div>
            )
        }
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
