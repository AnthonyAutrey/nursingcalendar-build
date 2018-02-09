import * as React from 'react';
import { RoomFilters } from './Scheduler';
import { FilterResource } from './FilterResource';
import './scheduler.css';
const uuid = require('uuid/v4');
const request = require('superagent');

interface Props {
	filterChangeHandler: Function;
}

interface State {
	roomFilters: RoomFilters;
	open: boolean;
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
	private roomFilter: any;

	constructor(props: Props, state: State) {

		super(props, {});

		this.state = {
			roomFilters: {
				searchText: '',
				capacity: { min: 0 },
				resources: []
			},
			open: false
		};
		// TODO: Get all possible locations and resources on initialize
		this.initializeOptions();

		this.addResourceFunction = this.handleAddResource;
	}

	componentWillMount() {
		document.addEventListener('mousedown', this.handleClick, false);
	}

	componentWillUnMount() {
		document.removeEventListener('mousedown', this.handleClick, false);
	}

	// HACK: enable adding resource
	componentDidUpdate() {
		setTimeout(() => { this.addResourceFunction = this.handleAddResource; }, 200);
	}

	handleClick = (e: any) => {
		if (this.roomFilter && this.roomFilter.contains(e.target))
			return;
		else
			this.closeComponent();
	}

	closeComponent = () => {
		this.setState({ open: false });
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
					min={resource.min}
					isEnumerable={this.resourceIsEnumerable(resource.name)}
				/>
			);

		});

		let addButton: any = null;
		if (this.state.roomFilters.resources.length < this.allResources.length)
			addButton = (
				<a
					href="#"
					className="addButton btn btn-primary w-100"
					onClick={() => { this.addResourceFunction(); }}
				>
					Add Resource &nbsp;&nbsp;
					<span className="plusIcon oi oi-size-sm oi-plus" />
				</a>
			);

		let extraFilters = (
			<div>
				<div className="form-group row">
					<label className="col-lg-4 col-form-label">Location:</label>
					<div className="col-lg-8">
						<select className="form-control" value={this.state.roomFilters.location} onChange={this.handleLocationChange}>
							{locationOptions}
						</select>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-lg-4 col-form-label">Capacity:</label>
					<div className="col-lg-8">
						<input className="form-control" type="number" value={this.state.roomFilters.capacity.min} onChange={this.handleCapacityMinChange} />
					</div>
				</div>
				<div className="form-group row">
					<label className="col-lg-4 col-form-label">Resources:</label>
					<div className="col-lg-8">
						{addButton}
					</div>
				</div>
				{resourceComponents}
			</div>
		);

		if (!this.state.open)
			extraFilters = <span />;

		return (
			<div className="pb-1" ref={(roomFilter) => { this.roomFilter = roomFilter; }}>
				<div className="form-group">
					<div className="input-group">
						<input
							className="form-control border-right-0"
							type="text"
							placeholder="Search Rooms"
							value={this.state.roomFilters.searchText}
							onClick={() => { this.setState({ open: true }); }}
							onChange={this.handleSearchTextChange}
						/>
						<div className="input-group-append" id="basic-addon2" >
							<span className="input-group-text bg-white border-left-0"><i className="oi oi-magnifying-glass" /></span>
						</div>
					</div>
				</div>
				{extraFilters}
			</div>
		);
	}

	initializeOptions = () => {
		let getDataPromises: Promise<any>[] = [];

		getDataPromises.push(new Promise((resolve: Function, reject: Function) => {
			request.get('/api/locations').end((error: {}, res: any) => {
				if (res && res.body)
					resolve(res.body);
				else
					reject();
			});
		}));

		getDataPromises.push(new Promise((resolve: Function, reject: Function) => {
			request.get('/api/resources').end((error: {}, res: any) => {
				if (res && res.body)
					resolve(res.body);
				else
					reject();
			});
		}));

		Promise.all(getDataPromises).then((data: any[][]) => {
			this.allLocations = data[0].map(loc => { return loc.LocationName; });
			this.allResources = data[1].map(resource => {
				let isEnumberable: boolean = (Boolean)(+resource.IsEnumerable);
				return {
					name: resource.ResourceName,
					enumerable: isEnumberable
				};
			});
		});
	}

	handleSearchTextChange = (event: any) => {
		event.preventDefault();
		this.setState({ roomFilters: { ...this.state.roomFilters, searchText: event.target.value } },
			() => { this.props.filterChangeHandler(this.state.roomFilters); });
	}

	handleLocationChange = (event: any) => {
		event.preventDefault();
		let location = event.target.value;
		if (location === 'any')
			location = null;
		this.setState({ roomFilters: { ...this.state.roomFilters, location: location } },
			() => { this.props.filterChangeHandler(this.state.roomFilters); });
	}

	handleCapacityMinChange = (event: any) => {
		event.preventDefault();

		this.setState({ roomFilters: { ...this.state.roomFilters, capacity: { ...this.state.roomFilters.capacity, min: event.target.value } } },
			() => { this.props.filterChangeHandler(this.state.roomFilters); });
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
		if (this.resourceIsEnumerable(newResourceState[index].name))
			newResourceState[index].min = 1;
		this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } },
			() => { this.props.filterChangeHandler(this.state.roomFilters); });
	}

	handleAddResource = () => {
		let enumerable = this.resourceIsEnumerable(this.unselectedResources[0]);
		let newResource: { name: string, min?: number } = { name: this.unselectedResources[0] };
		if (enumerable)
			newResource = { name: this.unselectedResources[0], min: 1 };

		this.setState(state => ({
			roomFilters: {
				...this.state.roomFilters,
				resources: state.roomFilters.resources.concat(newResource)
			}
		}), () => { this.props.filterChangeHandler(this.state.roomFilters); });
	}

	handleDeleteResource = (index: number) => {
		let newResourceState = this.state.roomFilters.resources.slice(0); // clones the resources array
		newResourceState.splice(index, 1);
		this.setState({ roomFilters: { ...this.state.roomFilters, resources: newResourceState } },
			() => { this.props.filterChangeHandler(this.state.roomFilters); });

		// HACK: disable adding resource
		if (newResourceState.length < 1)
			this.addResourceFunction = () => { return; };
	}

	handleResourceMinChange = (event: any, index: number) => {
		event.preventDefault();

		let resources = this.state.roomFilters.resources.slice(0);
		resources[index].min = event.target.value;
		this.setState({ roomFilters: { ...this.state.roomFilters, resources: resources } },
			() => { this.props.filterChangeHandler(this.state.roomFilters); });
	}
}

export default RoomFilter;