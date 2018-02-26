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
				<div className="h5"><b>{this.props.room.locationName + ' - ' + this.props.room.roomName}</b></div>
				<hr className="bg-white my-1 w-50" />
				<div className="px-5">
					<div className="row mx-5">
						<div className="col-3 text-left">
							<b>Capacity: </b>
						</div>
						<div className="col-9 text-left">
							{this.props.room.capacity}
						</div>
					</div>
					<div className="row mx-5">
						<div className="col-3 text-left">
							<b>Resources: </b>
						</div>
						<div className="col-9 text-left">
							{this.props.room.resources.map((resource, index) => {
								if (index !== this.props.room.resources.length - 1)
									if (resource.count === null)
										return (resource.name + ', ');
									else
										return (resource.count + ' ' + resource.name + ', ');
								else
									if (resource.count === null)
										return (resource.name);
									else
										return (resource.count + ' ' + resource.name);
							})}
						</div>
					</div>
				</div>
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