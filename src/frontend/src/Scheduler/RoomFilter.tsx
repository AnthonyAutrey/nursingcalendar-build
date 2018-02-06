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

	private allLocations: string[] = ['location 1', 'location 2'];
	private allResources: { name: string, enumerable: boolean }[] = [
		{ name: 'Manequinns', enumerable: true },
		{ name: 'Beds', enumerable: true },
		{ name: 'Audio/Video', enumerable: false },
		{ name: 'Clinical', enumerable: false },
		{ name: 'Robot', enumerable: true },
		{ name: 'Needle Station', enumerable: true }
	];
	private unselectedResources: string[] = this.getResourceNames();
	// HACK: godawful hack to prevent resource from being added when resources array is empty
	// and React decided to click 'add resource' button automatically
	private addResourceFunction: Function;

	constructor(props: Props, state: State) {

		super(props, {});

		this.state = {
			roomFilters: {
				searchText: '',
				capacity: { min: 0 },
				resources: []
			}
		};
		// TODO: Get all possible locations and resources on initialize
		this.addResourceFunction = this.handleAddResource;
	}

	// HACK: enable adding resource
	componentDidUpdate() {
		setTimeout(() => { this.addResourceFunction = this.handleAddResource; }, 200);
	}

	render() {
		this.unselectedResources = this.getResourceNames();
		this.state.roomFilters.resources.forEach(res => {
			if (this.unselectedResources.includes(res.name))
				this.unselectedResources.splice(this.unselectedResources.indexOf(res.name), 1);
		});
		this.unselectedResources.sort((a, b) => {
			if (a < b) return -1;
			if (a > b) return 1;
			return 0;
		});

		let locationOptions = this.allLocations.map(location => {
			return (<option key={uuid()} value={location}>{location}</option>);
		});

		locationOptions.unshift(<option key={uuid()} value={'any'}>Any</option>);

		let resourceComponents: any[] = [];

		this.state.roomFilters.resources.forEach(resource => {
			let resourceIndex = this.state.roomFilters.resources.indexOf(resource);
			let selected: string = this.unselectedResources[0];
			let resourceOptions = this.unselectedResources.slice(0);
			resourceOptions.unshift(resource.name);

			resourceComponents.push(
				<FilterResource
					key={resource.name}
					index={resourceIndex}
					resources={resourceOptions}
					selectedResource={resource.name}
					handleDelete={this.handleDeleteResource}
					handleMinChange={this.handleResourceMinChange}
					handleResourceChange={this.handleResourceChange}
					// min={resource.min}
					isEnumerable={this.resourceIsEnumerable(resource.name)}
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
					<select value={this.state.roomFilters.location} onChange={this.handleLocationChange}>
						{locationOptions}
					</select>
				</label>
				<br />
				<label>
					Capacity:
					<input type="number" value={this.state.roomFilters.capacity.min} onChange={this.handleCapacityMinChange} />
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
		event.preventDefault();
		this.setState({ roomFilters: { ...this.state.roomFilters, searchText: event.target.value } },
			() => { this.props.filterChangeHandler(this.state); });
	}

	handleLocationChange = (event: any) => {
		event.preventDefault();
		let location = event.target.value;
		if (location === 'any')
			location = null;
		this.setState({ roomFilters: { ...this.state.roomFilters, location: location } },
			() => { this.props.filterChangeHandler(this.state); });
	}

	handleCapacityMinChange = (event: any) => {
		event.preventDefault();

		this.setState({ roomFilters: { ...this.state.roomFilters, capacity: { ...this.state.roomFilters.capacity, min: event.target.value } } },
			() => { this.props.filterChangeHandler(this.state); });
	}

	// Resources ///////////////////////////////////////////////////////////////////////////////////////////////

	getResourceNames(): string[] {
		let resourceNames: string[] = this.allResources.map(res => {
			return res.name;
		});
		return resourceNames;
	}

	resourceIsEnumerable(name: string): boolean {
		let enumerable = true;

		this.allResources.forEach(resource => {
			if (resource.name === name)
				enumerable = resource.enumerable;
		});

		return enumerable;
	}

	handleResourceChange = (event: any, index: number) => {
		event.preventDefault();
		let newResourceState = this.state.roomFilters.resources.slice(0); // clones the resources array
		newResourceState[index].name = event.target.value;
		this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } },
			() => { this.props.filterChangeHandler(this.state); });
	}

	handleAddResource = () => {
		let enumerable = this.resourceIsEnumerable(this.unselectedResources[0]);
		let newResource: { name: string, min?: number } = { name: this.unselectedResources[0] };
		if (enumerable)
			newResource = { name: this.unselectedResources[0], min: 0 };

		this.setState(state => ({
			roomFilters: {
				...this.state.roomFilters,
				resources: state.roomFilters.resources.concat(newResource)
			}
		}), () => { this.props.filterChangeHandler(this.state); });
	}

	handleDeleteResource = (index: number) => {
		let newResourceState = this.state.roomFilters.resources.slice(0); // clones the resources array
		newResourceState.splice(index, 1);
		this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } },
			() => { this.props.filterChangeHandler(this.state); });

		// HACK: disable adding resource
		if (newResourceState.length < 1)
			this.addResourceFunction = () => { return; };
	}

	handleResourceMinChange = (event: any, index: number) => {
		event.preventDefault();

		let resources = this.state.roomFilters.resources.slice(0);
		resources[index].min = event.target.value;
		this.setState({ roomFilters: { ...this.state.roomFilters, resources: resources } },
			() => { this.props.filterChangeHandler(this.state); });
	}
}

export default RoomFilter;