import * as React from 'react';
import { CSSProperties } from 'react';
import * as ReactDOM from 'react-dom';
import { CreateEventModal } from './CreateEventModal';

import { Duration, Moment } from 'moment';
const FullCalendarReact = require('fullcalendar-reactwrapper');
// const fullcalendarCSS = require('../../node_modules/fullcalendar-reactwrapper/dist/css/fullcalendar.min.css');
const request = require('superagent');

interface Props {
	location: string;
	room: string;
}

interface State {
	events: { number: Event } | {};
	showCreateModal: boolean;
}

interface Event {
	id: string;
	title: string;
	description: string;
	start: string;
	end?: string;
}

export class SchedulerCalendar extends React.Component<Props, State> {

	private scrollPosition: number = 0;
	private currentView: String | null = null;
	private currentDate: any | null = null;
	private smallestTimeInterval: number = Number.MAX_SAFE_INTEGER;

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = { events: {}, showCreateModal: false };
	}

	componentWillMount() {
		this.getStateFromDB();
	}

	componentWillUpdate() {
		const element = ReactDOM.findDOMNode(this);
		if (element != null)
			this.scrollPosition = window.scrollY;
	}

	componentDidUpdate() {
		const element = ReactDOM.findDOMNode(this);
		if (element != null)
			window.scrollTo(0, this.scrollPosition);
	}

	render() {
		return (
			<div className="SchedulerCalendar">
				<CreateEventModal
					show={this.state.showCreateModal}
					creationHandler={this.handleEventCreation}
					closeHandler={this.closeEventCreationModal}
				/>
				<FullCalendarReact
					id="calendar"
					header={{
						left: 'prev, next, today',
						center: 'title',
						right: 'agendaWeek,month,agendaDay,listMonth,listDay,basicWeek'
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
							return 'agendaWeek';
					})()}
					navLinks={true} // can click day/week names to navigate views
					editable={true}
					slotEventOverlap={false}
					eventOverlap={false}
					// eventAllow={(dropInfo: any, draggedEvent: any) => {
					// 	console.log(JSON.stringify(dropInfo));
					// 	return draggedEvent.title === 'Clinicals';
					// }}
					// eventLimit={true} // allow "more" link when too many events
					// eventLimitClick={'day'}
					events={this.getStateEventsAsArray()}
					eventTextColor="white"
					eventDrop={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					eventResize={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					// eventAfterRender={(event: any, element: any) => {
					// 	console.log(event.start);
					// 	// console.log(element.start);
					// }}
					height={'auto'}
					snapDuration={'00:15:00'}
					slotDuration={'00:30:00'}
					// scrollTime={'24:00:00'}
					// minTime={'03:00:00'}
					// maxTime={'27:00:00'}
					selectable={true}
					selectOverlap={false}
					selectHelper={true}
					viewRender={(view: any) => this.cacheViewAndDate(view)}
					firstDay={1}
					select={this.createNewEvent}
				/>
			</div>
		);
	}

	// Event Creation //////////////////////////////////////////////////////////////////////////////////
	createNewEvent = (start: any, end: any, jsEvent: any, view: any) => {
		// create a placeholder event for when modal is displayed
		// closing modal will remove this placeholder
		let events = this.cloneStateEvents();
		events.unshift({ id: 'modal placeholder', title: '', description: '', start: start, end: end });
		console.log(events);
		this.setState({ events: events, showCreateModal: true });
	}

	handleEventCreation = (title: string, description: string) => {
		let events = this.cloneStateEvents();
		events.push({ id: '' + (events.length - 1), title: title, description: description, start: events[0].start, end: events[0].end });
		this.setState({ events: events }, () => this.closeEventCreationModal());
	}

	closeEventCreationModal = () => {
		this.setState({ showCreateModal: false });
		let events = this.cloneStateEvents();
		console.log(events);
		if (events[0].id === 'modal placeholder') {
			events.splice(0, 1);
			this.setState({ events: events });
		}
	}

	// Client Events
	getStateFromDB(): void {
		let queryData: {} = {
			where: {
				RoomName: ['"' + this.props.room + '"'],
				LocationName: ['"' + this.props.location + '"']
			}
		};
		let queryDataString = JSON.stringify(queryData);
		request.get('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body) {
				this.setState({ events: this.parseDBEventsAsMap(res.body) });
				console.log(res.body);
			}
		});
	}

	cloneStateEvents(): Event[] {
		let events: Event[] = [];
		for (const key in this.state.events) {
			if (this.state.events.hasOwnProperty(key))
				events.push(this.state.events[key]);
		}

		return events;
	}

	editEvent(event: Event, delta: Duration): void {
		let newEvent: Event = event;
		newEvent.id = event.id;
		newEvent.title = event.title;
		newEvent.start = event.start;
		newEvent.end = event.end;
		let index: number | string = event.id;
		let events = this.state.events;
		events[index] = newEvent;

		this.setState({ events: events });
	}

	getStateEventsAsArray(): Event[] {
		let events: Event[] = [];
		for (const key in this.state.events) {
			if (this.state.events.hasOwnProperty(key)) {
				let event = this.state.events[key];
				events.push(event);
			}
		}

		return events;
	}

	parseDBEventsAsMap(body: any): { number: Event } | {} {
		let parsedEvents: { number: Event } | {} = {};
		for (let event of body) {

			let parsedEvent: Event = {
				id: event.EventID,
				title: event.Title,
				description: event.Description,
				start: event.StartTime,
				end: event.EndTime,
			};

			parsedEvents[event.EventID] = (parsedEvent);
		}

		return parsedEvents;
	}

	// Event Persistence /////////////////////////////////////////////////////////////////////////////////////////////////
	persistStateToDB(): void {
		this.getStateEventsThatAreAlreadyInDB().then((eventsInDB) => {
			this.persistExistingEventsToDB(eventsInDB).then(() => {
				let eventsNotInDB = this.getStateEventsNotYetInDB(eventsInDB);
				this.persistNewEventsToDB(eventsNotInDB);
			});
		});
	}

	persistExistingEventsToDB(eventIDs: number[]): Promise<void> {
		return new Promise((resolve, reject) => {
			let eventsToUpdate: Event[] = [];
			eventIDs.forEach((id) => {
				eventsToUpdate.push(this.state.events[id]);
			});

			eventsToUpdate.forEach((event: Event) => {
				let queryData = {
					setValues: {
						'title': event.title,
						'description': event.description,
						'starttime': event.start,
						'endtime': event.end
					},
					where: { EventID: [event.id], RoomName: ['"' + this.props.room + '"'], LocationName: ['"' + this.props.location + '"'] }
				};
				let queryDataString = JSON.stringify(queryData);
				request.post('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body) {
						console.log('updated: ' + res.body);
					} else
						reject();
				});
			});

			resolve();
		});
	}

	persistNewEventsToDB(events: { number: Event } | {}) {
		let eventsToCreate: Event[] = [];
		for (const key in events) {
			if (events.hasOwnProperty(key))
				eventsToCreate.push(events[key]);
		}

		eventsToCreate.forEach((event) => {
			console.log('creating event:');
			console.log(event);
			let queryData = {
				insertValues: {
					'eventID': event.id,
					'locationName': this.props.location,
					'roomName': this.props.room,
					'title': event.title,
					'description': event.description,
					'starttime': event.start,
					'endtime': event.end
				}
			};
			let queryDataString = JSON.stringify(queryData);
			request.put('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					console.log('created: ' + res.body);
			});
		});
	}

	getStateEventsNotYetInDB(alreadyInDB: number[]): { number: Event } | {} {
		let stateEventsNotYetInDB: { number: Event } | {} = this.cloneStateEvents();

		console.log('state: ');
		console.log(stateEventsNotYetInDB);
		console.log('already there: ');
		console.log(alreadyInDB);
		alreadyInDB.forEach((id) => {
			console.log('deleting: ' + id);
			delete stateEventsNotYetInDB[id];
		});

		return stateEventsNotYetInDB;
	}

	getStateEventsThatAreAlreadyInDB(): Promise<number[]> {
		return new Promise((resolve, reject) => {
			let ids: number[] = [];
			for (const key in this.state.events)
				if (this.state.events.hasOwnProperty(key))
					ids.push(parseInt(key, 10));

			console.log('state: ');
			console.log(this.state.events);
			console.log('supposed to be all keys:');
			console.log(ids);
			let queryData = {
				fields: ['EventID'], where: {
					EventID: ids,
					LocationName: ['"' + this.props.location + '"'],
					RoomName: ['"' + this.props.room + '"']
				}
			};
			let queryDataString = JSON.stringify(queryData);
			let stateEventsThatAreAlreadyInDB: number[] = [];
			request.get('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve(this.getEventIdsFromResponseBody(res.body));
				else
					reject();
			});
		});
	}

	getEventIdsFromResponseBody(body: any): number[] {
		let ids: number[] = [];

		for (let event of body)
			ids.push(event.EventID);

		return ids;
	}

	// Store Calendar State /////////////////////////////////////////////////////////////////////////////////////////////////////////
	cacheViewAndDate(view: any) {
		this.currentView = view.name;
		if (!this.currentDate)
			this.currentDate = view.intervalStart;
		if (this.currentDate.isBefore(view.intervalStart) || this.currentDate.isAfter(view.intervalEnd)) {
			this.currentDate = view.intervalStart;
			this.smallestTimeInterval = view.intervalEnd - view.intervalStart;
		}
	}
}

export default SchedulerCalendar;