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
	role: string;
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
	overrideRequestDeniedInfo?: {
		eventID: number;
		location: string;
		room: string;
	};
}

export interface OverrideRequestData {
	event: Event;
	message: string;
	ownerResponse: string;
	adminRequested: boolean;
	sendTime: Date;
	fromCWID: number;
	ownerCWID: number;
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
		let getNotificationsAndOverrideRequestsPromises: Promise<any>[] = [];
		getNotificationsAndOverrideRequestsPromises.push(this.getNotificationsFromDB());
		getNotificationsAndOverrideRequestsPromises.push(this.getOverrideRequestsFromDB());

		Promise.all(getNotificationsAndOverrideRequestsPromises).then(notificationData => {
			this.setState({ notifications: notificationData[0], overrideRequests: notificationData[1], loading: false });
		}).catch(() => {
			alert('Error getting notification data, handle properly!');
			// TODO: handle this properly!
		});
	}

	componentWillUnMount() {
		document.removeEventListener('mousedown', this.handleClick, false);
	}

	render() {
		if (this.state.loading)
			return (
				<ul className="nav nav-pills mt-2 mt-lg-0 ml-1" ref={container => { this.container = container; }}>
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
			notificationString = this.state.notifications.length + this.state.overrideRequests.length + ' Notification';

		let bell = null;
		if (this.state.notifications.length + this.state.overrideRequests.length > 0)
			bell = <span className="oi oi-bell mr-2" style={{ top: 2 }} />;

		return (
			<div className="mt-2 mt-lg-0" ref={container => { this.container = container; }}>
				<ViewEventModal hideGroups={true} ref={viewEventModal => { this.viewEventModal = viewEventModal; }} />
				<ul className="nav nav-pills">
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

	getNotificationsFromDB = (): Promise<any> => {
		return new Promise((resolveAll, rejectAll) => {
			let getNotificationsPromises: Promise<any>[] = [];

			getNotificationsPromises.push(new Promise((resolve, reject) => {
				request.get('/api/notifications/' + this.props.cwid).end((error: {}, res: any) => {
					if (res && res.body) {
						let notifications = this.parseNotificationsFromDB(res.body);
						resolve(notifications);
					} else
						reject();
				});
			}));

			getNotificationsPromises.push(new Promise((resolve, reject) => {
				let queryData = {
					where: {
						'RequestorCWID': this.props.cwid,
						'Denied': 1,
						'AdminRequested': 0
					}
				};

				let queryDataString = JSON.stringify(queryData);
				request.get('/api/overriderequests').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body) {
						let notifications = this.parseDeniedOverrideRequestsFromDB(res.body);
						resolve(notifications);
					} else
						reject();
				});
			}));

			Promise.all(getNotificationsPromises).then(results => {
				let allNotifications: NotificationData[] = [];
				results.forEach((result: any[]) => {
					allNotifications = result.concat(allNotifications);
				});
				resolveAll(allNotifications);
			}).catch(() => {
				rejectAll();
			});

		});
	}

	parseDeniedOverrideRequestsFromDB = (dbOverrideRequests: any): NotificationData[] => {
		let overrideRequests = this.parseOverriderRequestsFromDB(dbOverrideRequests);

		let notifications = overrideRequests.map(overrideRequest => {
			let ownerResponse = overrideRequest.ownerResponse;

			let punctuation = '';
			let ownerPunctuation = ownerResponse.slice(ownerResponse.length - 1);
			if (ownerPunctuation !== '.' && ownerPunctuation !== '!' && ownerPunctuation !== '?')
				punctuation = '.';

			let notification: NotificationData = {
				id: -1,
				title: 'Timeslot Request Denied.',
				message: 'Request for timeslot on event, \'' + overrideRequest.event.title + '\' has been denied by ' +
					overrideRequest.event.ownerName + '.<<break>>' +
					'Event owner\'s response: "' + ownerResponse + '"' + punctuation,
				sendTime: new Date(),
				hasBeenSeen: false,
				fromCWID: -1,
				overrideRequestDeniedInfo: {
					eventID: overrideRequest.event.id,
					location: overrideRequest.event.location,
					room: overrideRequest.event.room,
				}
			};
			return notification;
		});

		return notifications;
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
					handleGrant={this.handleOverrideRequestGrant}
					handleDeny={this.handleOverrideRequestDeny}
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
					overrideRequestDeniedInfo={notification.overrideRequestDeniedInfo}
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

	deleteNotification = (index: number, deniedNotification: boolean = false) => {
		if (deniedNotification) {
			let notifications = this.state.notifications.slice(0);
			notifications.splice(index, 1);

			if (Number(notifications.length + this.state.overrideRequests.length) <= 0)
				this.setState({ notifications: notifications, open: false });
			else
				this.setState({ notifications: notifications });
		} else {
			let deleteID: number = this.state.notifications[index].id;
			request.delete('/api/notifications/' + deleteID).end((error: {}, res: any) => {
				if (res && res.body) {
					let notifications = this.state.notifications.slice(0);
					notifications.splice(index, 1);

					if (Number(notifications.length + this.state.overrideRequests.length) <= 0)
						this.setState({ notifications: notifications, open: false });
					else
						this.setState({ notifications: notifications });
				}
			});
		}
	}

	handleClick = (e: any) => {
		let container = this.container;
		if (!container || (container && container.contains(e.target)))
			return;
		else
			this.setState({ open: false });
	}

	// Override Requests ///////////////////////////////////////////////////////////////////////////////////////////////////////////
	getOverrideRequestsFromDB = (): Promise<any> => {
		return new Promise((resolveAll, rejectAll) => {
			let getOverrideRequestsPromises: Promise<any>[] = [];

			let queryData = {
				where: { 'Denied': 0 }
			};

			let queryDataString = JSON.stringify(queryData);
			getOverrideRequestsPromises.push(new Promise((resolve, reject) => {
				request.get('/api/overriderequests/' + this.props.cwid).set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body) {
						let overrideRequests: OverrideRequestData[] = this.parseOverriderRequestsFromDB(res.body);
						resolve(overrideRequests);
					} else
						reject();
				});
			}));

			if (this.props.role === 'administrator') {
				getOverrideRequestsPromises.push(new Promise((resolve, reject) => {
					let adminQueryData = {
						where: {
							'Denied': 1,
							'AdminRequested': 1
						}
					};

					let adminQueryDataString = JSON.stringify(adminQueryData);
					request.get('/api/overriderequests').set('queryData', adminQueryDataString).end((error: {}, res: any) => {
						if (res && res.body) {
							let adminOverrideRequests: OverrideRequestData[] = this.parseOverriderRequestsFromDB(res.body);
							resolve(adminOverrideRequests);
						} else
							reject();
					});
				}));
			}

			Promise.all(getOverrideRequestsPromises).then(overrideRequestResults => {
				let allOverrideRequests: OverrideRequestData[] = [];
				overrideRequestResults.forEach(result => {
					allOverrideRequests = result.concat(allOverrideRequests);
				});
				resolveAll(allOverrideRequests);
			}).catch(() => {
				rejectAll();
			});
		});
	}

	parseOverriderRequestsFromDB = (dbOverrideRequests: any): OverrideRequestData[] => {
		let overrideRequests: OverrideRequestData[] = dbOverrideRequests.map((dbOverrideRequest: any) => {
			let adminRequested = false;
			if (Number(dbOverrideRequest.AdminRequested) === 1)
				adminRequested = true;

			let overrideRequest: OverrideRequestData = {
				event: {
					id: dbOverrideRequest.EventID,
					title: dbOverrideRequest.Title,
					description: dbOverrideRequest.Description,
					start: dbOverrideRequest.StartTime,
					end: dbOverrideRequest.EndTime,
					ownerName: dbOverrideRequest.OwnerFirstName + ' ' + dbOverrideRequest.OwnerLastName,
					location: dbOverrideRequest.LocationName,
					room: dbOverrideRequest.RoomName,
					groups: []
				},
				message: dbOverrideRequest.Message,
				ownerResponse: dbOverrideRequest.OwnerResponse,
				adminRequested: adminRequested,
				sendTime: dbOverrideRequest.Time,
				fromCWID: dbOverrideRequest.RequestorCWID,
				ownerCWID: dbOverrideRequest.CWID,
				fromName: dbOverrideRequest.RequestorFirstName + ' ' + dbOverrideRequest.RequestorLastName
			};

			return overrideRequest;
		});

		return overrideRequests;
	}

	handleOverrideRequestGrant = (index: number, reply: string) => {
		let overrideRequestToGrant: OverrideRequestData = this.state.overrideRequests[index];
		let queryData = {
			setValues: {
				'Title': 'Reserved',
				'Description': 'This event has been reserved following a timeslot request',
				'CWID': overrideRequestToGrant.fromCWID
			},
			where: {
				EventID: overrideRequestToGrant.event.id,
				RoomName: overrideRequestToGrant.event.room,
				LocationName: overrideRequestToGrant.event.location
			}
		};
		let queryDataString = JSON.stringify(queryData);
		request.post('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body) {
				let path: string = overrideRequestToGrant.event.id + '/' + overrideRequestToGrant.event.location +
					'/' + overrideRequestToGrant.event.room;
				request.delete('/api/overriderequests/' + path).end((err: {}, delRes: any) => {
					if (delRes && delRes.body) {
						this.sendOverrideGrantMessageToRequestor(overrideRequestToGrant, reply);
						if (overrideRequestToGrant.adminRequested)
							this.sendOverrideGrantMessageToOwner(overrideRequestToGrant, reply);
						let overrideRequests = this.state.overrideRequests.slice(0);
						overrideRequests.splice(index, 1);

						if (Number(this.state.notifications.length + overrideRequests.length) <= 0)
							this.setState({ overrideRequests: overrideRequests, open: false });
						else
							this.setState({ overrideRequests: overrideRequests });
					} else
						alert('failed deleting override request. Handle properly!');
					// TODO: handle this failed error properly
				});
			} else
				alert('failed while granting override request. Handle properly!');
			// TODO: handle this failed error properly
		});
	}

	sendOverrideGrantMessageToRequestor = (overrideRequest: OverrideRequestData, reply: string) => {
		let punctuation = '';
		let replyPunctuation = reply.slice(reply.length - 1);
		if (replyPunctuation !== '.' && replyPunctuation !== '!' && replyPunctuation !== '?')
			punctuation = '.';

		let responseString = '';
		let responderString = '<<break>>Event owner\'s response: "';
		if (overrideRequest.adminRequested)
			responderString = '<<break>>Admin\'s response: "';

		if (reply !== '')
			responseString = responderString + reply + '"' + punctuation;

		let queryData = {
			insertValues: {
				'Title': 'Timeslot Request Granted.',
				'Message': 'Request for timeslot on event, \'' + overrideRequest.event.title +
					'\' has been granted. The timeslot has been reserved for you and can now be modified.' + responseString,
				'ToCWID': overrideRequest.fromCWID
			}
		};
		let queryDataString = JSON.stringify(queryData);
		request.put('/api/notifications').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (!res || !res.body)
				alert('sending denied override request notification failed! Handle this properly!');
			// TODO: handle this error properly
		});
	}

	sendOverrideGrantMessageToOwner = (overrideRequest: OverrideRequestData, adminResponse: string) => {
		let punctuation = '';
		let replyPunctuation = adminResponse.slice(adminResponse.length - 1);
		if (replyPunctuation !== '.' && replyPunctuation !== '!' && replyPunctuation !== '?')
			punctuation = '.';

		let responseString = '';
		if (adminResponse !== '')
			responseString = '<<break>>Admin\'s response: "' + adminResponse + '"' + punctuation;

		let message = 'You originally denied ' + overrideRequest.fromName + '\'s request for the timeslot of your event, \'' +
			overrideRequest.event.title + '\'. An Admin has overridden your denial and reserved the event\'s timeslot for ' +
			overrideRequest.fromName + '.' + responseString;

		let queryData = {
			insertValues: {
				'Title': 'Timeslot Request Overridden by Admin.',
				'Message': message,
				'ToCWID': overrideRequest.ownerCWID
			}
		};
		let queryDataString = JSON.stringify(queryData);
		request.put('/api/notifications').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (!res || !res.body)
				alert('sending denied override request notification failed! Handle this properly!');
			// TODO: handle this error properly
		});
	}

	handleOverrideRequestDeny = (index: number, reply: string) => {
		let overrideRequestToDeny: OverrideRequestData = this.state.overrideRequests[index];
		if (this.props.role === 'administrator') {
			let path: string = overrideRequestToDeny.event.id + '/' + overrideRequestToDeny.event.location + '/' + overrideRequestToDeny.event.room;

			request.delete('/api/overriderequests/' + path).end((error: {}, res: any) => {
				if (res && res.body) {
					// TODO: send notification
					this.sendAdminOverrideDenyMessage(overrideRequestToDeny, reply);
					let overrideRequests = this.state.overrideRequests.slice(0);
					overrideRequests.splice(index, 1);

					if (Number(this.state.notifications.length + overrideRequests.length) <= 0)
						this.setState({ overrideRequests: overrideRequests, open: false });
					else
						this.setState({ overrideRequests: overrideRequests });
				} else
					alert('failed');
				// TODO: handle this failed message
			});
		} else if (this.props.role === 'instructor') {
			let queryData = {
				setValues: {
					'Denied': 1,
					'OwnerResponse': reply
				},
				where: {
					EventID: overrideRequestToDeny.event.id,
					RoomName: overrideRequestToDeny.event.room,
					LocationName: overrideRequestToDeny.event.location
				}
			};

			let queryDataString = JSON.stringify(queryData);
			request.post('/api/overriderequests').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body) {
					let overrideRequests = this.state.overrideRequests.slice(0);
					overrideRequests.splice(index, 1);

					if (Number(this.state.notifications.length + overrideRequests.length) <= 0)
						this.setState({ overrideRequests: overrideRequests, open: false });
					else
						this.setState({ overrideRequests: overrideRequests });
				} else
					alert('failed');
				// TODO: handle this failed message
			});
		}
	}

	sendAdminOverrideDenyMessage = (overrideRequest: OverrideRequestData, reply: string) => {
		let punctuation = '';
		let replyPunctuation = reply.slice(reply.length - 1);
		if (replyPunctuation !== '.' && replyPunctuation !== '!' && replyPunctuation !== '?')
			punctuation = '.';

		let title: string = 'Timeslot Request Denied.';
		let message: string = 'Request for timeslot on event, \'' + overrideRequest.event.title + '\' has been denied by an admin.<<break>>' +
			'Admin\'s response: "' + reply + '"' + punctuation;
		if (overrideRequest.adminRequested) {
			title = 'Timeslot Request Override Denied.';
			message = 'Your request for an admin to override ' + overrideRequest.event.ownerName + '\'s denial of your timeslot request on event, \'' +
				overrideRequest.event.title + '\' has been denied.<<break>>' + 'Admin\'s response: "' + reply + '"' + punctuation;
		}

		let queryData = {
			insertValues: {
				'Title': title,
				'Message': message,
				'ToCWID': overrideRequest.fromCWID
			}
		};
		let queryDataString = JSON.stringify(queryData);
		request.put('/api/notifications').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (!res || !res.body)
				alert('sending denied override request notification failed! Handle this properly!');
			// TODO: handle this error properly
		});
	}

	handleShowEvent = (event: Event) => {
		if (this.viewEventModal)
			this.viewEventModal.beginView(event);
	}

}

export default NotificationDropdown;