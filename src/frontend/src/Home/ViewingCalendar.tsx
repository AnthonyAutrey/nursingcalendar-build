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
	private collapseEvents: boolean = false;

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = { events: [], loading: false };
	}

	componentWillMount() {
		this.getEventsFromDB();
		this.props.handleActiveRouteChange('Home');
	}

	render() {
		let loading = null;
		if (this.state.loading)
			loading = <Loading />;

		return (
			<div className="ViewingCalendar">
				{loading}
				<ViewEventModal ref={viewEventModal => { this.viewEventModal = viewEventModal; }} />
				<FullCalendarReact
					id="calendar"
					customButtons={{
						expand: {
							text: this.collapseEvents ? 'Expand All' : 'Collapse All',
							click: () => {
								this.collapseEvents = !this.collapseEvents;
								this.forceUpdate();
							}
						}
					}}
					header={{
						left: 'prev,next today expand',
						center: 'title',
						right: 'month,agendaWeek,agendaDay'
					}}
					// defaultDate={(() => {
					// 	if (this.currentDate)
					// 		return this.currentDate;
					// 	else
					// 		return null;
					// })()}
					// defaultView={(() => {
					// 	if (this.currentView)
					// 		return this.currentView;
					// 	else
					// 		return 'agendaWeek';
					// })()}
					editable={false}
					slotEventOverlap={false}
					allDaySlot={false}
					eventOverlap={true}
					eventLimit={this.collapseEvents} // allow "more" link when too many events
					eventClick={this.openViewEventModal}
					// dayClick={(date: any) => {
					// 	if (this.currentView === 'month') {
					// 		this.currentDate = date;
					// 		this.currentView = 'agendaWeek';
					// 		this.forceUpdate();
					// 	}
					// }}
					events={this.state.events}
					eventTextColor="white"
					// eventDrop={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					// eventResize={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					height={'auto'}
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
					// viewRender={(view: any) => this.cacheViewAndDate(view)}
					firstDay={1}
				// select={this.handleCalendarSelect}
				/>
			</div>
		);
	}

	public getEventsFromDB(): void {
		if (this.props.role === 'student' || this.props.role === 'instructor')
			this.getUserFilteredEvents();
		else {
			this.setState({ loading: true });
			request.get('/api/eventswithrelations').end((error: {}, res: any) => {
				if (res && res.body)
					this.setState({ events: this.parseDBEvents(res.body), loading: false });
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
			let color: string = ColorGenerator.getColor(event.Groups[0]);
			// let borderColor = '';

			let parsedEvent: any = {
				id: event.EventID,
				title: event.Title,
				description: event.Description,
				start: event.StartTime,
				end: event.EndTime,
				ownerName: event.OwnerName,
				groups: event.Groups,
				location: event.LocationName,
				room: event.RoomName,
				color: color
				// borderColor: borderColor
			};

			parsedEvents.push(parsedEvent);
		}

		return parsedEvents;
	}

	openViewEventModal = (event: Event) => {
		if (this.viewEventModal)
			this.viewEventModal.beginView(event);
	}
}

export default ViewingCalendar;