import * as React from 'react';
import { Room } from './Scheduler';
import { RoomButton } from './RoomButton';
const uuid = require('uuid/v4');

interface Props {
	rooms: Room[];
	selectedRoom: number;
	handleUpdateSelectedRoom: Function;
}

export class RoomSelector extends React.Component<Props, {}> {

	constructor(props: Props, state: {}) {
		super(props);
	}

	render() {
		let handleUpdateSelectedRoom = (index: number) => {this.props.handleUpdateSelectedRoom(index); };
		let buttons = this.props.rooms.map((thisRoom, index) => {
			if (index === this.props.selectedRoom)
				return <RoomButton key={uuid()} room={thisRoom} index={index} isSelected={true} handleUpdateSelectedRoom={handleUpdateSelectedRoom}/>;
			else
				return <RoomButton key={uuid()} room={thisRoom} index={index} isSelected={false} handleUpdateSelectedRoom={handleUpdateSelectedRoom}/>;
			});
		return (
			<div>{buttons}</div>
		);
	}
}