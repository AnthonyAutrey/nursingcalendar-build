import * as React from 'react';
import { Room } from './Scheduler';
import { CSSProperties } from 'react';
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

		let resourceStrings: string[] = this.props.room.resources.map((resource, index) => {
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
		});

		let buttonStyle: CSSProperties = {
			wordBreak: 'break-word',
			whiteSpace: 'normal'
		};

		let button: JSX.Element = (
			<div className="btn btn-primary btn-block" style={buttonStyle} onClick={() => this.props.handleUpdateSelectedRoom(this.props.index)}>
				<h5 className="font-weight-bold">{this.props.room.locationName + ' - ' + this.props.room.roomName}</h5>
				<hr className="bg-white my-1 w-50" />
				<div className="col-10 offset-1 text-center">
					<b>Capacity: </b> {this.props.room.capacity || 'n/a'}
					<br />
					<b>Resources: </b>
					{resourceStrings}
				</div>
			</div>
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