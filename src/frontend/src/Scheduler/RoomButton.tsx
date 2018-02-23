import * as React from 'react';
import { Room } from './Scheduler';
const uuid = require('uuid/v4');

interface Props {
	room: Room;
	index: number;
	isSelected: boolean;
	handleUpdateSelectedRoom: Function;
}

export class RoomButton extends React.Component<Props, {}> {
	constructor(props: Props) {
		super(props);
	}

	render() {
		let buttonIndex = this.props.index;
		let button: JSX.Element = (
			<button className="btn btn-primary btn-block" onClick={() => this.props.handleUpdateSelectedRoom(this.props.index)}>
				{this.props.room.locationName + ' - ' + this.props.room.roomName}<br />
				Capacity: {this.props.room.capacity}<br />
				Resources: {this.props.room.resources.map(resource => {
					if (resource.count == null)
						return (<div key={uuid()}>{resource.name}<br /></div>);
					else
						return (<div key={uuid()}>{resource.count + ' ' + resource.name}<br /></div>);
				})}
			</button>
		);

		if (!this.props.isSelected)
			button = (
				<button className="btn btn-secondary btn-block" onClick={() => this.props.handleUpdateSelectedRoom(this.props.index)}>
					{this.props.room.locationName + ' - ' + this.props.room.roomName}
				</button>
			);

		return button;
	}
}