import * as React from 'react';
import { Room } from './Scheduler';
import './scheduler.css';
const scheduler = require('./Scheduler');

interface Props {
	rooms: Room[];
	selectedRoom: number;
}

interface State {
	selectedRoom: number;
}

export class RoomSelector extends React.Component<Props, {}> {

	constructor(props: Props, state: {}) {
		super(props, state);
		this.state = { selected: null };
	}

	render() {
		// TODO: Find a way to determine which button was clicked
		let testScript = function() {alert('You clicked '); };
		return (
			<div className="Container" dangerouslySetInnerHTML={{__html: this.buttonListBuilder()}} onClick={testScript}/>
		);
	}

	buttonListBuilder() {
		// Initialize HTML Element and Array Objects.
		var div = document.createElement('div');
		var form = document.createElement('form');
		let roomArray: string[] = new Array<string>();
		// Build the String Array.
		this.props.rooms.forEach((room) => {
			var roomInfo = room.locationName + ' - ' + room.roomName;
			roomArray.push(roomInfo);
		});
		// Sort the String Array.
		roomArray.sort((a, b) => {
			if (a < b) return -1; 
			if (a > b) return 1; 
			return 0; });
		// Create an HTMLButtonElement for each element in the String Array.
		for (var i = 0; i < roomArray.length; i++) {
			var button = document.createElement('button');
			button.innerHTML = roomArray[i];
			form.appendChild(button);
			form.appendChild(document.createElement('br'));
		}
		// Append the created form to the HTMLDivElement.
		div.appendChild(form);
		// Return that HTMLDivElement.
		return div.innerHTML;
	}

	determineSelectedRoom() {
		// TODO: Add Functionality
		return 1;
	}
}