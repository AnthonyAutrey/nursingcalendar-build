import * as React from 'react';
import { Event } from './ViewingCalendar';
import { CSSProperties } from 'react';
const request = require('superagent');
const uuid = require('uuid/v4');

interface Props {
	hideGroups?: boolean;
}

interface State {
	show: boolean;
	showRequestForm: boolean;
	requestMessage: string;
	event: Event | null;
}

export class ViewEventModal extends React.Component<Props, State> {
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

		let groupString: string[] = this.state.event.groups.map(group => {
			return group + ', ';
		});
		if (this.state.event.groups.length > 0)
			groupString[groupString.length - 1] = groupString[groupString.length - 1].slice(0, groupString[groupString.length - 1].length - 2) + '.';
		else
			groupString = ['No groups assigned.'];

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
							<div className="d-flex align-items-end mb-2">
								<div className="font-weight-bold mb-0 mr-2">
									Location:
								</div>
								<div className="mb-0">
									{this.state.event.location + ', ' + this.state.event.room}
								</div>
							</div>
							<div className="d-flex align-items-end">
								<div className="font-weight-bold mb-0 mr-2">
									Time:
								</div>
								<div className="mb-0">
									{this.getTimeString()}
								</div>
							</div>
							<hr />
							<div className="form-group text-left">
								<label className="font-weight-bold">Created By:</label>
								<br />
								{this.state.event.ownerName}
							</div>
							<div className="form-group text-left">
								<label className="font-weight-bold">Description:</label>
								<br />
								{descriptionString}
							</div>
							{!this.props.hideGroups && (
								<div className="form-group text-left">
									<label className="font-weight-bold">Groups:</label>
									<br />
									{groupString}
								</div>
							)}
						</div>
						<div className="modal-footer" >
							<div className="mr-0">
								<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.close}>Close</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Modal Open and Close ///////////////////////////////////////////////////////////////////////////////////////////////
	public beginView = (event: Event) => {
		this.setState({ event: event, show: true });
	}

	private close = () => {
		this.resetState();
	}

	// Reset Everything ////////////////////////////////////////////////////////////////////////////////////////////////////
	private resetState = () => {
		this.setState({ event: null, show: false, showRequestForm: false, requestMessage: '' });
	}

	// Utilities ///////////////////////////////////////////////////////////////////////////////////////////////////////////
	private getTimeString = (): string => {
		if (this.state.event) {
			let options = {
				timeZone: 'America/Chicago',
				year: 'numeric', month: 'short',
				day: 'numeric', hour: 'numeric', minute: 'numeric'
			};
			let d = new Date(this.state.event.start);
			let start = new Date(this.state.event.start + (60000 * d.getTimezoneOffset()));
			let startString = start.toLocaleTimeString('en-us', options);

			if (this.state.event.end) {
				let end = new Date(this.state.event.end + (60000 * d.getTimezoneOffset()));
				let endString = end.toLocaleTimeString('en-us', options);
				return startString + ' - ' + endString;
			}

			return startString;
		} else
			return '';
	}
}

export default ViewEventModal;