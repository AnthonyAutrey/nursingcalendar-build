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
		let title: JSX.Element = (
			<h6 className="mt-2">
				<strong>
					Request for Timeslot of Event:
					<a href="#" onClick={() => this.props.handleShowEvent(this.props.overrideRequestData.event)}>
						{' ' + this.props.overrideRequestData.event.title}
					</a>
				</strong>
			</h6>
		);

		let message: JSX.Element = (
			<p>
				{this.props.overrideRequestData.fromName + ' has requested the timeslot of your event, '}
				<a href="#" onClick={() => this.props.handleShowEvent(this.props.overrideRequestData.event)}>{this.props.overrideRequestData.event.title}</a>
				.
			</p>
		);

		let punctuation = '';
		if (this.props.overrideRequestData.message.slice(this.props.overrideRequestData.message.length - 1) !== '.')
			punctuation = '.';

		let contents = (
			<div>
				{message}
				<div className="d-flex form-group mb-0">
					<label className="font-weight-bold mr-3">Message:</label>
					<p className="mb-0">
						{'"' + this.props.overrideRequestData.message + '"' + punctuation}
					</p>
				</div>
				<hr />
				<div className="d-flex form-group">
					<label className="font-weight-bold mr-3">Reply:</label>
					<textarea
						value={this.state.reply}
						onChange={this.handleChangeReply}
						className="form-control"
						placeholder="Explain why you're to granting or denying this request."
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