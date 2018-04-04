import * as React from 'react';
import { UserGroupsSelector } from './UserGroupsSelector';
import { GroupEditor } from './GroupEditor';
const uuid = require('uuid/v4');
const request = require('superagent');

export interface Group {
	name: string;
	description: string;
	crns: string[];
}

interface Props {
	handleShowAlert: Function;
}

interface State {
	groups: Group[];
	selectedGroupName: string;
	loading: boolean;
}

export class ManageGroups extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			groups: [],
			selectedGroupName: '',
			loading: false // TODO: set to true by default, then false when data is loaded
		};
	}

	componentWillMount() {
		this.getGroupsFromDB();
	}

	render() {
		if (this.state.loading)
			return null;

		let groupOptions = this.state.groups.map(group => {
			return (<option key={uuid()} value={group.name}>{group.name}</option>);
		});

		let selectedGroup = this.getSelectedGroup();

		let groupEditor = null;
		if (selectedGroup)
			groupEditor = (
				<GroupEditor
				/>
			);

		return (
			<div>
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<h4 className="card-title">Manage Groups</h4>
						<hr />
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Group:</label>
							<div className="col-lg-8">
								<select
									className="form-control"
									value={this.state.selectedGroupName}
									onChange={this.handleSelectedGroupChange}
								>
									{groupOptions}
								</select>
							</div>
						</div>
						<hr />
						{groupEditor}
						<hr />
						<div className="row">
							<button tabIndex={3} className="btn btn-primary btn-block mx-2 mt-2" onClick={() => this.handlePersistChanges()}>
								Submit Changes
							</button>
						</div>
					</div>
				</div>
				<hr />
			</div>
		);
	}

	// Data Retrieval ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	getGroupsFromDB = () => {
		request.get('/api/groups').end((error: {}, res: any) => {
			if (res && res.body)
				this.parseGroups(res.body);
			else
				this.props.handleShowAlert('error', 'Error getting class data.');
		});
	}

	parseGroups = (dbGroups: any[]) => {
		let groups: Group[] = [];
		dbGroups.forEach(dbGroup => {
			let group: Group = {
				name: dbGroup.GroupName,
				description: dbGroup.Description,
				crns: []
			};
			groups.push(group);
		});

		if (groups.length > 0)
			this.setState({ groups: groups, selectedGroupName: groups[0].name });
		else
			this.setState({ groups: groups });
	}

	// Handle Selections //////////////////////////////////////////////////////////////////////////////////////////////////////
	
	handleSelectedGroupChange = (event: any) => {
		event.preventDefault();
		let groupName = event.target.value;

		this.setState({ selectedGroupName: groupName });
	}

	getSelectedGroup = () => {
		let selectedGroup: Group | undefined = this.state.groups.find(group => {
			return group.name === this.state.selectedGroupName;
		});

		return selectedGroup;
	}

	// Persist Changes ////////////////////////////////////////////////////////////////////////////////////////////////////

	handlePersistChanges = () => {
		return false;
	}

}

export default ManageGroups;