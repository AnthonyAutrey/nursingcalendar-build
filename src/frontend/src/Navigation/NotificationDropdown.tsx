import * as React from 'react';
import { Notification } from './Notification';
import { CSSProperties } from 'react';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Props {
	cwid: number;
}

interface State {
	open: boolean;
	notifications: NotificationData[];
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

export class NotificationDropdown extends React.Component<Props, State> {
	private container: any;

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			open: false,
			notifications: [],
			loading: true
		};
	}

	componentWillMount() {
		document.addEventListener('mousedown', this.handleClick, false);
		this.getNotificationsFromDB();
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
			zIndex: Number.MAX_SAFE_INTEGER,
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

		let notificationString: string = this.state.notifications.length + ' Notifications';
		if (this.state.notifications.length === 1)
			notificationString = this.state.notifications.length + ' Notification';

		let bell = null;
		if (this.state.notifications.length > 0)
			bell = <span className="oi oi-bell mr-2" style={{ top: 2 }} />;

		return (
			<ul className="nav nav-pills mt-2 mt-lg-0 ml-auto" ref={container => { this.container = container; }}>
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
		);
	}

	toggleOpen = () => {
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
			let notification: NotificationData = {
				id: dBnotification.NotificationID,
				title: dBnotification.Title,
				message: dBnotification.Message,
				sendTime: dBnotification.SendTime,
				hasBeenSeen: dBnotification.HasBeenSeen,
				fromCWID: dBnotification.FromCWID
			};
			return notification;
		});

		return notifications;
	}

	getNotificationComponents = () => {
		let notifications: JSX.Element[] = this.state.notifications.map((notification, index) => {
			return (
				<Notification
					key={uuid()}
					index={index}
					title={notification.title}
					message={notification.message}
					handleDeleteNotification={this.deleteNotification}
				/>
			);
		});

		if (this.state.notifications.length < 1)
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
}

export default NotificationDropdown;