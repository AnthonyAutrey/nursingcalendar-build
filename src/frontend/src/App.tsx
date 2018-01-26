import * as React from 'react';
const FullCalendar = require('fullcalendar-reactwrapper');
const fullcalendarCSS = require('../node_modules/fullcalendar-reactwrapper/dist/css/fullcalendar.min.css');
import './App.css';
import { Stats } from 'fs';

const logo = require('./logo.svg');

interface State {
	events: [{}];
}

class App extends React.Component<{}, State> {

	constructor() {
		super({}, {});

		this.state = {
			events: [
				{
					title: 'All Day Event',
					start: '2018-01-01'
				},
				{
					title: 'Long Event',
					start: '2017-05-07',
					end: '2018-01-10'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2018-01-09T16:00:00'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2018-01-16T16:00:00'
				},
				{
					title: 'Conference',
					start: '2018-01-11',
					end: '2018-01-13'
				},
				{
					title: 'Meeting',
					start: '2018-01-12T10:30:00',
					end: '2018-01-12T12:30:00'
				},
				{
					title: 'Test',
					start: '2018-01-13T07:00:00',
					test: 'yes'
				},
				{
					title: 'Click for Google',
					url: 'http://google.com/',
					start: '2018-01-28'
				},
				{
					title: 'Conference',
					start: '2018-01-11',
					end: '2018-01-13'
				},
				{
					title: 'Meeting',
					start: '2018-01-12T10:30:00',
					end: '2018-01-12T12:30:00'
				},
				{
					title: 'Clinicals',
					start: '2018-01-13T07:00:00'
				},
				{
					title: 'Click for Google',
					url: 'http://google.com/',
					start: '2018-01-28'
				},
				{
					title: 'All Day Event',
					start: '2018-01-01'
				},
				{
					title: 'Long Event',
					start: '2017-05-07',
					end: '2018-01-10'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2018-01-09T16:00:00'
				},
				{
					id: 999,
					title: 'Repeating Event',
					start: '2018-01-16T16:00:00'
				},
				{
					title: 'Conference',
					start: '2018-01-11',
					end: '2018-01-13'
				},
				{
					title: 'Meeting',
					start: '2018-01-12T10:30:00',
					end: '2018-01-12T12:30:00'
				},
				{
					title: 'Clinicals',
					start: '2018-01-13T07:00:00'
				},
				{
					title: 'Click for Google',
					url: 'http://google.com/',
					start: '2018-01-28'
				},
				{
					title: 'Conference',
					start: '2018-01-11',
					end: '2018-01-13'
				},
				{
					title: 'Meeting',
					start: '2018-01-12T10:30:00',
					end: '2018-01-12T12:30:00'
				},
				{
					title: 'Clinicals',
					start: '2018-01-13T07:00:00'
				},
				{
					title: 'Click for Google',
					url: 'http://google.com/',
					start: '2018-01-28'
				}
			],
		};
	}

	render() {
		return (
			<div className="App">
				<header className="App-header">
					<img src={logo} className="App-logo" alt="logo" />
					<h1 className="App-title">Nursing Scheduler</h1>
				</header>
				<div className="calendar" />
				<FullCalendar
					id="your-custom-ID"
					header={{
						left: 'prev,next today myCustomButton',
						center: 'title',
						right: ''
					}}
					// defaultDate={'2017-09-12'}
					defaultView={'agendaWeek'}
					navLinks={true} // can click day/week names to navigate views
					editable={true}
					slotEventOverlap={false}
					// eventAllow={(dropInfo: any, draggedEvent: any) => {
					// 	console.log(JSON.stringify(dropInfo));
					// 	return draggedEvent.title === 'Clinicals';
					// }}
					// eventLimit={true} // allow "more" link when too many events
					// eventLimitClick={'day'}
					events={this.state.events}
					eventDrop={(event: any, delta: any, revertDrop: Function) => {
						console.log(JSON.stringify(delta));
						if (!confirm('do it?'))
							revertDrop();
					}}
					height={'auto'}
					snapDuration={'00:15:00'}
					slotDuration={'00:30:00'}
					scrollTime={'24:00:00'}
					// minTime={'03:00:00'}
					// maxTime={'27:00:00'}
					selectable={true}
					selectOverlap={false}
					selectHelper={false}
					select={(start: any, end: any, jsEvent: any, view: any) => {
						let abc = prompt('Enter Title');
						// var allDay = !start.hasTime && !end.hasTime;
						// let newEvent: any = {};
						// newEvent.title = abc;
						// newEvent.start = start;
						// newEvent.allDay = false;

						return false;
					}}
				/>
			</div>
		);
	}
}

export default App;
