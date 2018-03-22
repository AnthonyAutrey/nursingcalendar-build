import * as React from 'react';
import { UnownedEventModal } from '../Scheduler/UnownedEventModal';
import { ViewEventModal } from './ViewEventModal';
import { Loading } from '../Generic/Loading';
import { ColorGenerator } from '../Utilities/Colors';
const request = require('superagent');
const FullCalendarReact = require('fullcalendar-reactwrapper');

interface Props {
	cwid: number;
	role: string;
	handleActiveRouteChange: Function;
}

interface State {
	events: Event[];
	loading: boolean;
	showPreferences: boolean;
	eventSize: number;
	collapseEvents: boolean;
	eventDisplay: 'title' | 'class' | 'classAndRoom' | 'titleAndRoom';
}

export interface Event {
	id: number;
	title: string;
	description: string;
	start: string;
	end?: string;
	ownerName: string;
	location: string;
	room: string;
	groups: string[];
	color?: string;
}

export class ViewingCalendar extends React.Component<Props, State> {

	private viewEventModal: ViewEventModal | null;
	private currentView: String | null = null;
	private currentDate: any | null = null;
	private smallestTimeInterval: number = Number.MAX_SAFE_INTEGER;
	private groupSemesterMap: Map<string, number | null> = new Map<string, number | null>();

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			events: [],
			loading: false,
			showPreferences: false,
			eventSize: 19,
			collapseEvents: false,
			eventDisplay: 'title'
		};
	}

	componentWillMount() {
		this.getEventsAndGroupsFromDB();
		this.props.handleActiveRouteChange('Home');
	}

	render() {
		let loading = null;
		if (this.state.loading)
			loading = <Loading />;

		let preferences = null;
		if (this.state.showPreferences)
			preferences = (
				<div className="container-fluid d-print-none">
					<div className="d-flex">
						<div className="form-inline mr-3 mt-1">
							<label className="form-label mr-2">Collapse Events:</label>
							<button
								className="btn btn-primary btn-sm"
								onClick={() => this.setState((prevState) => ({ collapseEvents: !prevState.collapseEvents }))}
								disabled={this.currentView !== 'month'}
							>
								{this.state.collapseEvents ? 'Don\'t Collapse' : 'Collapse'}
							</button>
						</div>
						<div className="form-inline mr-3 mt-1">
							<label className="form-label mr-2">Event Size:</label>
							<div className="d-inline-block">
								<button
									className="btn btn-primary btn-sm mr-1"
									onClick={this.handleEventSizeIncrease}
									disabled={this.state.collapseEvents || this.currentView !== 'month'}
								>
									Larger &nbsp;
									<span className="oi oi-caret-top" />
								</button>
								<button
									className="btn btn-primary btn-sm"
									onClick={this.handleEventSizeDecrease}
									disabled={this.state.collapseEvents || this.currentView !== 'month'}
								>
									Smaller &nbsp;
									<span className="oi oi-caret-bottom" />
								</button>
							</div>
						</div>
						<div className="form-inline mr-3 mt-1">
							<label className="form-label mr-2">Display:</label>
							<select
								className="form-control form-control-sm form-control-inline"
								onChange={this.handleDisplayChange}
								value={this.state.eventDisplay}
							>
								<option value="title">Event Title</option>
								<option value="titleAndRoom">Room - Event Title</option>
								<option value="class">Class Name</option>
								<option value="classAndRoom">Room - Class Name</option>
							</select>
						</div>
						{/* <button className="btn btn-primary ml-auto">Save Preferences</button> */}
					</div>
					<hr />
				</div>
			);

		return (
			<div className="ViewingCalendar">
				{loading}
				{preferences}
				<ViewEventModal ref={viewEventModal => { this.viewEventModal = viewEventModal; }} />
				<FullCalendarReact
					id="calendar"
					customButtons={{
						preferences: {
							text: !this.state.showPreferences ? 'Preferences' : 'Hide Preferences',
							click: () => {
								this.setState((prevState) => ({
									showPreferences: !prevState.showPreferences
								}));
							}
						},
						print: {
							text: 'Print',
							click: () => {
								window.print();
							}
						}
					}}
					displayEventEnd={this.currentView !== 'month' || (this.state.eventSize >= 38 && !this.state.collapseEvents)}
					timeFormat={'h(:mm)t'} // uppercase H for 24-hour clock
					header={{
						left: 'prev,next today preferences',
						center: 'title',
						right: 'print month,agendaWeek,agendaDay'
					}}
					defaultDate={(() => {
						if (this.currentDate)
							return this.currentDate;
						else
							return null;
					})()}
					defaultView={(() => {
						if (this.currentView)
							return this.currentView;
						else
							return 'month';
					})()}
					editable={false}
					slotEventOverlap={false}
					allDaySlot={false}
					eventOverlap={true}
					eventRender={this.renderEvent}
					eventLimit={this.state.collapseEvents} // allow "more" link when too many events
					eventClick={this.openViewEventModal}
					dayClick={(date: any) => {
						if (this.currentView === 'month') {
							this.currentDate = date;
							this.currentView = 'agendaWeek';
							this.forceUpdate();
						}
					}}
					events={this.state.events}
					eventTextColor="white"
					// eventDrop={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					// eventResize={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					height={700}
					// height={(view: any, x: any) => {
					// 	if (x === 'month')
					// 		return 700;

					// 	return 'auto';
					// }}
					// aspectRatio={1}
					// selectMinDistance={10}
					snapDuration={'00:15:00'}
					slotDuration={'00:30:00'}
					scrollTime={'6:00:00'}
					minTime={'06:00:00'}
					maxTime={'30:00:00'}
					// selectable={true}
					selectOverlap={false}
					selectHelper={true}
					viewRender={(view: any) => this.cacheViewAndDate(view)}
					firstDay={1}
				// select={this.handleCalendarSelect}
				/>
			</div>
		);
	}

	// Data Retreival /////////////////////////////////////////////////////////////////////////////////////////////////
	public getEventsAndGroupsFromDB(): void {
		if (this.props.role === 'student' || this.props.role === 'instructor')
			this.getUserFilteredEvents();
		else {
			this.setState({ loading: true });
			request.get('/api/eventswithrelations').end((error: {}, res: any) => {
				if (res && res.body) {
					this.populateGroupSemesterMap().then(() => {
						this.setState({ events: this.parseDBEvents(res.body), loading: false });
					}).catch(() => {
						alert('Error getting data!, Handle properly!');
						// TODO: handle this properly
					});
				} else
					alert('Error getting data!, Handle properly!');
				// TODO: handle this properly
			});

		}
	}

	getUserFilteredEvents(): string[] {
		this.setState({ loading: true });

		let groups: string[] = [];

		let queryData = {
			fields: 'GroupName'
		};
		let queryDataString = JSON.stringify(queryData);

		new Promise((resolve, reject) => {
			request.get('/api/usergroups/' + this.props.cwid).set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve(res.body);
				else
					reject();
			});
		}).then((userGroups: any) => {
			let eventQueryData = {
				where: {
					GroupName: userGroups.map((group: any) => {
						return group.GroupName;
					})
				}
			};
			let eventQueryDataString = JSON.stringify(eventQueryData);
			request.get('/api/eventswithrelations').set('queryData', eventQueryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					this.setState({ events: this.parseDBEvents(res.body), loading: false });
			});

		}).catch(() => {
			// TODO: Handle Failure
		});

		return groups;
	}

	parseDBEvents(body: any): Event[] {
		let parsedEvents: Event[] = [];
		for (let event of body) {
			let color = '#800029';
			if (event.Groups.length === 1)
				color = ColorGenerator.getColor(event.Groups[0].GroupName);

			let groups: string[] = event.Groups.map((group: any) => {
				return group.GroupName;
			});

			let parsedEvent: any = {
				id: event.EventID,
				title: event.Title,
				description: event.Description,
				start: event.StartTime,
				end: event.EndTime,
				ownerName: event.OwnerName,
				groups: groups,
				location: event.LocationName,
				room: event.RoomName,
				color: color
			};

			parsedEvents.push(parsedEvent);
		}

		return parsedEvents;
	}

	populateGroupSemesterMap = (): Promise<null> => {
		return new Promise((resolve, reject) => {
			request.get('/api/groups').end((error: {}, res: any) => {
				if (res && res.body) {
					let groups: string[] = [];
					res.body.forEach((group: any) => {
						groups.push(group.GroupName);
						this.groupSemesterMap.set(group.GroupName, group.Semester);
					});
					resolve();
				} else
					reject();
			});
		});
	}

	// Modal ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	openViewEventModal = (event: Event) => {
		if (this.viewEventModal)
			this.viewEventModal.beginView(event);
	}

	// Store Calendar State /////////////////////////////////////////////////////////////////////////////////////////////////////////
	cacheViewAndDate(view: any) {
		this.currentView = view.name;
		if (!this.currentDate)
			this.currentDate = view.intervalStart;
		if (this.currentDate.isBefore(view.intervalStart) || this.currentDate.isAfter(view.intervalEnd.subtract(1, 'minutes'))) {
			this.currentDate = view.intervalStart;
			this.smallestTimeInterval = view.intervalEnd - view.intervalStart;
		}
	}

	// Preferences /////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	handleEventSizeIncrease = () => {
		if (this.state.eventSize < 19 * 15)
			this.setState(prevState => ({ eventSize: prevState.eventSize + 19 }));
	}

	handleEventSizeDecrease = () => {
		if (this.state.eventSize > 19)
			this.setState(prevState => ({ eventSize: prevState.eventSize - 19 }));
	}

	handleDisplayChange = (event: any) => {
		let value = event.target.value;
		if (value === 'class' || value === 'title' || value === 'classAndRoom' || value === 'titleAndRoom')
			this.setState({ eventDisplay: value });
	}

	// Event Rendering ////////////////////////////////////////////////////////////////////////////////////////////////
	renderEvent = (event: any, element: any, view: any) => {
		let groups = event.groups;
		let semesterCount = 0;
		let semesterFromMap: any = 0;
		if (groups && groups.length === 1) {
			semesterFromMap = this.groupSemesterMap.get(groups[0]);
			if (semesterFromMap)
				semesterCount = semesterFromMap;
		}

		let stripeColor = '(255, 255, 255, 0.1)';
		if (this.currentView === 'month')
			stripeColor = '(255, 255, 255, 0.2)';

		let semesterCSSMap: {} = {
			0: '',
			1: 'repeating-linear-gradient(-45deg,transparent,transparent 64px,rgba' + stripeColor +
				' 64px,rgba' + stripeColor + ' 66px)',
			2: 'repeating-linear-gradient(-45deg,transparent,transparent 32px,rgba' + stripeColor +
				' 32px,rgba' + stripeColor + ' 34px)',
			3: 'repeating-linear-gradient(-45deg,transparent,transparent 16px,rgba' + stripeColor +
				' 16px,rgba' + stripeColor + ' 18px)',
			4: 'repeating-linear-gradient(-45deg,transparent,transparent 8px,rgba' + stripeColor +
				' 8px,rgba' + stripeColor + ' 10px)',
			5: 'repeating-linear-gradient(-45deg,transparent,transparent 4px,rgba' + stripeColor +
				' 4px,rgba' + stripeColor + ' 6px)'
		};
		let bgCSS = semesterCSSMap[semesterCount];

		element.css('background', bgCSS);
		element.css('background-color', event.color);
		element.find('.fc-content').css('text-shadow', '-1px -1px 0 ' + event.color +
			', 1px -1px 0 ' + event.color + ', -1px 1px 0 ' + event.color + ', 1px 1px 0 ' + event.color);
		let content = element.find('.fc-content');
		if (!this.state.collapseEvents && this.currentView === 'month' && this.state.eventSize > 28) {
			// element.css('min-height', this.state.eventSize + 'px');
			element.css('height', this.state.eventSize + 'px');
			// element.css('max-height', '100%');
			content.css('white-space', 'normal');
			element.css('overflow', 'hidden');
		} else if (this.currentView === 'month') {
			// content.css('white-space', 'nowrap');
			// content.css('overflow', 'hidden');
			// content.css('text-overflow', 'ellipsis');
		}

		let groupString = 'no class';
		let title = element.find('.fc-title');
		let time = element.find('.fc-time');
		time.text(time.text().replace(' - ', '-'));
		if (event.groups.length > 0)
			groupString = event.groups.join(', ');

		if (this.state.eventDisplay === 'class' || this.state.eventDisplay === 'classAndRoom')
			title.text(groupString);

		if (this.state.eventDisplay === 'classAndRoom' || this.state.eventDisplay === 'titleAndRoom')
			time.text(time.text() + ', ' + event.room);
	}
}

export default ViewingCalendar;