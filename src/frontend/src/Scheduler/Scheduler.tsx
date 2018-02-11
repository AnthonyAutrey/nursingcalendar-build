import * as React from 'react';
import { SchedulerCalendar } from './SchedulerCalendar';
import { RoomFilter } from './RoomFilter';
const request = require('superagent');

interface State {
	rooms: Room[];
	selectedRoom: number;
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

export class Scheduler extends React.Component<{}, State> {
	private schedulerCalendar: SchedulerCalendar | null;
	private allRooms: Room[] = [];

	constructor(props: {}, state: State) {
		super(props, state);
		this.state = {
			rooms: [],
			selectedRoom: 0
		};
		this.getAllRoomsFromDB();
	}

	render() {
		return (
			<div>
				<button className="btn btn-primary" onClick={() => this.persistEventsToDB()}>Persist To DB</button>
				<div className="Scheduler container-fluid">
					<div className="row">
						<div className="col-3">
							<RoomFilter filterChangeHandler={this.filterChangeHandler} />
						</div>
						<div className="col-9">
							<SchedulerCalendar room={'Room 1'} ref={(schedulerCalendar) => { this.schedulerCalendar = schedulerCalendar; }} />
						</div>
					</div>
				</div>
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
				this.setState({ rooms: parsedRooms });
			}
		});
	}

	parseRoomsFromDB(rooms: any[]): Room[] {
		let parsedRooms: Room[] = [];
		let roomMap: Map<string, Room> = new Map<string, Room>();
		rooms.forEach((room: any) => {
			if (!roomMap.has(room.RoomName + room.LocationName)) {
				let newRoom: Room = {
					locationName: room.LocationName,
					roomName: room.RoomName,
					capacity: room.Capacity,
					resources: [{ name: room.ResourceName, count: room.Count }]
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
	// Filters /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	filterChangeHandler = (filters: RoomFilters) => {
		let filteredRooms: Room[] = [];
		this.allRooms.forEach(room => {
			if ((!filters.capacity.min || room.capacity === null || Number(room.capacity) >= Number(filters.capacity.min)) &&
				room.roomName.match(new RegExp(filters.searchText, 'i')) &&
				this.roomMatchesEveryResource(room, filters.resources) &&
				(!filters.location || room.locationName === filters.location))
				filteredRooms.push(room);
		});

		console.log(JSON.stringify(filteredRooms.length));
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
	persistEventsToDB() {
		if (this.schedulerCalendar)
			this.schedulerCalendar.persistStateToDB();
	}
}

export default Scheduler;