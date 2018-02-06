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
	private allResources: string[] = ['resource 1', 'resource 2', 'resource 3', 'resource 4', 'resource 5', 'a', 'b', 'c'];
	private unselectedResources: string[] = this.allResources;
	// HACK: godawful hack to prevent resource from being added when resources array is empty
	// and React decided to click 'add resource' button automatically
	private addResourceFunction: Function;

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
		this.addResourceFunction = this.handleAddResource;
	}

	// HACK: enable adding resource
	componentDidUpdate() {
		setTimeout(() => { this.addResourceFunction = this.handleAddResource; }, 200);
	}

	render() {

		this.unselectedResources = this.allResources.slice(0);
		this.state.roomFilters.resources.forEach(res => {
			if (this.unselectedResources.includes(res.name))
				this.unselectedResources.splice(this.unselectedResources.indexOf(res.name), 1);
		});
		this.unselectedResources.sort((a, b) => {
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		});

		const locationOptions = this.allLocations.map(location => {
			return (<option key={uuid()} value={location}>{location}</option>);
		});

		let resourceComponents: any[] = [];

		this.state.roomFilters.resources.forEach(resource => {
			let resourceIndex = this.state.roomFilters.resources.indexOf(resource);

			let selected: string = this.unselectedResources[0];
			let resourceOptions = this.unselectedResources.slice(0);
			resourceOptions.unshift(resource.name);

			resourceComponents.push(
				<FilterResource
					key={uuid()}
					index={resourceIndex}
					resources={resourceOptions}
					selectedResource={resource.name}
					handleDelete={this.handleDeleteResource}
					handleMaxChange={() => { return false; }}
					handleMinChange={() => { return false; }}
					handleResourceChange={this.handleResourceChange}
				/>
			);

		});

		let addButton: any = null;
		if (this.state.roomFilters.resources.length < this.allResources.length)
			addButton = <button className="btn btn-primary" onClick={() => { this.addResourceFunction(); }}>Add Resource</button>;

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
		this.setState(state => ({
			roomFilters: {
				...this.state.roomFilters,
				resources: state.roomFilters.resources.concat({ name: this.unselectedResources[0] })
			}
		}));
	}

	handleDeleteResource = (index: number) => {
		let newResourceState = this.state.roomFilters.resources.slice(0); // clones the resources array
		newResourceState.splice(index, 1);
		this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } });

		// HACK: disable adding resource
		if (newResourceState.length < 1)
			this.addResourceFunction = () => { return; };
	}

}

export default RoomFilter;