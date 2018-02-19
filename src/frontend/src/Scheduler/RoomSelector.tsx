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
		super(props, state);
	}

	render() {
		let handleUpdateSelectedRoom = (index: number) => { this.props.handleUpdateSelectedRoom(index); };
		let buttons = this.props.rooms.map((room, index) => {
			return (
				<RoomButton
					key={uuid()}
					room={room}
					index={index}
					isSelected={index === this.props.selectedRoom}
					handleUpdateSelectedRoom={handleUpdateSelectedRoom}
				/>);
		});
		return (
			<div>{buttons}</div>
		);
	}
}