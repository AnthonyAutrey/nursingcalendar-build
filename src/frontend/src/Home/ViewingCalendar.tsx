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
	menu: 'none' | 'preferences' | 'filters';
	eventSize: number;
	collapseEvents: boolean;
	eventDisplay: 'title' | 'class' | 'classAndRoom' | 'titleAndRoom';
	titleFilter: string;
	groupFilter: string;
	ownerFilter: string;
	roomFilter: string;
	locationFilter: string;
	showFilterHelp: boolean;
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
			menu: 'none',
			eventSize: 19,
			collapseEvents: false,
			eventDisplay: 'title',
			titleFilter: '',
			ownerFilter: '',
			groupFilter: '',
			roomFilter: '',
			locationFilter: '',
			showFilterHelp: false
		};
	}

	componentWillMount() {
		this.getEventsAndGroupsFromDB();
		this.props.handleActiveRouteChange('Home');
		this.getPreferencesFromDB();
	}

	render() {
		let loading = null;
		if (this.state.loading)
			loading = <Loading />;

		let preferences = null;
		if (this.state.menu === 'preferences')
			preferences = this.getPreferencesElement();
		let filters = null;
		if (this.state.menu === 'filters')
			filters = this.getFiltersElement();

		return (
			<div className="ViewingCalendar">
				{loading}
				{preferences}
				{filters}
				<ViewEventModal ref={viewEventModal => { this.viewEventModal = viewEventModal; }} />
				<FullCalendarReact
					id="calendar"
					customButtons={{
						preferences: {
							text: this.state.menu !== 'preferences' ? 'Preferences' : 'Hide Preferences',
							click: () => {
								this.setState((prevState) => ({
									menu: prevState.menu === 'preferences' ? 'none' : 'preferences'
								}));
							}
						},
						filters: {
							text: this.state.menu !== 'filters' ? 'Filters' : 'Hide Filters',
							click: () => {
								this.setState((prevState) => ({
									menu: prevState.menu === 'filters' ? 'none' : 'filters'
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
						left: 'prev,next today filters preferences',
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
					height={700}
					snapDuration={'00:15:00'}
					slotDuration={'00:30:00'}
					scrollTime={'6:00:00'}
					minTime={'06:00:00'}
					maxTime={'30:00:00'}
					selectOverlap={false}
					selectHelper={true}
					viewRender={(view: any) => this.cacheViewAndDate(view)}
					firstDay={1}
				/>
			</div>
		);
	}

	// Data Retreival /////////////////////////////////////////////////////////////////////////////////////////////////
	public getEventsAndGroupsFromDB(): void {
		if (this.props.role === 'student' || this.props.role === 'instructor')
			this.populateGroupSemesterMap().then(() => {
				this.getUserFilteredEvents();
			}).catch(() => {
				alert('Error getting data!, Handle properly!');
				// TODO: handle this properly
			});
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
			alert('error, couldn\'t get events!');
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
			request.get('/api/semestergroups').end((error: {}, res: any) => {
				if (res && res.body) {
					res.body.forEach((result: any) => {
						this.groupSemesterMap.set(result.GroupName, result.Semester);
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
	getPreferencesFromDB = () => {
		let queryData: {} = {
			where: {
				CWID: this.props.cwid
			}
		};
		let queryDataString: string = JSON.stringify(queryData);
		request.get('/api/preferences/' + this.props.cwid).set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body)
				if (res.body.length > 0)
					this.setState({
						collapseEvents: res.body[0].CollapseEvents === 1 ? true : false,
						eventDisplay: res.body[0].EventDisplay,
						eventSize: res.body[0].EventSize
					});
				else {
					// Didn't find preferences in DB for user, so create a default one
					let putQueryData = JSON.stringify({
						insertValues: {
							CWID: this.props.cwid
						}
					});
					request.put('/api/preferences').set('queryData', putQueryData).end((putError: {}, putRes: any) => {
						if (!putRes || !putRes.body)
							alert('Error Submitting, handle this!');
						// TODO: handle this error properly
					});
				}
			else
				alert('Error getting prefs data, handle this!');
			// TODO: handle this error properly
		});
	}

	handleEventSizeIncrease = () => {
		if (this.state.eventSize < 19 * 15)
			this.setState(prevState => ({ eventSize: prevState.eventSize + 19 }), () => {
				this.persistEventSize(this.state.eventSize);
			});
	}

	handleEventSizeDecrease = () => {
		if (this.state.eventSize > 19)
			this.setState(prevState => ({ eventSize: prevState.eventSize - 19 }), () => {
				this.persistEventSize(this.state.eventSize);
			});
	}

	persistEventSize = (size: Number) => {
		let queryData = JSON.stringify({
			setValues: {
				EventSize: size
			}
		});

		request.post('/api/preferences/' + this.props.cwid).set('queryData', queryData).end((putError: {}, res: any) => {
			if (!res || !res.body)
				alert('Error Submitting, handle this!');
			// TODO: handle this error properly
		});
	}

	handleDisplayChange = (event: any) => {
		let value = event.target.value;
		if (value === 'class' || value === 'title' || value === 'classAndRoom' || value === 'titleAndRoom')
			this.setState({ eventDisplay: value }, () => {
				this.persistDisplayChange(value);
			});
	}

	persistDisplayChange = (displayValue: string) => {
		let queryData = JSON.stringify({
			setValues: {
				EventDisplay: displayValue
			}
		});

		request.post('/api/preferences/' + this.props.cwid).set('queryData', queryData).end((putError: {}, res: any) => {
			if (!res || !res.body)
				alert('Error Submitting, handle this!');
			// TODO: handle this error properly
		});
	}

	handleCollapseChange = () => {
		this.setState((prevState) => ({ collapseEvents: !prevState.collapseEvents }), () => {
			this.persistCollapseChange(this.state.collapseEvents);
		});
	}

	persistCollapseChange = (collapseEvents: boolean) => {
		let collapseValue = 0;
		if (collapseEvents)
			collapseValue = 1;
		let queryData = JSON.stringify({
			setValues: {
				CollapseEvents: collapseValue
			}
		});

		request.post('/api/preferences/' + this.props.cwid).set('queryData', queryData).end((putError: {}, res: any) => {
			if (!res || !res.body)
				alert('Error Submitting, handle this!');
			// TODO: handle this error properly
		});
	}

	getPreferencesElement = (): JSX.Element => {
		return (
			<div className="container-fluid d-print-none">
				<div className="d-flex">
					<div className="form-inline mr-3 mt-1">
						<label className="form-label mr-2">Collapse Events:</label>
						<button
							className="btn btn-primary btn-sm"
							onClick={this.handleCollapseChange}
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
								disabled={this.state.collapseEvents}
							>
								Larger &nbsp;
								<span className="oi oi-caret-top" />
							</button>
							<button
								className="btn btn-primary btn-sm"
								onClick={this.handleEventSizeDecrease}
								disabled={this.state.collapseEvents}
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
				</div>
				<hr />
			</div>
		);
	}

	// Filters ////////////////////////////////////////////////////////////////////////////////////////////////////////
	handleChangeTitleFilter = (event: any) => {
		this.setState({ titleFilter: event.target.value });
	}

	handleChangeOwnerFilter = (event: any) => {
		this.setState({ ownerFilter: event.target.value });
	}

	handleChangeGroupFilter = (event: any) => {
		this.setState({ groupFilter: event.target.value });
	}

	handleChangeRoomFilter = (event: any) => {
		this.setState({ roomFilter: event.target.value });
	}

	handleChangeLocationFilter = (event: any) => {
		this.setState({ locationFilter: event.target.value });
	}

	handleClearFilters = () => {
		this.setState({ titleFilter: '', ownerFilter: '', groupFilter: '', roomFilter: '', locationFilter: '' });
	}

	getFiltersElement = () => {
		return (
			<div className="container-fluid d-print-none">
				{this.state.showFilterHelp &&
					(
						<div className="mb-3">
							<strong>
								Enter values to match events you want to see in the calendar.
							</strong>
							<br />
							For groups and rooms, you may enter multiple values separated by spaces or commas.
							<br />
							Groups will match only if the event has every group listed. Rooms will match for any of the rooms listed.
						</div>
					)
				}
				<div className="row">
					<div className="form-inline col-lg-2 my-1">
						<label className="form-label col-sm-2 col-lg-4 pl-0">Title:</label>
						<input
							className="form-control form-control-sm col-sm-10 col-lg-8"
							type="text"
							value={this.state.titleFilter}
							onChange={this.handleChangeTitleFilter}
						/>
					</div>
					<div className="form-inline col-lg-2 my-1">
						<label className="form-label col-sm-2 col-lg-4 pl-0">Creator:</label>
						<input
							className="form-control form-control-sm col-sm-10 col-lg-8"
							type="text"
							value={this.state.ownerFilter}
							onChange={this.handleChangeOwnerFilter}
						/>
					</div>
					<div className="form-inline col-lg-2 my-1">
						<label className="form-label col-sm-2 col-lg-4 pl-0">Groups:</label>
						<input
							className="form-control form-control-sm col-sm-10 col-lg-8"
							type="text"
							value={this.state.groupFilter}
							onChange={this.handleChangeGroupFilter}
						/>
					</div>
					<div className="form-inline col-lg-2 my-1">
						<label className="form-label col-sm-2 col-lg-4 pl-0">Location:</label>
						<input
							className="form-control form-control-sm col-sm-10 col-lg-8"
							type="text"
							value={this.state.locationFilter}
							onChange={this.handleChangeLocationFilter}
						/>
					</div>
					<div className="form-inline col-lg-2 my-1">
						<label className="form-label col-sm-2 col-lg-4 pl-0">Rooms:</label>
						<input
							className="form-control form-control-sm col-sm-10 col-lg-8"
							type="text"
							value={this.state.roomFilter}
							onChange={this.handleChangeRoomFilter}
						/>
					</div>
					<div className="form-inline col-lg-2">
						<div className="d-flex ml-auto my-1">
							<button
								className="btn btn-primary btn-sm mr-3"
								onClick={this.handleClearFilters}
							>
								<span className="oi oi-delete" style={{ top: '2px' }} />
								&nbsp; Clear Filters
							</button>
							<button
								className="btn btn-primary btn-sm"
								onClick={() => this.setState({ showFilterHelp: !this.state.showFilterHelp })}
							>
								{!this.state.showFilterHelp ? 'Show Help' : 'Hide Help'}
							</button>
						</div>
					</div>
				</div>
				<hr />
			</div>
		);
	}

	// Event Rendering ////////////////////////////////////////////////////////////////////////////////////////////////
	renderEvent = (event: any, element: any, view: any) => {
		let groups = event.groups;
		let semester = 'none';
		let semesterFromMap: any = 0;
		if (groups && groups.length === 1) {
			semesterFromMap = this.groupSemesterMap.get(groups[0]);
			if (semesterFromMap)
				semester = semesterFromMap;
		}

		let stripeColor = '(255, 255, 255, 0.1)';
		if (this.currentView === 'month')
			stripeColor = '(255, 255, 255, 0.2)';

		let semesterCSSMap: {} = {
			'none': '',
			'Semester 1': 'repeating-linear-gradient(-45deg,transparent,transparent 64px,rgba' + stripeColor +
				' 64px,rgba' + stripeColor + ' 66px)',
			'Semester 2': 'repeating-linear-gradient(-45deg,transparent,transparent 32px,rgba' + stripeColor +
				' 32px,rgba' + stripeColor + ' 34px)',
			'Semester 3': 'repeating-linear-gradient(-45deg,transparent,transparent 16px,rgba' + stripeColor +
				' 16px,rgba' + stripeColor + ' 18px)',
			'Semester 4': 'repeating-linear-gradient(-45deg,transparent,transparent 8px,rgba' + stripeColor +
				' 8px,rgba' + stripeColor + ' 10px)',
			'Semester 5': 'repeating-linear-gradient(-45deg,transparent,transparent 4px,rgba' + stripeColor +
				' 4px,rgba' + stripeColor + ' 6px)'
		};
		let bgCSS = semesterCSSMap[semester];

		element.css('background', bgCSS);
		element.css('background-color', event.color);
		element.find('.fc-content').css('text-shadow', '-1px -1px 0 ' + event.color +
			', 1px -1px 0 ' + event.color + ', -1px 1px 0 ' + event.color + ', 1px 1px 0 ' + event.color);
		let content = element.find('.fc-content');
		if (!this.state.collapseEvents && this.currentView === 'month' && this.state.eventSize > 19) {
			element.css('height', this.state.eventSize + 'px');
			content.css('white-space', 'normal');
			element.css('overflow', 'hidden');
		}

		let groupString = '(none)';
		let title = element.find('.fc-title');
		let time = element.find('.fc-time');
		if (event.groups.length > 0)
			groupString = event.groups.join(', ');

		if (this.state.eventDisplay === 'class' || this.state.eventDisplay === 'classAndRoom')
			title.text(groupString);

		if (this.state.eventDisplay === 'classAndRoom' || this.state.eventDisplay === 'titleAndRoom')
			title.prepend('<strong> ' + event.room + ', </strong>');

		// Filter events
		let passedTitleFilter = event.title.toLowerCase().includes(this.state.titleFilter.toLowerCase().trim());
		let passedOwnerFilter = event.ownerName.toLowerCase().includes(this.state.ownerFilter.toLowerCase().trim());
		let passedLocationFilter = event.location.toLowerCase().includes(this.state.locationFilter.toLowerCase().trim());
		let passedGroupFilter = true;
		this.state.groupFilter.split(/(,|;|\s)/).forEach(filterFragment => {
			if (filterFragment !== ',' && filterFragment !== ';' && !event.groups.join(' ').toLowerCase().includes(filterFragment.toLowerCase())) {
				passedGroupFilter = false;
			}
		});
		let passedRoomFilter = false;
		this.state.roomFilter.split(/(,|;|\s)/).forEach(filterFragment => {
			if (filterFragment !== ',' &&
				filterFragment !== ';' &&
				filterFragment.trim() !== '' &&
				event.room.toLowerCase().includes(filterFragment.toLowerCase())) {
				passedRoomFilter = true;
			}
		});
		if (!(passedTitleFilter &&
			passedOwnerFilter &&
			passedGroupFilter &&
			passedLocationFilter &&
			(passedRoomFilter || this.state.roomFilter === '')))
			element.css('display', 'none');
	}
}

export default ViewingCalendar;