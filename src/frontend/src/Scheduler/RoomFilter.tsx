import * as React from 'react';
import { RoomFilters } from './Scheduler';
import { FilterResource } from './FilterResource';
const uuid = require('uuid/v4');

interface Props {
	filterChangeHandler: Function;
}

interface State {
	roomFilters: RoomFilters;
}

export class RoomFilter extends React.Component<Props, State> {

	private allLocations: string[] = [];
	private allResources: string[] = ['resource 1', 'resource 2', 'resource 3', 'resource 4'];
	private unselectedResources: string[] = this.allResources;

	constructor(props: Props, state: State) {

		super(props, {});

		this.state = {
			roomFilters: {
				searchText: '',
				capacity: { min: 0, max: 1000 },
				resources: []
			}
		};

		// TODO: Get all possible locations and resources on initialize
		this.allLocations = ['location 1', 'location 2'];
	}

	render() {
		this.unselectedResources = this.allResources.slice(0);

		const locationOptions = this.allLocations.map(location => {
			return (<option key={uuid()} value={location}>{location}</option>);
		});

		let resourceComponents: any[] = [];

		console.log('rendering...');
		console.log(this.state.roomFilters.resources);
		this.state.roomFilters.resources.forEach(resource => {
			let resourceIndex = this.state.roomFilters.resources.indexOf(resource);

			let selected: string = this.unselectedResources[0];
			if (this.state.roomFilters.resources[resourceIndex])
				selected = this.state.roomFilters.resources[resourceIndex].name;

			resourceComponents.push(
				<FilterResource
					key={uuid()}
					index={resourceIndex}
					resources={this.unselectedResources.slice(0)}
					selectedResource={selected}
					handleDelete={this.handleDeleteResource}
					handleMaxChange={() => { return false; }}
					handleMinChange={() => { return false; }}
					handleResourceChange={this.handleResourceChange}
				/>
			);
			this.unselectedResources.splice(this.unselectedResources.indexOf(this.state.roomFilters.resources[resourceIndex].name), 1);
		});

		let addButton: any = null;
		if (this.state.roomFilters.resources.length < this.allResources.length) {
			console.log('creating button...');
			addButton = <button className="btn btn-primary" onClick={this.handleAddResource}>Add Resource</button>;

		}

		return (
			<div>
				<br />
				Room Filter:
				<br />
				<input type="text" value={this.state.roomFilters.searchText} onChange={this.handleSearchTextChange} />
				<br />
				<label>
					Location:
					<select value={0} onChange={this.handleLocationChange}>
						{locationOptions}
					</select>
				</label>
				<br />
				<label>
					Capacity:
					<label>
						Min:
						<input type="number" value={this.state.roomFilters.capacity.min} onChange={this.handleCapacityMinChange} />
					</label><label>
						Max:
						<input type="number" value={this.state.roomFilters.capacity.max} onChange={this.handleCapacityMaxChange} />
					</label>
				</label>
				<br />
				<label>
					Resources:
					{resourceComponents}
					<br />
					{addButton}
				</label>
				<br />
				<br />
			</div>
		);
	}

	handleSearchTextChange = (event: any) => {
		this.setState({ roomFilters: { ...this.state.roomFilters, searchText: event.target.value } });
		// TODO: make sure the state being passed is the state after being changed
		this.props.filterChangeHandler(this.state);
	}

	handleLocationChange = (event: any) => {
		this.setState({ roomFilters: { ...this.state.roomFilters, location: event.target.value } });
		this.props.filterChangeHandler(this.state);
	}

	handleCapacityMinChange = (event: any) => {
		this.setState({ roomFilters: { ...this.state.roomFilters, capacity: { ...this.state.roomFilters.capacity, min: event.target.value } } });
		this.props.filterChangeHandler(this.state);
	}

	handleCapacityMaxChange = (event: any) => {
		this.setState({ roomFilters: { ...this.state.roomFilters, capacity: { ...this.state.roomFilters.capacity, max: event.target.value } } });
		this.props.filterChangeHandler(this.state);
	}

	// Resources ///////////////////////////////////////////////////////////////////////////////////////////////

	handleResourceChange = (event: any, index: number) => {
		console.log('resource change...');
		// if (this.state.roomFilters.resources.length < 1)
		// 	this.setState({ roomFilters: { ...this.state.roomFilters, resources: [{ name: event.target.value }] } });
		// else {
		// 	let newResourceState = this.state.roomFilters.resources.slice(0); // clones the resources array
		// 	newResourceState[index].name = event.target.value;
		// 	this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } });
		// }
		if (this.state.roomFilters.resources[index]) {
			let newResourceState = this.state.roomFilters.resources.slice(0); // clones the resources array
			newResourceState[index].name = event.target.value;
			this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } });
		} else {
			let newResourceState = this.state.roomFilters.resources.slice(0); // clones the resources array
			newResourceState.push({ name: event.target.value });
			this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } });
		}
	}

	handleAddResource = () => {
		// if (this.state.roomFilters.resources.length !== this.allResources.length)
		console.log('adding...');
		this.setState(state => ({
			roomFilters: {
				...this.state.roomFilters,
				resources: state.roomFilters.resources.concat({ name: this.unselectedResources[0] })
			}
		}));
		// this.setState(state => ({
		// 	inputCount: state.inputCount + 1
		// }));
	}

	handleDeleteResource = (index: number) => {
		console.log('deleting...');
		let newResourceState = this.state.roomFilters.resources.slice(0); // clones the resources array
		console.log(JSON.stringify(newResourceState));
		newResourceState.splice(index, 1);
		console.log(JSON.stringify(newResourceState));
		this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } });
	}

}

export default RoomFilter;