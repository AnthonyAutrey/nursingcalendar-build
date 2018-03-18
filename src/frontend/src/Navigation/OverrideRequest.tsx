import * as React from 'react';
import { OverrideRequestData } from './NotificationDropdown';
import { Event } from '../Home/ViewingCalendar';

interface Props {
	index: number;
	overrideRequestData: OverrideRequestData;
	handleShowEvent: Function;
	handleGrant: Function;
	handleDeny: Function;
	isAdminRequest: boolean;
}

interface State {
	reply: string;
	showDetails: boolean;
}

export class OverrideRequest extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			reply: '',
			showDetails: false
		};
	}

	render() {
		let titleText: string = 'Request for Timeslot of Your Event:';
		let messageText = this.props.overrideRequestData.fromName + ' has requested the timeslot of your event, ';
		let overrideMessageText = null;
		let placeholderText = 'Explain why you\'re granting or denying this request.';
		if (this.props.overrideRequestData.adminRequested) {
			titleText = 'Admin Override Request for Timeslot of Event:';
			messageText = this.props.overrideRequestData.event.ownerName + ' has denied ' +
				this.props.overrideRequestData.fromName + '\'s request for the timeslot of event, ';
			overrideMessageText = (
				<p>
					<strong>
						{' ' + this.props.overrideRequestData.fromName + ' has requested that you override this denial.'}
					</strong>
				</p>
			);
			placeholderText = 'Explain why you\'re granting or denying this override request.';
		}

		let title: JSX.Element = (
			<h6 className="mt-2">
				<strong>
					{titleText}
					<a href="#" onClick={() => this.props.handleShowEvent(this.props.overrideRequestData.event)}>
						{' ' + this.props.overrideRequestData.event.title}
					</a>
				</strong>
			</h6>
		);

		let message: JSX.Element = (
			<div>
				<p>
					{messageText}
					<a href="#" onClick={() => this.props.handleShowEvent(this.props.overrideRequestData.event)}>{this.props.overrideRequestData.event.title}</a>
					.
				</p>
				{overrideMessageText}
			</div>
		);

		let denialMessage = null;
		if (this.props.overrideRequestData.ownerResponse && this.props.overrideRequestData.adminRequested) {
			let denialAddedPunctuation = '';
			let denialPunctuation = this.props.overrideRequestData.ownerResponse.slice(this.props.overrideRequestData.ownerResponse.length - 1);
			if (denialPunctuation !== '.' && denialPunctuation !== '!' && denialPunctuation !== '?')
				denialAddedPunctuation = '.';

			denialMessage = (
				<div className="d-flex form-group mb-0">
					<label className="font-weight-bold mr-3">Denial Message:</label>
					<p className="mb-0">
						{'"' + this.props.overrideRequestData.ownerResponse + '"' + denialAddedPunctuation}
					</p>
				</div>
			);
		}

		let messageAddedPunctuation = '';
		let messagePunctuation = this.props.overrideRequestData.message.slice(this.props.overrideRequestData.message.length - 1);
		if (messagePunctuation !== '.' && messagePunctuation !== '!' && messagePunctuation !== '?')
			messageAddedPunctuation = '.';

		let contents = (
			<div>
				{message}
				<div className="d-flex form-group mb-0">
					<label className="font-weight-bold mr-3">Request Message:</label>
					<p className="mb-0">
						{'"' + this.props.overrideRequestData.message + '"' + messageAddedPunctuation}
					</p>
				</div>
				{denialMessage}
				<hr />
				<div className="d-flex form-group">
					<label className="font-weight-bold mr-3">Reply:</label>
					<textarea
						value={this.state.reply}
						onChange={this.handleChangeReply}
						className="form-control"
						placeholder={placeholderText}
						rows={3}
					/>
				</div>
				<div className="d-flex">
					<div className="w-100 mr-1">
						<button onClick={this.handleDeny} type="button" className="btn btn-danger btn-sm btn-block">Deny</button>
					</div>
					<div className="w-100 ml-1">
						<button
							onClick={() => this.props.handleGrant(this.props.index, this.state.reply)}
							type="button"
							className="btn btn-success btn-sm btn-block"
						>
							Grant
						</button>
					</div>
				</div>
			</div>
		);

		if (!this.state.showDetails)
			contents = (
				<button className="btn btn-primary btn-sm" onClick={() => this.setState({ showDetails: true })}>Respond to Request</button>
			);

		return (
			<div className="card p-2 mb-1 ">
				<div className="w-10">
					{title}
					<hr />
				</div>
				{contents}
			</div>
		);
	}

	handleChangeReply = (event: any) => {
		if (event.target.value.length <= 300)
			this.setState({ reply: event.target.value });
	}

	handleDeny = () => {
		if (this.state.reply.length > 0)
			this.props.handleDeny(this.props.index, this.state.reply);
		else
			alert('You must give a reply when denying a timeslot request!');
	}
}

export default OverrideRequest;