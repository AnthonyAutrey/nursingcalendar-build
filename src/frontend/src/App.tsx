import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './App.css';
import { Duration, Moment } from 'moment';

const FullCalendarReact = require('fullcalendar-reactwrapper');
const fullcalendarCSS = require('../node_modules/fullcalendar-reactwrapper/dist/css/fullcalendar.min.css');
const request = require('superagent');

// Interfaces ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
interface State {
	events: { number: Event } | {};
}

interface Event {
	id: number;
	title: string;
	start: string;
	end?: string;
}

class App extends React.Component<{}, State> {

	private scrollPosition: number = 0;
	private currentView: String | null = null;
	private currentDate: any | null = null;
	private smallestTimeInterval: number = Number.MAX_SAFE_INTEGER;

	constructor() {
		super({}, {});

		this.state = { events: {} };
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
			<div className="App">
				<header className="App-header">
					<h1 className="App-title">Nursing Scheduler</h1>
				</header>
				<button onClick={() => this.persistStateToDB()}>Persist To DB</button>
				<div id="calendar" />
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
					select={(start: any, end: any, jsEvent: any, view: any) => {
						let promptResult: string | null = prompt('Enter Title');
						let title: string = '';
						if (promptResult !== null)
							title = promptResult;
						else {
							this.forceUpdate();
							return;
						}

						let index: number = Object.keys(this.state.events).length;
						let events = this.cloneStateEvents();

						events[index] = { id: index, title: title, start: start, end: end };
						this.setState({ events: events });
					}}
				/>
			</div>
		);
	}

	// Client Events ////////////////////////////////////////////////////////////////////////////////////////
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
		let index: number = event.id;
		let events = this.state.events;
		events[index] = newEvent;

		this.setState({ events: events });
	}

	getStateEventsAsArray(): Event[] {
		let events: Event[] = [];
		for (const key in this.state.events) {
			if (this.state.events.hasOwnProperty(key)) {
				const event = this.state.events[key];
				events.push(event);
			}
		}

		return events;
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
				let queryData = { setValues: { 'name': event.title, 'start_time': event.start, 'end_time': event.end }, where: { id: [event.id] } };
				let queryDataString = JSON.stringify(queryData);
				request.post('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body) {
						console.log('updated: ' + res.body);
						resolve();
					} else
						reject();
				});
			});
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
			let queryData = { insertValues: { 'id': event.id, 'name': event.title, 'start_time': event.start, 'end_time': event.end } };
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
			for (const key in this.state.events) {
				if (this.state.events.hasOwnProperty(key)) {
					ids.push(parseInt(key, 10));
				}
			}

			console.log('state: ');
			console.log(this.state.events);
			console.log('supposed to be all keys:');
			console.log(ids);
			let queryData = { fields: ['id'], where: { id: ids } };
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
			ids.push(event.id);

		return ids;
	}

	getStateFromDB(): void {
		request.get('/api/events').end((error: {}, res: any) => {
			if (res && res.body)
				this.setState({ events: this.parseDBEventsAsMap(res.body) });
		});
	}

	parseDBEventsAsMap(body: any): { number: Event } | {} {
		let parsedEvents: { number: Event } | {} = {};
		for (let event of body) {

			let parsedEvent: Event = {
				id: event.id,
				title: event.name,
				start: event.start_time,
				end: event.end_time,
			};

			parsedEvents[event.id] = (parsedEvent);
		}

		return parsedEvents;
	}

	// Store Calendar State /////////////////////////////////////////////////////////////////////////////////////////////////////////
	cacheViewAndDate(view: any) {
		this.currentView = view.name;
		if (view.intervalEnd - view.intervalStart <= this.smallestTimeInterval) {
			this.currentDate = view.intervalStart;
			this.smallestTimeInterval = view.intervalEnd - view.intervalStart;
		}

		if (this.currentDate.isBefore(view.intervalStart) || this.currentDate.isAfter(view.intervalEnd)) {
			this.currentDate = view.intervalStart;
			this.smallestTimeInterval = view.intervalEnd - view.intervalStart;
		}
	}

}

export default App;
