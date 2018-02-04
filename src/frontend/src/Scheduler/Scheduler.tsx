import * as React from 'react';
import { SchedulerCalendar } from './SchedulerCalendar';

interface State {
	roomFilters: {}; // TODO: Fill out the format of this object 
	rooms: [{ name: string, capacity: number }];
	selectedRoom: number;
}

export class Scheduler extends React.Component<{}, State> {
	constructor(props: {}) {
		super({});
	}

	render() {
		return (
			<SchedulerCalendar room={'Room 1'} />
		);
	}
}

export default Scheduler;