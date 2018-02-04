import * as React from 'react';

interface Props {
	room: string;
}

interface State {
	events: { number: Event } | {};
}

export class SchedulerCalendar extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
	}

	render() {
		return (
			<div>{this.props.room}</div>
		);
	}
}

export default SchedulerCalendar;