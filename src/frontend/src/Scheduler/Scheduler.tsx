import * as React from 'react';
import { SchedulerCalendar } from './SchedulerCalendar';

interface State {
	roomFilters: {}; // TODO: Fill out the format of this object 
	rooms: [{ name: string, capacity: number }];
	selectedRoom: number;
}

interface Room {
	roomName: string;
	capacity: number;
	resources: { name: string, count: number };
}

export class Scheduler extends React.Component<{}, State> {
	private schedulerCalendar: SchedulerCalendar | null;

	constructor(props: {}, state: State) {
		super(props, state);
	}

	render() {
		return (
			<div className="Scheduler">
				<button className="btn btn-primary" onClick={() => this.persistEventsToDB()}>Persist To DB</button>
				<SchedulerCalendar room={'Room 1'} ref={(schedulerCalendar) => { this.schedulerCalendar = schedulerCalendar; }} />
			</div>
		);
	}

	persistEventsToDB() {
		if (this.schedulerCalendar)
			this.schedulerCalendar.persistStateToDB();
	}
}

export default Scheduler;