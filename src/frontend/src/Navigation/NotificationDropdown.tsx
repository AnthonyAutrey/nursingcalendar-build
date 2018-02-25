import * as React from 'react';
import { Notification } from './Notification';
import { CSSProperties } from 'react';
const uuid = require('uuid/v4');

interface State {
	open: boolean;
	notifications: NotificationData[];
}

interface NotificationData {
	title: string;
	message: string;
}

export class NotificationDropdown extends React.Component<{}, State> {
	private container: any;

	constructor(props: {}, state: State) {
		super(props, state);

		this.state = {
			open: false,
			notifications: [
				{ title: 'Important Message', message: 'This is a very important message.' },
				{ title: 'A Very Long Title, I Mean Reeaaallly Long. Sooooooooooooooooooo Long.', message: 'This is another very important message.' },
				{ title: 'Third Title', message: 'This is another very, very, important message. Yuuuuuuuge.' }
			]
		};
	}

	componentWillMount() {
		document.addEventListener('mousedown', this.handleClick, false);
	}

	componentWillUnMount() {
		document.removeEventListener('mousedown', this.handleClick, false);
	}

	render() {

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
						{this.getNotifications()}
					</div>
					<div className="card d-none d-md-block p-1 bg-light" style={styleLarge}>
						{this.getNotifications()}
					</div>
				</div>
			);

		let openCloseIndicator: JSX.Element = <span className="oi oi-caret-bottom ml-3" style={{ fontSize: '.5em', top: -1 }} />;
		if (this.state.open)
			openCloseIndicator = <span className="oi oi-caret-top ml-3" style={{ fontSize: '.5em', top: -1 }} />;

		let notificationString: string = this.state.notifications.length + ' Notifications';
		if (this.state.notifications.length === 1)
			notificationString = this.state.notifications.length + ' Notification';

		return (
			<ul className="nav nav-pills mt-2 mt-lg-0 ml-auto" ref={container => { this.container = container; }}>
				<li className="nav-item dropdown">
					<a
						className="nav-link bg-secondary text-light"
						href="#"
						onClick={this.toggleOpen}
					>
						<span className="oi oi-bell mr-2" />
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

	getNotifications = () => {
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
		let notifications = this.state.notifications.slice(0);
		notifications.splice(index, 1);

		if (notifications.length <= 0)
			this.setState({ notifications: notifications, open: false });
		else
			this.setState({ notifications: notifications });
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