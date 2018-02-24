import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { CSSProperties } from 'react';
import { CreateEventModal } from './CreateEventModal';
import { EditEventModal } from './EditEventModal';
import { UnownedEventModal } from './UnownedEventModal';
import { Loading } from '../Generic/Loading';

import { Duration, Moment } from 'moment';
import * as moment from 'moment';
const FullCalendarReact = require('fullcalendar-reactwrapper');
const request = require('superagent');

interface Props {
	location: string;
	room: string;
	cwid: number;
	role: string;
	handleSendMessage: Function;
}

interface State {
	events: Map<number, Event>;
	showCreateModal: boolean;
	groupOptionsFromAPI: string[];
	loading: boolean;
}

export interface Event {
	id: number;
	title: string;
	description: string;
	start: string;
	end?: string;
	cwid: number;
	ownerName: string;
	groups: string[];
	pendingOverride: boolean;
}

export class SchedulerCalendar extends React.Component<Props, State> {

	private scrollPosition: number = 0;
	private currentView: String | null = null;
	private currentDate: any | null = null;
	private smallestTimeInterval: number = Number.MAX_SAFE_INTEGER;
	private editEventModal: EditEventModal | null;
	private unownedEventModal: UnownedEventModal | null;
	private eventCache: Map<number, Event>;

	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			events: new Map<number, Event>(),
			showCreateModal: false,
			groupOptionsFromAPI: [],
			loading: false
		};
	}

	componentWillMount() {
		this.getStateFromDB();
		request.get('/api/groups').end((error: {}, res: any) => {
			if (res && res.body) {
				let groups: string[] = [];
				res.body.forEach((group: any) => {
					groups.push(group.GroupName);
				});

				this.setState({ groupOptionsFromAPI: groups });
			}
		});
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

	componentWillReceiveProps(nextProps: Props) {
		if (nextProps.room !== this.props.room || nextProps.location !== this.props.location)
			this.getStateFromDB(nextProps.room, nextProps.location);
	}

	render() {
		let loading = null;
		if (this.state.loading)
			loading = <Loading />;

		return (
			<div className="SchedulerCalendar">
				{loading}
				<CreateEventModal
					show={this.state.showCreateModal}
					groupOptionsFromAPI={this.state.groupOptionsFromAPI}
					creationHandler={this.handleEventCreation}
					closeHandler={this.closeEventCreationModal}
				/>
				<EditEventModal
					ref={editEventModal => { this.editEventModal = editEventModal; }}
					groupOptionsFromAPI={this.state.groupOptionsFromAPI}
					saveHandler={this.handleEventModify}
					deleteHandler={this.handleEventDeletion}
				/>
				<UnownedEventModal
					ref={unownedEventModal => { this.unownedEventModal = unownedEventModal; }}
					cwid={this.props.cwid}
					handleOverrideRequest={this.handleOverrideRequest}
				/>
				<FullCalendarReact
					id="calendar"
					customButtons={{
						selectDate: {
							text: 'Month',
							click: () => {
								this.currentView = 'month';
								this.props.handleSendMessage('Select a date to schedule events for that week.', 'info');
								this.forceUpdate();
							}
						},
						roomLabel: {
							text: this.props.location + ' - ' + this.props.room
						}
					}}
					header={{
						left: 'roomLabel',
						center: 'title',
						right: 'prev,selectDate,next today'
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
					editable={true}
					slotEventOverlap={false}
					allDaySlot={false}
					eventOverlap={false}
					eventLimit={true} // allow "more" link when too many events
					eventClick={this.handleEventClick}
					dayClick={(date: any) => {
						if (this.currentView === 'month') {
							this.currentDate = date;
							this.currentView = 'agendaWeek';
							this.forceUpdate();
						}
					}}
					events={this.getStateEventsAsArray()}
					eventTextColor="white"
					eventDrop={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					eventResize={(event: Event, delta: Duration) => this.editEvent(event, delta)}
					height={() => {
						if (this.currentView === 'month')
							return 700;

						return 'auto';
					}}
					aspectRatio={1}
					selectMinDistance={10}
					snapDuration={'00:15:00'}
					slotDuration={'00:30:00'}
					scrollTime={'6:00:00'}
					minTime={'06:00:00'}
					maxTime={'30:00:00'}
					selectable={true}
					selectOverlap={false}
					selectHelper={true}
					viewRender={(view: any) => this.cacheViewAndDate(view)}
					firstDay={1}
					select={this.handleCalendarSelect}
				/>
			</div>
		);
	}

	// Event Modals //////////////////////////////////////////////////////////////////////////////////
	handleCalendarSelect = (start: moment.Moment, end: Moment, jsEvent: any, view: any) => {
		// Don't allow events to be created in month view
		if (this.currentView === 'month')
			return;

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
			cwid: 0,
			ownerName: '',
			groups: [],
			pendingOverride: false
		});
		this.setState({ events: events, showCreateModal: true });
	}

	handleEventCreation = (title: string, description: string, groups: string[]) => {
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
				cwid: this.props.cwid,
				ownerName: '',
				groups: groups,
				pendingOverride: false
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

	handleEventModify = (eventID: number, title: string, description: string, groups: string[]) => {
		let events = this.cloneStateEvents();
		let eventToModify = events.get(eventID);
		if (eventToModify) {
			eventToModify.title = title;
			eventToModify.description = description;
			eventToModify.groups = groups;
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
		let clickedEvent: Event | undefined = events.get(event.id);
		if (clickedEvent && Number(clickedEvent.cwid) === Number(this.props.cwid) || clickedEvent && this.props.role === 'administrator')
			this.openEditEventModal(clickedEvent.id, clickedEvent.title, clickedEvent.description, clickedEvent.groups);
		else if (clickedEvent)
			this.openUnownedEventModal(clickedEvent);
	}

	openEditEventModal = (eventID: number, title: string, description: string, groups: string[]) => {
		if (this.editEventModal)
			this.editEventModal.beginEdit(eventID, title, description, groups);
	}

	openUnownedEventModal = (event: Event) => {
		if (this.unownedEventModal)
			this.unownedEventModal.beginEdit(event);
	}

	handleOverrideRequest = (eventID: number) => {
		let events: Map<number, Event> = this.cloneStateEvents();
		let eventWithRequest: Event | undefined = events.get(eventID);
		if (eventWithRequest) {
			eventWithRequest.pendingOverride = true;
			events.set(eventID, eventWithRequest);
			this.setState({ events: events });
		}
	}

	// Client Events //////////////////////////////////////////////////////////////////////////////////////////////
	public getStateFromDB(room: string = this.props.room, location: string = this.props.location): void {
		this.setState({ loading: true });
		let queryData: {} = {
			where: {
				RoomName: room,
				LocationName: location
			}
		};
		let queryDataString = JSON.stringify(queryData);
		request.get('/api/eventswithrelations').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body) {
				this.eventCache = this.parseDBEvents(res.body);
				this.setState({ events: this.eventCache, loading: false });
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

	parseDBEvents(body: any): Map<number, Event> {
		let parsedEvents: Map<number, Event> = new Map();
		for (let event of body) {
			let userOwnsEvent: boolean = Number(event.CWID) === Number(this.props.cwid) || this.props.role === 'administrator';
			let color = '';
			let borderColor = '';

			if (!userOwnsEvent) {
				borderColor = 'rgba(128,0,41,.4)';
				color = 'rgba(128,0,41,.6)';
			}

			let parsedEvent: any = {
				id: event.EventID,
				title: event.Title,
				description: event.Description,
				start: event.StartTime,
				end: event.EndTime,
				cwid: event.CWID,
				ownerName: event.OwnerName,
				groups: event.Groups,
				pendingOverride: event.PendingOverride,
				color: color,
				borderColor: borderColor,
				editable: userOwnsEvent
			};

			parsedEvents.set(event.EventID, parsedEvent);
		}

		return parsedEvents;
	}

	// Event Persistence /////////////////////////////////////////////////////////////////////////////////////////////////
	persistStateToDB(): void {
		let persistPromises: Promise<any>[] = [];

		persistPromises.push(this.deleteDBEventsNotInClient());

		persistPromises.push(new Promise((resolve, reject) => {
			this.getClientEventIDsThatAreAlreadyInDB().then((eventIDsInDB) => {
				this.updateExistingEventsInDB(eventIDsInDB).then(() => {
					let eventsNotInDB = this.getClientEventsNotYetInDB(eventIDsInDB);
					this.persistNewEventsToDB(eventsNotInDB).then(() => resolve()).catch(() => reject());
				}).catch(() => reject());
			}).catch(() => reject());
		}));

		Promise.all(persistPromises).then(() => {
			// TODO: make this asynchronous
			this.props.handleSendMessage('Changes saved successfully!', 'success');
			this.eventCache = this.state.events;
		}).catch(() => {
			this.props.handleSendMessage('Error saving data.', 'error');
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

	deleteDBEventsNotInClient(): Promise<any> {
		return new Promise((resolveOuter, rejectOuter) => {
			new Promise((resolve, reject) => {
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

				allDBEventIDsForRoom.forEach(id => {
					if (!clientEventIDs.includes(id))
						eventsIDsToDelete.push(Number(id));
				});

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
						if (res && res.body) {
							console.log('deleted events, rows affected: ' + res.body);
							resolveOuter();
						} else
							rejectOuter();
					});
				} else
					resolveOuter();
			}).catch(() => rejectOuter());
		});
	}

	updateExistingEventsInDB(eventIDsInDB: number[]): Promise<void> {
		return new Promise((resolve, reject) => {
			console.log('PERSIST EXISTING......');
			console.log(this.state.events);

			let eventsToUpdate: Event[] = [];
			eventIDsInDB.forEach((id) => {
				let eventToUpdate = this.state.events.get(id);
				console.log(eventToUpdate);
				if (eventToUpdate && Number(eventToUpdate.cwid) === Number(this.props.cwid) || eventToUpdate && this.props.role === 'administrator')
					eventsToUpdate.push(eventToUpdate);
				else
					console.log('not in client or not matching cwid');
			});

			eventsToUpdate.forEach((event: Event) => {
				let queryData = {
					groups: event.groups,
					setValues: {
						'Title': event.title,
						'Description': event.description,
						'StartTime': event.start,
						'EndTime': event.end
					},
					where: { EventID: event.id, RoomName: this.props.room, LocationName: this.props.location }
				};
				let queryDataString = JSON.stringify(queryData);
				request.post('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body) {
						console.log('updated id: ' + event.id + ', ' + event.title + ', ' + event.description);
					} else {
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

	persistNewEventsToDB(events: Event[]): Promise<any> {
		return new Promise((resolveOuter, rejectOuter) => {
			let eventsToCreate: Event[] = [];
			console.log('PERSISTING NEW EVENTS........');
			console.log(events);
			events.forEach(event => {
				eventsToCreate.push(event);
			});

			let persistNewEventsPromises: Promise<any>[] = [];

			eventsToCreate.forEach((event) => {
				persistNewEventsPromises.push(new Promise((resolve, reject) => {
					console.log('persisting new event:');
					console.log(event);
					let queryData = {
						groups: event.groups,
						insertValues: {
							'CWID': this.props.cwid,
							'EventID': event.id,
							'LocationName': this.props.location,
							'RoomName': this.props.room,
							'Title': event.title,
							'Description': event.description,
							'StartTime': event.start,
							'EndTime': event.end
						}
					};
					let queryDataString = JSON.stringify(queryData);
					request.put('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
						if (res && res.body) {
							resolve();
							console.log('created: ' + JSON.stringify(res.body));
						} else
							reject();
					});
				}));
			});

			Promise.all(persistNewEventsPromises).then(() => resolveOuter()).catch(() => rejectOuter());
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
		if (this.currentDate.isBefore(view.intervalStart) || this.currentDate.isAfter(view.intervalEnd.subtract(1, 'minutes'))) {
			this.currentDate = view.intervalStart;
			this.smallestTimeInterval = view.intervalEnd - view.intervalStart;
		}
	}

	// Prevent Leaving Without Save /////////////////////////////////////////////////////////////////////////////////////////////////
	public eventsHaveBeenModified() {
		return this.eventCache !== this.state.events;
	}
}

export default SchedulerCalendar;