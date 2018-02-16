import * as React from 'react';
import { Room } from './Scheduler';
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
		let buttons = this.props.rooms.map(room => {
			let roomName = room.locationName + ' - ' + room.roomName;
			return <button className="btn-primary btn-block" key={uuid()} onClick={function() {return 1; }}>{roomName}</button>; });
		return (
			<div>{buttons}</div>
		);
	}
}