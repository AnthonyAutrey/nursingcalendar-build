import * as React from 'react';
import { SchedulerCalendar } from './SchedulerCalendar';
import { RoomFilter } from './RoomFilter';

interface State {
	rooms: Room[];
	selectedRoom: number;
}

interface Room {
	roomName: string;
	capacity: number;
	resources: { name: string, count: number }[];
}

export interface RoomFilters {
	searchText: string;
	location?: string;
	capacity: { min?: number, max?: number };
	resources: { name: string, min?: number, max?: number }[];
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
				<RoomFilter filterChangeHandler={this.filterChangeHandler} />
				<SchedulerCalendar room={'Room 1'} ref={(schedulerCalendar) => { this.schedulerCalendar = schedulerCalendar; }} />
			</div>
		);
	}
	// Filters /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	filterChangeHandler(filters: RoomFilters) {
		// TODO: update list of rooms based on changes to filters
		// TODO: maybe throttle this

		console.log('API call to get rooms based on filter change!');
	}

	// Events //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	persistEventsToDB() {
		if (this.schedulerCalendar)
			this.schedulerCalendar.persistStateToDB();
	}
}

export default Scheduler;