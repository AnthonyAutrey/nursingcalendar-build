import * as React from 'react';
import { EventGroupSelector } from './EventGroupSelector';
import { RecurringEventInfo, RecurringEvents } from '../Utilities/RecurringEvents';
import { CSSProperties } from 'react';
const request = require('superagent');
const uuid = require('uuid/v4');

interface Props {
	saveHandler: Function;
	deleteHandler: Function;
	groupOptionsFromAPI: string[];
}

interface State {
	show: boolean;
	eventID?: number;
	title: string;
	description: string;
	groups: string[];
	recurringInfo?: RecurringEventInfo;
}

export class EditEventModal extends React.Component<Props, State> {
	public titleInput: any = null;

	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			show: false,
			title: '',
			description: '',
			groups: []
		};
	}

	render() {
		if (!this.state.show)
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

		let recurringInfoDetails = null;
		if (this.state.recurringInfo) {
			recurringInfoDetails = (
				<div className="form-group text-left">
					<label>Recurrence:</label>
					<p className="ml-3">
						{this.getRecurringDetailString()}
					</p>
				</div>
			);
		}

		let remainingGroupOptions: string[] = this.props.groupOptionsFromAPI.filter(option => {
			return !this.state.groups.includes(option);
		});

		let groupSelectors = this.state.groups.map(group => {
			let options: string[] = remainingGroupOptions.slice(0);
			options.unshift(group);
			options.sort((a, b) => {
				if (a < b) return -1;
				if (a > b) return 1;
				return 0;
			});
			let selector = (
				<EventGroupSelector
					key={uuid()}
					index={this.state.groups.indexOf(group)}
					selected={group}
					options={options}
					handleGroupChange={this.handleGroupChange}
					handleDelete={this.handleDeleteGroup}
				/>
			);
			return selector;
		});

		let addButton: JSX.Element | null = (
			<div>
				<button type="button" onClick={this.handleAddGroup} className="d-block d-sm-none btn btn-primary">
					Add &nbsp;
					<span className="plusIcon oi oi-size-sm oi-plus" />
				</button>
				<button type="button" onClick={this.handleAddGroup} className="d-none d-sm-block btn btn-primary">
					Add Group &nbsp;&nbsp;
					<span className="plusIcon oi oi-size-sm oi-plus" />
				</button>
			</div>
		);

		if (this.props.groupOptionsFromAPI.length === this.state.groups.length)
			addButton = null;

		return (
			<div onKeyPress={this.handleKeyPress} style={backdropStyle}>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<input
								autoFocus={true}
								tabIndex={1}
								type="text"
								placeholder="New Event"
								value={this.state.title}
								onChange={this.handleTitleChange}
								className="modal-title form-control mx-0 px-0"
								id="exampleModalLabel"
							/>
							<button type="button" className="close" onClick={this.close} aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div className="modal-body pb-0 mb-0">
							<div className="form-group text-left">
								<label>Description:</label>
								<textarea
									tabIndex={2}
									value={this.state.description}
									onChange={this.handleDescriptionChange}
									className="form-control"
									placeholder="(Optional)"
									rows={3}
								/>
							</div>
							{recurringInfoDetails}
							<div className="form-group text-left mr-auto">
								<div className="d-flex flex-wrap mb-2">
									<label className="mr-auto">Groups:</label>
									{addButton}
								</div>
								{groupSelectors}
							</div>
						</div>
						<div className="modal-footer">
							<div className="container-fluid m-0 p-0">
								<div className="d-flex flex-wrap">
									<div className="mr-auto">
										<button type="button" className="btn btn-danger" onClick={this.delete}>
											<span className=" oi oi-trash" />
											<span>&nbsp;&nbsp;</span>
											Delete
										</button>
									</div>
									<div className="d-block d-sm-none mr-0">
										<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.save}>Save</button>
									</div>
									<div className="d-none d-sm-block mr-0">
										<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.save}>Save Changes</button>
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
	public beginEdit = (eventID: number, title: string, description: string, groups: string[], recurringInfo?: RecurringEventInfo) => {
		this.setState({ title: title, description: description, eventID: eventID, groups: groups, show: true, recurringInfo: recurringInfo });
	}

	private close = () => {
		this.resetState();
	}

	// Title and Description ///////////////////////////////////////////////////////////////////////////////////////////////
	private handleTitleChange = (event: any) => {
		this.setState({ title: event.target.value });
	}

	private handleDescriptionChange = (event: any) => {
		if (event.target.value.length <= 300)
			this.setState({ description: event.target.value });
	}

	// Groups //////////////////////////////////////////////////////////////////////////////////////////////////////////////
	private handleGroupChange = (index: number, event: any) => {
		let newGroups = this.state.groups.slice(0);
		newGroups[index] = event.target.value;
		this.setState({ groups: newGroups });
	}

	private handleDeleteGroup = (index: number) => {
		let newGroups = this.state.groups.slice(0);
		newGroups.splice(index, 1);
		this.setState({ groups: newGroups });
	}

	private handleAddGroup = () => {
		let unselectedGroups: string[] = this.props.groupOptionsFromAPI.filter(option => {
			return !this.state.groups.includes(option);
		});

		if (unselectedGroups.length > 0) {
			let newGroups = this.state.groups.slice(0);
			newGroups.push(unselectedGroups[0]);
			this.setState({ groups: newGroups });
		}
	}

	// Recurrence //////////////////////////////////////////////////////////////////////////////////////////////////////////

	getRecurringDetailString = (): string => {
		let detailString = '';
		let recurringInfo = this.state.recurringInfo;
		if (recurringInfo && recurringInfo.type === 'daily')
			detailString = 'Daily from ' + recurringInfo.startDate.format('MM-DD-YYYY') + ' to ' + recurringInfo.endDate.format('MM-DD-YYYY') + '.';
		else if (recurringInfo && recurringInfo.type === 'weekly')
			detailString = 'Weekly on ' + this.getWeeklyCommaString() +
				', from ' + recurringInfo.startDate.format('MM-DD-YYYY') + ' to ' + recurringInfo.endDate.format('MM-DD-YYYY') + '.';
		else if (recurringInfo && recurringInfo.type === 'monthly')
			detailString = 'Monthly, ' + RecurringEvents.getMonthlyDayIndicatorString(recurringInfo.startDate) + '.';

		return detailString;
	}

	getWeeklyCommaString = (): string => {
		if (this.state.recurringInfo) {
			let commaString = '';
			let weekDays = this.state.recurringInfo.weeklyDays;
			if (weekDays && weekDays.includes('m'))
				commaString += 'Mon, ';
			if (weekDays && weekDays.includes('t'))
				commaString += 'Tues, ';
			if (weekDays && weekDays.includes('w'))
				commaString += 'Wed, ';
			if (weekDays && weekDays.includes('r'))
				commaString += 'Thurs, ';
			if (weekDays && weekDays.includes('f'))
				commaString += 'Fri, ';
			if (weekDays && weekDays.includes('s'))
				commaString += 'Sat, ';
			if (weekDays && weekDays.includes('u'))
				commaString += 'Sun, ';

			if (commaString.substr(commaString.length - 2) === ', ')
				commaString = commaString.substr(0, commaString.length - 2);

			return commaString;
		} else
			return '';
	}

	// Buttons and Keypresses //////////////////////////////////////////////////////////////////////////////////////////////
	private handleKeyPress = (event: any) => {
		if (event.key === 'Enter')
			this.save();
	}

	private save = () => {
		let title = this.state.title;
		this.props.saveHandler(this.state.eventID, title, this.state.description, this.state.groups);
		this.resetState();
	}

	private delete = () => {
		this.resetState();
		this.props.deleteHandler(this.state.eventID);
	}

	// Reset Everything ////////////////////////////////////////////////////////////////////////////////////////////////////
	private resetState = () => {
		this.setState({ eventID: undefined, title: '', description: '', groups: [], show: false, recurringInfo: undefined });
	}
}

export default EditEventModal;