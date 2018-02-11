import * as React from 'react';
import { CSSProperties } from 'react';
import * as ReactDOM from 'react-dom';
import { CreateEventModal } from './CreateEventModal';
import { EditEventModal } from './EditEventModal';

import { Duration, Moment } from 'moment';
import * as moment from 'moment';
const FullCalendarReact = require('fullcalendar-reactwrapper');
// const fullcalendarCSS = require('../../node_modules/fullcalendar-reactwrapper/dist/css/fullcalendar.min.css');
const request = require('superagent');

interface Props {
	location: string;
	room: string;
	cwid: number;
}

interface State {
	events: Map<number, Event>;
	showCreateModal: boolean;
}

interface Event {
	id: number;
	title: string;
	description: string;
	start: string;
	end?: string;
	cwid: number;
}

export class SchedulerCalendar extends React.Component<Props, State> {

	private scrollPosition: number = 0;
	private currentView: String | null = null;
	private currentDate: any | null = null;
	private smallestTimeInterval: number = Number.MAX_SAFE_INTEGER;
	private editEventModal: EditEventModal | null;

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = { events: new Map<number, Event>(), showCreateModal: false };
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
				<EditEventModal
					ref={editEventModal => { this.editEventModal = editEventModal; }}
					saveHandler={this.handleEventModify}
					deleteHandler={this.handleEventDeletion}
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
					// 	let events = this.cloneStateEvents();
					// 	let event = events[draggedEvent.id];
					// 	let allowEdit = Number(event.cwid) === Number(this.props.cwid);
					// 	return Number(event.cwid) === Number(this.props.cwid);
					// }}
					eventLimit={true} // allow "more" link when too many events
					eventLimitClick={'day'}
					eventClick={this.handleEventClick}
					events={this.getStateEventsAsArray()}
					eventTextColor="white"
					eventDrop={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					eventResize={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					// eventAfterRender={(event: any, element: any) => {
					// 	console.log(event.start);
					// 	// console.log(element.start);
					// }}
					height={'auto'}
					selectMinDistance={10}
					snapDuration={'00:15:00'}
					slotDuration={'00:30:00'}
					scrollTime={'6:00:00'}
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

	// Event Modals //////////////////////////////////////////////////////////////////////////////////
	createNewEvent = (start: moment.Moment, end: Moment, jsEvent: any, view: any) => {
		// Don't allow events to be less than x minutes
		if (moment.duration(end.diff(start)).asMinutes() < 30)
			end = start.clone().add({ minutes: 30 });

		// create a placeholder event for when modal is displayed
		// closing modal will remove this placeholder
		let events = this.cloneStateEvents();
		events.set(Number.MAX_SAFE_INTEGER, {
			id: Number.MAX_SAFE_INTEGER,
			title: 'New Event',
			description: 'modal placeholder',
			start: start.toISOString(),
			end: end.toISOString(),
			cwid: 0
		});
		this.setState({ events: events, showCreateModal: true });
	}

	handleEventCreation = (title: string, description: string) => {
		let events: Map<number, Event> = this.cloneStateEvents();
		let index = this.getNextEventIndex();
		let placeholder = events.get(Number.MAX_SAFE_INTEGER);
		if (placeholder)
			events.set(index, {
				id: index,
				title: title,
				description: description,
				start: placeholder.start,
				end: placeholder.end,
				cwid: this.props.cwid
			});

		this.setState({ events: events }, () => this.closeEventCreationModal());
	}

	closeEventCreationModal = () => {
		this.setState({ showCreateModal: false });
		let events = this.cloneStateEvents();
		let placeholder = events.get(Number.MAX_SAFE_INTEGER);
		if (placeholder && Number(placeholder.id) === Number.MAX_SAFE_INTEGER &&
			placeholder.description === 'modal placeholder') {
			events.delete(Number.MAX_SAFE_INTEGER);
			this.setState({ events: events });
		}
	}

	handleEventModify = (eventID: number, title: string, description: string) => {
		let events = this.cloneStateEvents();
		let eventToModify = events.get(eventID);
		if (eventToModify) {
			eventToModify.title = title;
			eventToModify.description = description;
			events.set(eventID, eventToModify);
			this.setState({ events: events });
		}
	}

	handleEventDeletion = (eventID: number) => {
		let events = this.cloneStateEvents();
		events.delete(eventID);
		this.setState({ events: events });
	}

	handleEventClick = (event: any, jsEvent: any, view: any) => {
		let events = this.cloneStateEvents();
		let clickedEvent = events.get(event.id);
		if (clickedEvent && Number(clickedEvent.cwid) === Number(this.props.cwid))
			this.openEditEventModal(clickedEvent.id, clickedEvent.title, clickedEvent.description);
		else
			console.log('DIFFERENT CWID, OPEN The viewer');
	}

	openEditEventModal = (eventID: number, title: string, description: string) => {
		if (this.editEventModal)
			this.editEventModal.beginEdit(eventID, title, description);
	}

	// Client Events //////////////////////////////////////////////////////////////////////////////////////////////
	getStateFromDB(): void {
		let queryData: {} = {
			where: {
				RoomName: this.props.room,
				LocationName: this.props.location
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

	cloneStateEvents = (): Map<number, Event> => {
		let events: Map<number, Event> = new Map<number, Event>();
		Array.from(this.state.events.keys()).forEach(key => {
			let event = this.state.events.get(key);
			if (event)
				events.set(key, event);
		});

		return events;
	}

	getNextEventIndex = () => {
		let index: number = 0;
		Array.from(this.state.events.keys()).forEach(key => {
			key = Number(key);
			if (key >= index && key !== Number.MAX_SAFE_INTEGER)
				index = key + 1;
		});

		return index;
	}

	editEvent(event: Event, delta: Duration): void {
		// prevent event from being edited to less than 30 minutes in duration
		let start: Moment = moment(event.start);
		let end: Moment = moment(event.end);
		if (moment.duration(end.diff(start)).asMinutes() < 30)
			end = start.clone().add({ minutes: 30 });

		let editedEvent: Event = event;
		editedEvent.id = event.id;
		editedEvent.title = event.title;
		editedEvent.start = start.toISOString();
		editedEvent.end = end.toISOString();
		let index: number | string = event.id;
		let events = this.cloneStateEvents();

		events.set(index, editedEvent);
		this.setState({ events: events });
	}

	getStateEventsAsArray(): Event[] {
		return Array.from(this.state.events.values());
	}

	parseDBEventsAsMap(body: any): Map<number, Event> {
		let parsedEvents: Map<number, Event> = new Map();
		for (let event of body) {
			let userOwnsEvent: boolean = Number(event.CWID) === Number(this.props.cwid);
			let acolor = '';
			let color = '';

			if (!userOwnsEvent) {
				color = 'rgba(255,255,255,.4)';
				acolor = 'rgba(0,123,255,.7)';
			}

			let parsedEvent: any = {
				id: event.EventID,
				title: event.Title,
				description: event.Description,
				start: event.StartTime,
				end: event.EndTime,
				cwid: event.CWID,
				color: acolor,
				borderColor: color,
				editable: userOwnsEvent
			};

			parsedEvents.set(event.EventID, parsedEvent);
		}

		return parsedEvents;
	}

	// Event Persistence /////////////////////////////////////////////////////////////////////////////////////////////////
	persistStateToDB(): void {
		this.deleteDBEventsNotInClient();
		this.getClientEventIDsThatAreAlreadyInDB().then((eventIDsInDB) => {
			this.persistExistingEventsToDB(eventIDsInDB).then(() => {
				let eventsNotInDB = this.getClientEventsNotYetInDB(eventIDsInDB);
				this.persistNewEventsToDB(eventsNotInDB);
			});
		});
	}

	getClientEventIDsThatAreAlreadyInDB(): Promise<number[]> {
		return new Promise((resolve, reject) => {
			let ids: number[] = Array.from(this.state.events.keys());
			console.log('CLIENT IDS');
			console.log(ids);

			let queryData = {
				fields: ['EventID'], where: {
					EventID: ids,
					LocationName: this.props.location,
					RoomName: this.props.room
				}
			};
			let queryDataString = JSON.stringify(queryData);
			let stateEventsThatAreAlreadyInDB: number[] = [];
			request.get('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body) {
					console.log('GET EVENTS ALREADY IN DB....................');
					console.log(JSON.stringify(res.body));
					resolve(this.getEventIdsFromResponseBody(res.body));
				} else
					reject();
			});
		});
	}

	deleteDBEventsNotInClient() {
		new Promise(resolve => {
			let queryData = {
				fields: 'EventID', where: {
					LocationName: this.props.location,
					RoomName: this.props.room
				}
			};
			let queryDataString = JSON.stringify(queryData);
			request.get('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve(res.body.map((event: any) => { return Number(event.EventID); }));
			});
		}).then((allDBEventIDsForRoom: number[]) => {
			let clientEventIDs: number[] = Array.from(this.state.events.keys()).map(id => { return Number(id); });
			let eventsIDsToDelete: number[] = [];

			console.log('all for room.....');
			console.log(allDBEventIDsForRoom);
			allDBEventIDsForRoom.forEach(id => {
				if (!clientEventIDs.includes(id))
					eventsIDsToDelete.push(Number(id));
			});

			console.log('DELETING EVENTS...................');
			console.log(eventsIDsToDelete);

			if (eventsIDsToDelete.length > 0) {
				let queryData = {
					where: {
						EventID: eventsIDsToDelete,
						CWID: Number(this.props.cwid),
						RoomName: this.props.room,
						LocationName: this.props.location
					}
				};
				let queryDataString = JSON.stringify(queryData);
				request.delete('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body)
						console.log('deleted events, rows affected: ' + res.body);
				});
			}
		});
	}

	persistExistingEventsToDB(eventIDsInDB: number[]): Promise<void> {
		return new Promise((resolve, reject) => {
			console.log('PERSIST EXISTING......');
			console.log(this.state.events);

			let eventsToUpdate: Event[] = [];
			eventIDsInDB.forEach((id) => {
				let eventToUpdate = this.state.events.get(id);
				console.log(eventToUpdate);
				if (eventToUpdate && Number(eventToUpdate.cwid) === Number(this.props.cwid))
					eventsToUpdate.push(eventToUpdate);
				else
					console.log('not in client or not matching cwid');
			});

			eventsToUpdate.forEach((event: Event) => {
				let queryData = {
					setValues: {
						'title': event.title,
						'description': event.description,
						'starttime': event.start,
						'endtime': event.end
					},
					where: { EventID: event.id, RoomName: this.props.room, LocationName: this.props.location }
				};
				let queryDataString = JSON.stringify(queryData);
				request.post('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body) {
						console.log('updated id: ' + event.id + ', ' + event.title + ', ' + event.description);
					} else {
						console.log('OUCH!!!!');
						console.log('failed update,  id: ' + event.id + ', ' + event.title + ', ' + event.description);
						reject();
					}
				});
			});

			resolve();
		});
	}

	getClientEventsNotYetInDB(alreadyInDB: number[]): Event[] {
		console.log('GET STATE EVENTS NOT YET IN DB..................');
		let clientEventsNotInDBMap: Map<number, Event> = this.cloneStateEvents();
		alreadyInDB.forEach((id) => {
			clientEventsNotInDBMap.delete(id);
		});

		console.log(Array.from(clientEventsNotInDBMap.keys()));
		let clientEventsNotYetInDB: Event[] = Array.from(clientEventsNotInDBMap.values());
		return clientEventsNotYetInDB;
	}

	persistNewEventsToDB(events: Event[]) {
		let eventsToCreate: Event[] = [];
		console.log('PERSISTING NEW EVENTS........');
		console.log(events);
		events.forEach(event => {
			eventsToCreate.push(event);
		});

		eventsToCreate.forEach((event) => {
			console.log('persisting new event:');
			console.log(event);
			let queryData = {
				insertValues: {
					'cwid': this.props.cwid,
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