import * as React from 'react';
import { CSSProperties } from 'react';
import { EventGroupSelector } from './EventGroupSelector';
import { RecurringEventInfo, RecurringEvents } from '../Utilities/RecurringEvents';
import { Moment } from 'moment';
import * as moment from 'moment';

const uuid = require('uuid/v4');

interface Props {
	show: boolean;
	groupOptionsFromAPI: string[];
	closeHandler: Function;
	creationHandler: Function;
}

interface State {
	title: string;
	description: string;
	repeatType: 'none' | 'daily' | 'weekly' | 'monthly';
	eventStartDayChar: 'm' | 't' | 'w' | 'r' | 'f' | 's' | 'u' | '';
	repeatDaysForWeekly: string;
	repeatEndDate: string;
	eventStart: Moment;
	eventEnd: Moment;
	groups: string[];
}

export class CreateEventModal extends React.Component<Props, State> {
	private defaultTitle: string = 'New Event';
	public titleInput: any = null;

	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			title: '',
			description: '',
			repeatType: 'none',
			repeatDaysForWeekly: '',
			eventStartDayChar: '',
			groups: [],
			repeatEndDate: this.getDateInputString(moment()),
			eventStart: moment(),
			eventEnd: moment()
		};
	}

	render() {
		if (!this.props.show)
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

		let repeatMenu = null;
		if (this.state.repeatType === 'daily' || this.state.repeatType === 'monthly')
			repeatMenu = this.getRepeatEndForm();
		else if (this.state.repeatType === 'weekly')
			repeatMenu = (
				<div>
					{this.getWeeklyCheckBoxes()}
					{this.getRepeatEndForm()}
				</div>
			);

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
							<div className="form-group row">
								<div className="col-form-label col-md-5">Repeat:</div>
								<div className="col-md-7">
									<select
										className="ml-auto form-control"
										value={this.state.repeatType}
										onChange={this.handleChangeRepeatType}
									>
										<option value="none">Don't Repeat</option>
										{
											!this.eventIsOver24Hours() &&
											<option value="daily">Daily</option>
										}
										{
											!this.eventIsOver24Hours() &&
											<option value="weekly">Weekly</option>
										}
										<option value="monthly">{'Monthly, ' + RecurringEvents.getMonthlyDayIndicatorString(this.state.eventStart)}</option>
									</select>
								</div>
							</div>
							{repeatMenu}
							<div className="form-group text-left mr-auto">
								<div className="d-flex flex-wrap mb-2">
									<label className="mr-auto">Groups:</label>
									{addButton}
								</div>
								{
									this.props.groupOptionsFromAPI.length > 0 ?
										groupSelectors :
										'No schedulable groups assigned, please see an admin.'
								}
							</div>
						</div>
						<div className="modal-footer">
							<div className="mr-0">
								<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.save}>Create Event</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleTitleChange = (event: any) => {
		this.setState({ title: event.target.value });
	}

	handleDescriptionChange = (event: any) => {
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

	handleKeyPress = (event: any) => {
		if (event.key === 'Enter')
			this.save();
	}

	close = () => {
		this.resetFields();
		this.props.closeHandler();
	}

	save = () => {

		if (!this.repeatEndDateIsValid())
			return;

		let title = this.state.title;
		if (title === '')
			title = this.defaultTitle;

		let recurringInfo: RecurringEventInfo | undefined = undefined;
		if (this.state.repeatType !== 'none')
			recurringInfo = {
				type: this.state.repeatType,
				monthlyDay: RecurringEvents.getWeekDayCount(this.state.eventStart) + RecurringEvents.getDayOfWeekChar(this.state.eventStart),
				weeklyDays: this.state.repeatType === 'weekly' ? this.state.repeatDaysForWeekly : undefined,
				startDate: this.state.eventStart,
				endDate: moment(this.state.repeatEndDate)
			};

		this.props.creationHandler(title, this.state.description, this.state.groups, recurringInfo);
		this.resetFields();
	}

	repeatEndDateIsValid = (): boolean => {
		if (this.state.repeatType === 'monthly') {
			let firstMonthlyRepeatDate = this.getFirstMonthlyRepeatDate();
			if (!firstMonthlyRepeatDate &&
				!confirm('The \'Repeat Until\' date occurs before the event\'s next repeat date.' +
					' This means that the event will not repeat. Do you want to continue?'))
				return false;
		}

		let repeatEndDate = moment(this.state.repeatEndDate);
		if (this.state.repeatType === 'daily' || this.state.repeatType === 'weekly') {
			if ((this.state.eventStart.format('YYYY-MM-DD') === repeatEndDate.format('YYYY-MM-DD') ||
				repeatEndDate.isBefore(this.state.eventStart)) &&
				!confirm('The \'Repeat Until\' date occurs before the event\'s next repeat date.' +
					' This means that the event will not repeat. Do you want to continue?'))
				return false;
		}

		return true;
	}

	resetFields = () => {
		this.setState({
			title: '',
			description: '',
			groups: [],
			repeatType: 'none',
			repeatDaysForWeekly: '',
			repeatEndDate: this.getDateInputString(moment()),
			eventStart: moment(),
			eventEnd: moment(),
			eventStartDayChar: '',
		});
	}

	// Recurring Events /////////////////////////////////////////////////////////////////////////////////////////////////////////

	public setEventStart = (startDate: Moment) => {
		let dayOfWeekCharacter = RecurringEvents.getDayOfWeekChar(startDate);
		this.setState({ eventStart: startDate, repeatDaysForWeekly: dayOfWeekCharacter, eventStartDayChar: dayOfWeekCharacter });
	}

	public setEventEnd = (endDate: Moment) => {
		this.setState({ eventEnd: endDate, repeatEndDate: this.getDateInputString(endDate) });
	}

	getDateInputString = (date: Moment): string => {
		return date.format('YYYY-MM-DD');
	}

	eventIsOver24Hours = () => {
		let duration = moment.duration(this.state.eventEnd.diff(this.state.eventStart));
		let hours = duration.asHours();
		return hours > 24;
	}

	getFirstMonthlyRepeatDate = (): Moment | undefined => {
		let eventStart = this.state.eventStart.clone();
		let endDate = moment(this.state.repeatEndDate).add(1, 'days');
		let iterateDate = eventStart.clone();
		iterateDate.add(1, 'days');
		let startDayWeekDayCount = RecurringEvents.getWeekDayCount(this.state.eventStart);

		let dayCount = 0;
		let firstMonthlyRepeatDate = undefined;
		while (iterateDate.isBefore(endDate)) {

			// check if iterateDate's weekday matches exactly, or if last weekday of that type
			if ((RecurringEvents.getWeekDayCount(iterateDate) === startDayWeekDayCount ||
				(startDayWeekDayCount === 5 && RecurringEvents.getWeekDayCount(iterateDate) === 4 &&
					iterateDate.clone().add(7, 'days').month() !== iterateDate.month())) &&
				RecurringEvents.getDayOfWeekChar(iterateDate) === this.state.eventStartDayChar) {
				firstMonthlyRepeatDate = iterateDate;
				break;
			}
			iterateDate.add(1, 'days');
		}

		return firstMonthlyRepeatDate;
	}

	handleChangeRepeatType = (e: any) => {
		this.setState({ repeatType: e.target.value });
	}

	handleChangeRepeatEndDate = (e: any) => {
		this.setState({ repeatEndDate: e.target.value });
	}

	handleChangeWeekDay = (event: any, day: 'm' | 't' | 'w' | 'r' | 'f' | 's' | 'u') => {
		if (event.target.checked)
			this.setState({ repeatDaysForWeekly: this.state.repeatDaysForWeekly + day });
		else
			this.setState({ repeatDaysForWeekly: this.state.repeatDaysForWeekly.replace(day, '') });
	}

	getWeeklyCheckBoxes = () => {
		return (
			<div className="form-group row ml-auto">
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="checkbox"
						id="inlineCheckboxMon"
						disabled={this.state.eventStartDayChar === 'm'}
						checked={this.state.repeatDaysForWeekly.includes('m')}
						onChange={(e) => this.handleChangeWeekDay(e, 'm')}
					/>
					<label className="form-check-label" htmlFor="inlineCheckboxMon">Mon</label>
				</div>
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="checkbox"
						id="inlineCheckboxTues"
						disabled={this.state.eventStartDayChar === 't'}
						checked={this.state.repeatDaysForWeekly.includes('t')}
						onChange={(e) => this.handleChangeWeekDay(e, 't')}
					/>
					<label className="form-check-label" htmlFor="inlineCheckboxTues">Tues</label>
				</div>
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="checkbox"
						id="inlineCheckboxWed"
						disabled={this.state.eventStartDayChar === 'w'}
						checked={this.state.repeatDaysForWeekly.includes('w')}
						onChange={(e) => this.handleChangeWeekDay(e, 'w')}
					/>
					<label className="form-check-label" htmlFor="inlineCheckboxWed">Wed</label>
				</div>
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="checkbox"
						id="inlineCheckboxThurs"
						disabled={this.state.eventStartDayChar === 'r'}
						checked={this.state.repeatDaysForWeekly.includes('r')}
						onChange={(e) => this.handleChangeWeekDay(e, 'r')}
					/>
					<label className="form-check-label" htmlFor="inlineCheckboxThurs">Thurs</label>
				</div>
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="checkbox"
						id="inlineCheckboxFri"
						disabled={this.state.eventStartDayChar === 'f'}
						checked={this.state.repeatDaysForWeekly.includes('f')}
						onChange={(e) => this.handleChangeWeekDay(e, 'f')}
					/>
					<label className="form-check-label" htmlFor="inlineCheckboxFri">Fri</label>
				</div>
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="checkbox"
						id="inlineCheckboxSat"
						disabled={this.state.eventStartDayChar === 's'}
						checked={this.state.repeatDaysForWeekly.includes('s')}
						onChange={(e) => this.handleChangeWeekDay(e, 's')}
					/>
					<label className="form-check-label" htmlFor="inlineCheckboxSat">Sat</label>
				</div>
				<div className="form-check form-check-inline">
					<input
						className="form-check-input"
						type="checkbox"
						id="inlineCheckboxSun"
						disabled={this.state.eventStartDayChar === 'u'}
						checked={this.state.repeatDaysForWeekly.includes('u')}
						onChange={(e) => this.handleChangeWeekDay(e, 'u')}
					/>
					<label className="form-check-label" htmlFor="inlineCheckboxSun">Sun</label>
				</div>
			</div>
		);
	}

	getRepeatEndForm = () => {
		return (
			<div>
				<div className="form-group row">
					<div className="col-form-label col-md-5">Repeat Until:</div>
					<div className="col-md-7">
						<input
							className="form-control"
							value={this.state.repeatEndDate}
							onChange={this.handleChangeRepeatEndDate}
							type="date"
						/>
					</div>
				</div>
				<hr />
			</div>
		);
	}
}

export default CreateEventModal;