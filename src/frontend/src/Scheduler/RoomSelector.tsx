import * as React from 'react';
import { Room } from './Scheduler';
import { RoomButton } from './RoomButton';
const uuid = require('uuid/v4');

interface Props {
	rooms: Room[];
	selectedRoom: number;
	//handleUpdateSelectedRoom: Function;
}

export class RoomSelector extends React.Component<Props, {}> {

	constructor(props: Props, state: {}) {
		super(props);
		this.state = {selectedRoom: ''};
	}

	render() {
		let buttons = this.props.rooms.map(thisRoom => {
			return <RoomButton key={uuid()} room={thisRoom} />; });
		return (
			<div>{buttons}</div>
		);
	}
}