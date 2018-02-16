import * as React from 'react';
import { Event } from './SchedulerCalendar';
import { CSSProperties } from 'react';
const request = require('superagent');
const uuid = require('uuid/v4');

interface Props {
	cwid: number;
	handleOverrideRequest: Function;
}

interface State {
	show: boolean;
	showRequestForm: boolean;
	requestMessage: string;
	event: Event | null;
}

export class UnownedEventModal extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			show: false,
			showRequestForm: false,
			requestMessage: '',
			event: null
		};
	}

	render() {
		if (!this.state.show || !this.state.event)
			return null;

		let backdropStyle: CSSProperties = {
			zIndex: Number.MAX_SAFE_INTEGER,
			position: 'fixed',
			overflow: 'auto',
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
			backgroundColor: 'rgba(0,0,0,0.3)',
			padding: 'auto'
		};

		if (!this.state.event)
			return null;

		let descriptionString = this.state.event.description;
		if (this.state.event.description === '')
			descriptionString = 'No description.';

		let groupString: string[] = this.state.event.groups.map(event => {
			return event + ', ';
		});
		if (this.state.event.groups.length > 0)
			groupString[groupString.length - 1] = groupString[groupString.length - 1].slice(0, groupString[groupString.length - 1].length - 2) + '.';
		else
			groupString = ['No groups assigned.'];

		let requestForm = null;
		if (this.state.showRequestForm && !this.state.event.pendingOverride)
			requestForm = (
				<div className="form-group text-left">
					<label className="font-weight-bold">Request Message:</label>
					<textarea
						tabIndex={2}
						value={this.state.requestMessage}
						onChange={this.handleChangeRequestMessage}
						className="form-control"
						placeholder="Describe why you need this timeslot."
						rows={3}
					/>
					<div className="d-flex">
						<button onClick={this.hideRequestForm} type="button" className="btn btn-danger mt-2 ml-auto">Cancel</button>
						<button onClick={this.handleRequestTimeSlot} type="button" className="btn btn-primary mt-2 ml-2">Submit Request</button>
					</div>
				</div>
			);

		let pendingOverrideMessage = null;
		if (this.state.event.pendingOverride)
			pendingOverrideMessage = (
				<div className="font-weight-bold mb-2 text-danger">
					<span className="oi oi-loop" />
					&nbsp;
					There is a pending request for this timeslot.
				</div>
			);

		return (
			<div style={backdropStyle}>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<h5 className="font-weight-bold">
								{this.state.event.title}
							</h5>
							<button type="button" className="close" onClick={this.close} aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div className="modal-body pb-0 mb-0">
							<div className="form-group text-left">
								<label className="font-weight-bold">Owner:</label>
								<br />
								{this.state.event.ownerName}
							</div>
							<div className="form-group text-left">
								<label className="font-weight-bold">Description:</label>
								<br />
								{descriptionString}
							</div>
							<div className="form-group text-left">
								<label className="font-weight-bold">Relevant Groups:</label>
								<br />
								{groupString}
							</div>
							{requestForm}
						</div>
						<div className="modal-footer">
							<div className="container-fluid m-0 p-0">
								<div className="d-flex flex-wrap">
									<div className="mr-auto">
										{pendingOverrideMessage}
										<button
											hidden={this.state.showRequestForm || this.state.event.pendingOverride}
											type="button"
											className="btn btn-danger"
											onClick={this.showRequestForm}
										>
											<span className=" oi oi-loop" />
											<span>&nbsp;&nbsp;</span>
											Request This Timeslot
										</button>
									</div>
									<div className="mr-0">
										<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.close}>Close</button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Modal Open and Close ///////////////////////////////////////////////////////////////////////////////////////////////
	public beginEdit = (event: Event) => {
		this.setState({ event: event, show: true });
	}

	private close = () => {
		this.resetState();
	}

	// Request TimeSlot ////////////////////////////////////////////////////////////////////////////////////////////////////
	private showRequestForm = () => {
		this.setState({ showRequestForm: true });
	}

	private hideRequestForm = () => {
		this.setState({ showRequestForm: false, requestMessage: '' });
	}

	private handleChangeRequestMessage = (event: any) => {
		if (event.target.value.length <= 300)
			this.setState({ requestMessage: event.target.value });
	}

	private handleRequestTimeSlot = () => {
		if (this.state.requestMessage.length < 1)
			alert('Please include a message with your request.');
		else {
			new Promise((resolve, reject) => {
				if (!this.state.event)
					reject();
				else {
					let queryData = {
						insertValues: {
							'EventID': this.state.event.id,
							'Message': this.state.requestMessage,
							'Time': this.getCurrentDateTimeInSqlFormat(),
							'Accepted': 'false',
							'RequestorCWID': this.props.cwid
						}
					};
					let queryDataString = JSON.stringify(queryData);
					request.put('/api/overriderequests').set('queryData', queryDataString).end((error: {}, res: any) => {
						if (res && res.body) {
							resolve();
							console.log('created override request: ' + JSON.stringify(res.body));
						} else
							reject();
					});
				}
			}).then(() => {
				if (this.state.event)
					this.props.handleOverrideRequest(this.state.event.id);
			}).catch(() => {
				// TODO: handle failure better
				alert('Something went wrong!');
			});
		}
	}

	private getCurrentDateTimeInSqlFormat = () => {
		// TODO: This produces a UTC time, ensure that's what it needs to be
		return new Date().toISOString().slice(0, 19).replace('T', ' ');
	}

	// Reset Everything ////////////////////////////////////////////////////////////////////////////////////////////////////
	private resetState = () => {
		this.setState({ event: null, show: false, showRequestForm: false, requestMessage: '' });
	}
}

export default UnownedEventModal;