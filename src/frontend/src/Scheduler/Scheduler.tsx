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
	capacity: { min: number };
	resources: { name: string, min?: number }[];
}

export class Scheduler extends React.Component<{}, State> {
	private schedulerCalendar: SchedulerCalendar | null;

	constructor(props: {}, state: State) {
		super(props, state);
	}

	render() {
		return (
			<div>
				<button className="btn btn-primary" onClick={() => this.persistEventsToDB()}>Persist To DB</button>
				<div className="Scheduler container-fluid">
					<div className="row">
						<div className="col-3">
							<RoomFilter filterChangeHandler={this.filterChangeHandler} />
						</div>
						<div className="col-9">
							<SchedulerCalendar room={'Room 1'} ref={(schedulerCalendar) => { this.schedulerCalendar = schedulerCalendar; }} />
						</div>
					</div>
				</div>
			</div>
		);
	}
	// Filters /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	filterChangeHandler(filters: RoomFilters) {
		// TODO: update list of rooms based on changes to filters
		// TODO: maybe throttle this

		console.log('API call!');
		console.log(JSON.stringify(filters));
	}

	// Events //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	persistEventsToDB() {
		if (this.schedulerCalendar)
			this.schedulerCalendar.persistStateToDB();
	}
}

export default Scheduler;