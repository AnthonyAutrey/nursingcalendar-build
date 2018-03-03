import * as React from 'react';
import { Notification } from './Notification';
import { OverrideRequest } from './OverrideRequest';
import { Event } from '../Home/ViewingCalendar';
import { ViewEventModal } from '../Home/ViewEventModal';
import { CSSProperties } from 'react';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Props {
	cwid: number;
}

interface State {
	open: boolean;
	notifications: NotificationData[];
	overrideRequests: OverrideRequestData[];
	loading: boolean;
}

interface NotificationData {
	id: number;
	title: string;
	message: string;
	sendTime: Date;
	hasBeenSeen: boolean;
	fromCWID: number;
}

export interface OverrideRequestData {
	event: Event;
	message: string;
	sendTime: Date;
	fromCWID: number;
	fromName: string;
}

export class NotificationDropdown extends React.Component<Props, State> {
	private container: any;
	private viewEventModal: ViewEventModal | null;

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			open: false,
			notifications: [],
			overrideRequests: [],
			loading: true
		};
	}

	componentWillMount() {
		document.addEventListener('mousedown', this.handleClick, false);
		this.getNotificationsFromDB();
		this.getOverrideRequestsFromDB();
	}

	componentWillUnMount() {
		document.removeEventListener('mousedown', this.handleClick, false);
	}

	render() {

		if (this.state.loading)
			return (
				<ul className="nav nav-pills mt-2 mt-lg-0 ml-auto" ref={container => { this.container = container; }}>
					<li className="nav-item dropdown">
						<a className="nav-link bg-secondary text-light"	>
							Loading...
						</a>
					</li>
				</ul>
			);

		const styleLarge: CSSProperties = {
			zIndex: 5000,
			position: 'absolute',
			display: 'inline-block',
			maxWidth: '80vw',
			width: 400,
			left: 'auto',
			right: 0
		};
		const styleSmall = Object.assign({}, styleLarge);
		styleSmall.left = 0;
		styleSmall.right = 'auto';

		let notifications = null;
		if (this.state.open)
			notifications = (
				<div>
					<div className="card d-md-none p-1 bg-light" style={styleSmall}>
						{this.getNotificationComponents()}
					</div>
					<div className="card d-none d-md-block p-1 bg-light" style={styleLarge}>
						{this.getNotificationComponents()}
					</div>
				</div>
			);

		let openCloseIndicator: JSX.Element = <span className="oi oi-caret-bottom ml-3" style={{ fontSize: '.5em', top: -1 }} />;
		if (this.state.open)
			openCloseIndicator = <span className="oi oi-caret-top ml-3" style={{ fontSize: '.5em', top: -1 }} />;

		let notificationString: string = (this.state.notifications.length + this.state.overrideRequests.length) + ' Notifications';
		if (this.state.notifications.length + this.state.overrideRequests.length === 1)
			notificationString = this.state.notifications.length + ' Notification';

		let bell = null;
		if (this.state.notifications.length + this.state.overrideRequests.length > 0)
			bell = <span className="oi oi-bell mr-2" style={{ top: 2 }} />;

		return (
			<div ref={container => { this.container = container; }}>
				<ViewEventModal hideCreatedBy={true} hideGroups={true} ref={viewEventModal => { this.viewEventModal = viewEventModal; }} />
				<ul className="nav nav-pills mt-2 mt-lg-0 ml-auto">
					<li className="nav-item dropdown">
						<a
							className="nav-link bg-secondary text-light cursor-p"
							onClick={this.toggleOpen}
						>
							{bell}
							{notificationString}
							{openCloseIndicator}
						</a>
						{notifications}
					</li>
				</ul>
			</div>
		);
	}

	toggleOpen = () => {
		if (this.state.open)
			this.setNotificationsAsSeen();

		this.setState({ open: !this.state.open });
	}

	getNotificationsFromDB = () => {
		request.get('/api/notifications/' + this.props.cwid).end((error: {}, res: any) => {
			if (res && res.body) {
				let notifications = this.parseNotificationsFromDB(res.body);
				this.setState({ notifications: notifications, loading: false });
			}
		});
	}

	parseNotificationsFromDB = (dBnotifications: any): NotificationData[] => {
		let notifications = dBnotifications.map((dBnotification: any) => {
			let hasBeenSeen: boolean = false;
			if (Number.parseInt(dBnotification.HasBeenSeen) === 1)
				hasBeenSeen = true;

			let notification: NotificationData = {
				id: dBnotification.NotificationID,
				title: dBnotification.Title,
				message: dBnotification.Message,
				sendTime: dBnotification.SendTime,
				hasBeenSeen: hasBeenSeen,
				fromCWID: dBnotification.FromCWID
			};
			return notification;
		});

		return notifications;
	}

	setNotificationsAsSeen = () => {
		let unseenNotificationIDs: number[] = [];
		let unseenNotifications = this.state.notifications.forEach(notification => {
			if (!notification.hasBeenSeen)
				unseenNotificationIDs.push(notification.id);
		});

		if (unseenNotificationIDs.length > 0) {
			let queryData = {
				setValues: {
					'HasBeenSeen': 1
				},
				where: { NotificationID: unseenNotificationIDs }
			};

			let queryDataString = JSON.stringify(queryData);
			request.post('/api/notifications').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body) {
					let notifications = this.state.notifications.slice(0);
					notifications.forEach(notification => {
						notification.hasBeenSeen = true;
					});
					this.setState({ notifications: notifications });
				}
			});
		}
	}

	getNotificationComponents = () => {
		let notifications: JSX.Element[] = [];
		this.state.overrideRequests.forEach((overrideRequest, index) => {
			notifications.push(
				<OverrideRequest
					key={uuid()}
					index={index}
					overrideRequestData={overrideRequest}
					handleShowEvent={(event: Event) => this.handleShowEvent(event)}
					handleGrant={() => alert('grant')}
					handleDeny={() => alert('deny')}
					isAdminRequest={false}
				/>
			);
		});
		this.state.notifications.forEach((notification, index) => {
			notifications.push(
				<Notification
					key={uuid()}
					index={index}
					title={notification.title}
					message={notification.message}
					hasBeenSeen={notification.hasBeenSeen}
					handleDeleteNotification={this.deleteNotification}
				/>
			);
		});

		if (this.state.notifications.length + this.state.overrideRequests.length < 1)
			notifications = [(
				<div key={uuid()}>
					No notifications
				</div>
			)];

		return (
			<div>
				{notifications}
			</div>
		);
	}

	deleteNotification = (index: number) => {
		let deleteID: number = this.state.notifications[index].id;
		request.delete('/api/notifications/' + deleteID).end((error: {}, res: any) => {
			if (res && res.body) {
				let notifications = this.state.notifications.slice(0);
				notifications.splice(index, 1);

				if (notifications.length <= 0)
					this.setState({ notifications: notifications, open: false });
				else
					this.setState({ notifications: notifications });
			}
		});
	}

	handleClick = (e: any) => {
		let container = this.container;
		if (!container || (container && container.contains(e.target)))
			return;
		else
			this.setState({ open: false });
	}

	// Override Requests ///////////////////////////////////////////////////////////////////////////////////////////////////////////
	getOverrideRequestsFromDB = () => {
		request.get('/api/overriderequests/' + this.props.cwid).end((error: {}, res: any) => {
			if (res && res.body) {
				let overrideRequests: OverrideRequestData[] = this.parseOverriderRequestsFromDB(res.body);
				this.setState({ overrideRequests: overrideRequests });
			}
		});
	}

	parseOverriderRequestsFromDB = (dbOverrideRequests: any): OverrideRequestData[] => {
		console.log(dbOverrideRequests);
		let overrideRequests: OverrideRequestData[] = dbOverrideRequests.map((dbOverrideRequest: any) => {
			let overrideRequest: OverrideRequestData = {
				event: {
					id: dbOverrideRequest.EventID,
					title: dbOverrideRequest.Title,
					description: dbOverrideRequest.Description,
					start: dbOverrideRequest.StartTime,
					end: dbOverrideRequest.EndTime,
					ownerName: '<WHAT TO DO HERE?>',
					location: dbOverrideRequest.LocationName,
					room: dbOverrideRequest.RoomName,
					groups: []
				},
				message: dbOverrideRequest.Message,
				sendTime: dbOverrideRequest.Time,
				fromCWID: dbOverrideRequest.RequestorCWID,
				fromName: dbOverrideRequest.RequestorFirstName + ' ' + dbOverrideRequest.RequestorLastName
			};

			return overrideRequest;
		});

		return overrideRequests;
	}

	handleShowEvent = (event: Event) => {
		if (this.viewEventModal)
			this.viewEventModal.beginView(event);
	}

}

export default NotificationDropdown;