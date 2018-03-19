import * as React from 'react';
import ReactDOM from 'react-dom';
import { CSSProperties } from 'react';
import { SchedulerCalendar } from './SchedulerCalendar';
import { RoomFilter } from './RoomFilter';
import { Toolbar } from './Toolbar';
import { RoomSelector } from './RoomSelector';
const request = require('superagent');

interface Props {
	cwid: number;
	role: string;
	handleActiveRouteChange: Function;
}

interface State {
	rooms: Room[];
	selectedRoom: number;
	toolbarMessage: string;
	toolbarStatus?: 'error' | 'success' | 'info';
	initialized: boolean;
}

export interface Room {
	locationName: string;
	roomName: string;
	capacity: number;
	resources: { name: string, count: number }[];
}

export interface RoomFilters {
	searchText: string;
	location?: string;
	capacity: { min: number };
	resources: { name: string, min?: number }[];
}

export class Scheduler extends React.Component<Props, State> {
	private schedulerCalendar: SchedulerCalendar | null;
	private toolbar: any;
	private roomComponentContainer: any;
	private allRooms: Room[] = [];
	private defaultToolbarMessage: string = 'Click and drag to schedule a new event.';
	private lastSelectedRoom: Room;
	private bottomSpacerHeight: number = 80;
	private spacerHeightFound: boolean = false;

	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			rooms: [],
			selectedRoom: 0,
			toolbarMessage: this.defaultToolbarMessage,
			initialized: false
		};
		this.getAllRoomsFromDB();
	}

	componentWillMount() {
		this.props.handleActiveRouteChange('Scheduler');
	}

	componentDidUpdate() {
		var node = ReactDOM.findDOMNode(this.toolbar);
		if (node) {
			let forceUpdate: boolean = Number(this.bottomSpacerHeight) !== Number(node.clientHeight + 5);
			this.bottomSpacerHeight = node.clientHeight + 5;
			this.spacerHeightFound = true;
			if (forceUpdate)
				this.forceUpdate();
		}
	}

	render() {
		if (!this.state.initialized)
			return null;

		let bottomSpacerStyle: CSSProperties = {
			height: this.bottomSpacerHeight
		};
		let selectedRoom = this.state.rooms.indexOf(this.lastSelectedRoom);
		let selectedRoomName = this.lastSelectedRoom.roomName;
		let selectedLocationName = this.lastSelectedRoom.locationName;

		return (
			<div>
				<div className="Scheduler container-fluid">
					<div className="row">
						<div className="col-md-3 mb-3" ref={(container) => { this.roomComponentContainer = container; }}>
							<RoomFilter container={this.roomComponentContainer} filterChangeHandler={this.filterChangeHandler} />
							<RoomSelector
								rooms={this.state.rooms}
								selectedRoom={selectedRoom}
								handleUpdateSelectedRoom={this.handleUpdateSelectedRoom}
							/>
						</div>
						<div className="col-md-9">
							<SchedulerCalendar
								ref={(schedulerCalendar) => { this.schedulerCalendar = schedulerCalendar; }}
								handleToolbarMessage={this.handleToolbarMessage}
								handleToolbarText={this.setToolbarText}
								handleToolbarReset={this.resetToolbar}
								room={selectedRoomName}
								location={selectedLocationName}
								cwid={this.props.cwid}
								role={this.props.role}
							/>
						</div>
					</div>
				</div>
				<Toolbar
					ref={(toolbar) => { this.toolbar = toolbar; }}
					status={this.state.toolbarStatus}
					message={this.state.toolbarMessage}
					handleSave={this.persistEventsToDB}
					handleRevert={() => { this.schedulerCalendar ? this.schedulerCalendar.getStateFromDB() : null; }}
				/>
				<div style={bottomSpacerStyle} />
			</div>
		);
	}

	// Rooms from DB //////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getAllRoomsFromDB() {
		request.get('/api/rooms').end((error: {}, res: any) => {
			if (res && res.body) {
				let rooms: any[] = res.body;
				let parsedRooms = this.parseRoomsFromDB(rooms);
				this.allRooms = parsedRooms;
				this.lastSelectedRoom = this.allRooms[0];
				this.setState({ rooms: parsedRooms, initialized: true });
			}
		});
	}

	parseRoomsFromDB(rooms: any[]): Room[] {
		let parsedRooms: Room[] = [];
		let roomMap: Map<string, Room> = new Map<string, Room>();
		rooms.forEach((room: any) => {
			if (!roomMap.has(room.RoomName + room.LocationName)) {
				let resources: { name: string, count: number }[] = [];
				if (room.ResourceName && room.Count)
					resources = [{ name: room.ResourceName, count: room.Count }];

				let newRoom: Room = {
					locationName: room.LocationName,
					roomName: room.RoomName,
					capacity: room.Capacity,
					resources: resources
				};
				roomMap.set(room.RoomName + room.LocationName, newRoom);
			} else {
				let alreadySetRoom = roomMap.get(room.RoomName + room.LocationName);
				if (alreadySetRoom)
					alreadySetRoom.resources.push({ name: room.ResourceName, count: room.Count });
			}
		});

		roomMap.forEach(parsedRoom => {
			parsedRooms.push(parsedRoom);
		});

		return parsedRooms;
	}

	// Toolbar //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	setToolbarText = (message: string, style: 'success' | 'error' | 'info' | undefined) => {
		this.setState({ toolbarMessage: message, toolbarStatus: style });
	}

	resetToolbar = () => {
		this.setState({ toolbarMessage: this.defaultToolbarMessage, toolbarStatus: undefined });
	}

	handleToolbarMessage = (message: string, style?: 'success' | 'error') => {
		this.setState({ toolbarMessage: message, toolbarStatus: style });
		setTimeout(() => {
			this.setState({ toolbarMessage: this.defaultToolbarMessage, toolbarStatus: undefined });
		}, 4000);
	}

	// Filters /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	filterChangeHandler = (filters: RoomFilters) => {
		let filteredRooms: Room[] = [];
		this.allRooms.forEach(room => {
			let roomNameLocationString = room.roomName + ' ' + room.locationName;
			if ((!filters.capacity.min || room.capacity === null || Number(room.capacity) >= Number(filters.capacity.min)) &&
				this.stringSearch(filters.searchText, roomNameLocationString) &&
				this.roomMatchesEveryResource(room, filters.resources) &&
				(!filters.location || room.locationName === filters.location))
				filteredRooms.push(room);
		});

		this.setState({ rooms: filteredRooms });
	}

	stringSearch(searchString: string, targetString: string): boolean {
		let stringSplits: string[] = searchString.split(' ');
		let matchFound: boolean = true;
		stringSplits.forEach(stringSplit => {
			if (!targetString.match(new RegExp(stringSplit, 'i')))
				matchFound = false;
		});

		return matchFound;
	}

	roomMatchesEveryResource(room: Room, filterResources: { name: string, min?: number }[]): boolean {
		let roomResourceMap: Map<string, number> = new Map<string, number>();
		room.resources.forEach(roomResource => {
			if (!roomResourceMap.has(roomResource.name))
				roomResourceMap.set(roomResource.name, roomResource.count);
		});

		let roomHasEveryResource: boolean = true;
		filterResources.forEach(filterResource => {
			let roomResourceCount = roomResourceMap.get(filterResource.name);
			if (!roomResourceMap.has(filterResource.name) ||
				(roomResourceCount && filterResource.min && Number(roomResourceCount) < Number(filterResource.min)))
				roomHasEveryResource = false;
		});

		return roomHasEveryResource;
	}

	// Events //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	persistEventsToDB = () => {
		if (this.schedulerCalendar)
			this.schedulerCalendar.persistStateToDB();
	}

	// Handling Selected Room ///////////////////////////////////////////////////////////////////////////////////////////////////////
	handleUpdateSelectedRoom = (index: number) => {
		let shouldLeaveRoom: boolean = true;

		if (this.schedulerCalendar &&
			this.schedulerCalendar.eventsHaveBeenModified() &&
			Number(this.state.selectedRoom) !== Number(index) &&
			!confirm('You have unsaved changes. Are you sure you want to leave this room?'))
			shouldLeaveRoom = false;

		if (shouldLeaveRoom) {
			this.lastSelectedRoom = this.state.rooms[index];
			this.setState({ selectedRoom: index });
		}
	}
}

export default Scheduler;