import * as React from 'react';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Props {
	index: number;
	title: string;
	message: string;
	hasBeenSeen: boolean;
	handleDeleteNotification: Function;
	overrideRequestDeniedInfo?: {
		eventID: number;
		location: string;
		room: string;
	};
}

export class Notification extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {
		let style = {};
		if (this.props.hasBeenSeen)
			style = {
				color: '#898989',
			};

		let messages: JSX.Element[] = this.props.message.split('<<break>>').map(str => {
			if (str.includes('Event owner\'s response:')) {
				let split = str.split('Event owner\'s response:');
				if (split.length > 0)
					return <p key={uuid()}><strong>{'Event owner\'s response:'}</strong>{split[1]}</p>;
			} else if (str.includes('Admin\'s response:')) {
				let split = str.split('Admin\'s response:');
				if (split.length > 0)
					return <p key={uuid()}><strong>{'Admin\'s response:'}</strong>{split[1]}</p>;
			}

			return <p key={uuid()}>{str}</p>;
		});

		let requestAdminButton = null;
		if (this.props.overrideRequestDeniedInfo)
			requestAdminButton = (
				<div>
					<button
						className="btn btn-sm btn-primary btn-block"
						onClick={() => this.handleRequestAdmin(this.props.overrideRequestDeniedInfo)}
					>
						Request Admin to Override Denial
					</button>
				</div>
			);

		let title: JSX.Element = <h6 className="mt-2"><strong>{this.props.title}</strong></h6>;
		if (this.props.title === 'Timeslot Request Denied.' ||
			this.props.title === 'Timeslot Request Override Denied.' ||
			this.props.title === 'Timeslot Request Overridden by Admin.')
			title = <h6 className="mt-2"><strong><span className="text-danger">{this.props.title}</span></strong></h6>;
		if (this.props.title === 'Timeslot Request Granted.')
			title = <h6 className="mt-2"><strong><span className="text-success">Timeslot Request Granted.</span></strong></h6>;

		return (
			<div className="card p-2 mb-1" style={style}>
				<div className="d-flex">
					<div className="w-100 mr-2">
						{title}
						<hr />
					</div>
					<div className="ml-auto">
						<button className="btn btn-sm btn-danger" onClick={() => this.deleteNotificationAndOverrideRequestIfPresent()} >&#10006;</button>
					</div>
				</div>
				{messages}
				{requestAdminButton}
			</div>
		);
	}

	handleRequestAdmin = (overrideRequestToDeny: any) => {
		let queryData = {
			setValues: {
				'AdminRequested': 1
			},
			where: {
				'EventID': overrideRequestToDeny.eventID,
				'RoomName': overrideRequestToDeny.room,
				'LocationName': overrideRequestToDeny.location
			}
		};

		let queryDataString = JSON.stringify(queryData);
		request.post('/api/overriderequests').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body)
				this.deleteNotification();
			else
				alert('failed');
			// TODO: handle this failed message
		});
	}

	deleteOverrideRequestFromDB = (): Promise<null> => {
		return new Promise((resolve, reject) => {
			if (this.props.overrideRequestDeniedInfo) {
				let path: string = this.props.overrideRequestDeniedInfo.eventID + '/' +
					this.props.overrideRequestDeniedInfo.location + '/' +
					this.props.overrideRequestDeniedInfo.room;

				request.delete('/api/overriderequests/' + path).end((error: {}, res: any) => {
					if (res && res.body)
						resolve();
					else
						reject();
				});
			} else
				reject();
		});
	}

	deleteNotificationAndOverrideRequestIfPresent = () => {
		if (this.props.overrideRequestDeniedInfo)
			this.deleteOverrideRequestFromDB().then(() => {
				this.deleteNotification();
			}).catch(() => {
				alert('Error deleting override request!, Handle Properly!');
				// TODO: handle properly!
			});
		else
			this.deleteNotification();
	}

	deleteNotification = () => {
		if (this.props.overrideRequestDeniedInfo)
			this.props.handleDeleteNotification(this.props.index, true);
		else
			this.props.handleDeleteNotification(this.props.index);
	}
}

export default Notification;