import * as React from 'react';
import { Room } from './Scheduler';

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
		let button = (
			<button className="btn btn-primary btn-block" onClick={() => this.props.handleUpdateSelectedRoom(this.props.index)}>
				{this.props.room.locationName + ' - ' + this.props.room.roomName}<br />
				Capacity: {this.props.room.capacity}<br />
				Resources: {this.props.room.resources.map(resource => {
					if (resource.count == null)
						return (<div>{resource.name}<br /></div>);
					else
						return (<div>{resource.count + ' ' + resource.name}<br /></div>);
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