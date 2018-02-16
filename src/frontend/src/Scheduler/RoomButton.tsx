import * as React from 'react';
import { Room } from './Scheduler';

interface Props {
	room: Room;
}

interface State {
	isSelected: boolean;
}

export class RoomButton extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			isSelected: false
		};
	}
	render() {
		let updateState = () => this.updateButtonState();
		if (this.state.isSelected)
			return (
			<button className="btn-primary btn-block" onClick={updateState}>
			{this.props.room.locationName + '-' + this.props.room.roomName}<br/>
			Capacity: {this.props.room.capacity}<br />
			Resources: {}</button>
			);
		else
			return <button className="btn-secondary btn-block" onClick={updateState}>{this.props.room.locationName + '-' + this.props.room.roomName}</button>;
	}
	updateButtonState() {
		if (this.state.isSelected)
			this.setState({isSelected: false});
		else
			this.setState({isSelected: true});
	}
}