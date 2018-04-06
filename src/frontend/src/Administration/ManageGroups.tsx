import * as React from 'react';
import { UserGroupsSelector } from './UserGroupsSelector';
import { GroupEditor } from './GroupEditor';
const uuid = require('uuid/v4');
const request = require('superagent');

export interface Group {
	dbName: string;
	name: string;
	description: string;
	crns: string[];
}

interface Props {
	handleShowAlert: Function;
}

interface State {
	groups: Group[];
	selectedGroupIndex: number;
	selectedCRNIndex: number;
}

export class ManageGroups extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			groups: [],
			selectedGroupIndex: -1,
			selectedCRNIndex: -1
		};
	}

	componentWillMount() {
		this.getGroupsFromDB();
	}

	render() {
		let groupOptions = this.state.groups.map((group, index) => {
			return (<option key={uuid()} value={index}>{group.name}</option>);
		});

		let selectedGroup = this.getSelectedGroup();

		let groupEditor = null;
		if (selectedGroup)
			groupEditor = (
				<div>
					<hr />
					<GroupEditor
						group={selectedGroup}
						index={this.state.selectedGroupIndex}
						selectedCRNIndex={this.state.selectedCRNIndex}
						handleChangeGroupName={this.handleChangeGroupName}
						handleDeleteGroup={this.handleDeleteGroup}
						handleChangeGroupDescription={this.handleChangeGroupDescription}
						handleChangeCRN={this.handleChangeCRN}
						handleAddCRN={this.handleAddCRN}
						handleDeleteCRN={this.handleDeleteCRN}
						handleChangeSelectedCRNIndex={this.handleChangeSelectedCRNIndex}
					/>
				</div>
			);

		return (
			<div>
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<span className="card-title" style={{ fontSize: '1.5em' }}>Manage Groups</span>
						<button className="btn btn-primary float-right" onClick={this.handleAddGroup}>
							Add Group &nbsp;&nbsp;
							<span className="plusIcon oi oi-size-sm oi-plus" style={{ top: '-1px' }} />
						</button>
						<hr />
						{this.state.groups.length < 1 && 'No Groups'}
						{
							this.state.groups.length > 0 &&
							<div className="form-group row">
								<label className="col-lg-4 col-form-label text-left">Group:</label>
								<div className="col-lg-8">
									<select
										className="form-control"
										value={this.state.selectedGroupIndex}
										onChange={this.handleSelectedGroupChange}
									>
										{groupOptions}
									</select>
								</div>
							</div>
						}
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

	getGroupsFromDB = (resetIndex: number = 0) => {
		request.get('/api/groups').end((error: {}, res: any) => {
			if (res && res.body) {
				let groups = this.parseGroups(res.body);

				if (groups.length > 0)
					this.setState({ groups: groups, selectedGroupIndex: resetIndex });
				else
					this.setState({ groups: groups });
			} else
				this.props.handleShowAlert('error', 'Error getting group data.');
		});
	}

	parseGroups = (dbGroups: any[]): Group[] => {
		let groups: Group[] = [];
		dbGroups.forEach(dbGroup => {
			let group: Group = {
				dbName: dbGroup.GroupName,
				name: dbGroup.GroupName,
				description: dbGroup.Description,
				crns: dbGroup.CRNs
			};
			groups.push(group);
		});

		return groups;
	}

	// Handle Selections //////////////////////////////////////////////////////////////////////////////////////////////////////

	handleSelectedGroupChange = (event: any) => {
		event.preventDefault();

		if (!this.doValidityChecks())
			return;

		let groupIndex = event.target.value;
		this.setState({ selectedGroupIndex: groupIndex });
	}

	getSelectedGroup = () => {
		return this.state.groups.slice(0)[this.state.selectedGroupIndex];
	}

	// Handle Changes ////////////////////////////////////////////////////////////////////////////////////////////////////

	handleChangeGroupName = (event: any, index: number) => {
		if (event.target.value.length <= 60) {
			let groups = this.state.groups.slice(0);
			groups[index].name = event.target.value;
			this.setState({ groups: groups });
		}
	}

	handleAddGroup = () => {
		if (!this.doValidityChecks())
			return;

		let newGroupCount = 0;
		this.state.groups.forEach(group => {
			if (group.name.substr(0, 9) === 'New Group')
				newGroupCount++;
		});

		let newGroup: Group = {
			dbName: ('New Group ' + ((newGroupCount === 0) ? '' : newGroupCount)).trim(),
			name: ('New Group ' + ((newGroupCount === 0) ? '' : newGroupCount)).trim(),
			description: '',
			crns: []
		};
		let groups = this.state.groups.slice(0);
		groups.push(newGroup);

		this.setState({ groups: groups, selectedGroupIndex: groups.length - 1 });
	}

	handleDeleteGroup = (index: number) => {
		if (!confirm('Are you sure you want to delete this group?'))
			return;

		let groups = this.state.groups.slice(0);
		groups.splice(index, 1);

		this.setState({ groups: groups, selectedGroupIndex: 0 });
	}

	handleChangeGroupDescription = (event: any, index: number) => {
		if (event.target.value.length <= 300) {
			let groups = this.state.groups.slice(0);
			groups[index].description = event.target.value;
			this.setState({ groups: groups });
		}
	}

	handleChangeCRN = (event: any, groupIndex: number, crnIndex: number) => {
		if (event.target.value.length <= 5) {
			let groups = this.state.groups.slice(0);
			groups[groupIndex].crns[crnIndex] = event.target.value;
			this.setState({ groups: groups });
		}
	}

	handleAddCRN = (groupIndex: number) => {
		let groups = this.state.groups.slice(0);
		groups[groupIndex].crns.push('');
		this.setState({ groups: groups });
	}

	handleDeleteCRN = (groupIndex: number, crnIndex: number) => {
		if (!confirm('Are you sure you want to remove this CRN?'))
			return;

		let groups = this.state.groups.slice(0);
		groups[groupIndex].crns.splice(crnIndex, 1);
		this.setState({ groups: groups });
	}

	handleChangeSelectedCRNIndex = (crnIndex: number) => {
		if (this.state.selectedCRNIndex !== crnIndex)
			this.setState({ selectedCRNIndex: crnIndex });
	}

	// Persist Changes ////////////////////////////////////////////////////////////////////////////////////////////////////

	handlePersistChanges = () => {
		if (!this.doValidityChecks())
			return;

		let getGroupsFromDB: Promise<Group[]> = new Promise((resolve, reject) => {
			request.get('/api/groups').end((error: {}, res: any) => {
				if (res && res.body)
					resolve(this.parseGroups(res.body));
				else
					reject();
			});
		});

		getGroupsFromDB.then((dbGroups) => {
			let groupNamesToDelete = this.getGroupNamesNotInState(dbGroups);
			let groupsToCreateInDB = this.getGroupsNotInDB(dbGroups);
			let groupsNotCreatedInDB = this.filterIdenticalGroups(this.state.groups, groupsToCreateInDB);
			let groupsToUpdateInDB = this.filterIdenticalGroups(groupsNotCreatedInDB, dbGroups);

			console.log('To Delete: ');
			console.log(groupNamesToDelete);
			console.log('To Create: ');
			console.log(groupsToCreateInDB);
			console.log('To Update: ');
			console.log(groupsToUpdateInDB);

			let persistToDBPromises = [
				this.deleteGroupsFromDB(groupNamesToDelete),
				this.createGroupsInDB(groupsToCreateInDB),
				this.updateGroupsInDB(groupsToUpdateInDB)
			];

			Promise.all(persistToDBPromises).then(() => {
				this.props.handleShowAlert('success', 'Successfully submitted data!');
				this.resetDBNames();
			}).catch(() => {
				this.props.handleShowAlert('error', 'Error submitting data.');
			});
		}).catch(() => {
			this.props.handleShowAlert('error', 'Error submitting data.');
		});
	}

	getGroupNamesNotInState = (groups: Group[]): string[] => {
		let groupsNotInState = groups.filter(group => {
			return !this.state.groups.map(stateGroup => {
				return stateGroup.dbName;
			}).includes(group.dbName);
		});

		return groupsNotInState.map(group => {
			return group.dbName;
		});
	}

	getGroupsNotInDB = (dbGroups: Group[]): Group[] => {
		let groupsNotInDB = this.state.groups.filter(stateGroup => {
			return !dbGroups.map(dbGroup => {
				return dbGroup.dbName;
			}).includes(stateGroup.dbName);
		});

		return groupsNotInDB;
	}

	filterIdenticalGroups = (groups: Group[], filterGroups: Group[]): Group[] => {
		return groups.filter(stateGroup => {
			let isIdentical = false;
			filterGroups.forEach(dbGroup => {
				if (dbGroup.crns.join(' ') === stateGroup.crns.join(' ') &&
					dbGroup.dbName === stateGroup.dbName &&
					dbGroup.name === stateGroup.name &&
					dbGroup.description === stateGroup.description)
					isIdentical = true;
			});

			return !isIdentical;
		});
	}

	deleteGroupsFromDB = (groupNames: string[]) => {
		return new Promise((resolve, reject) => {
			if (groupNames.length <= 0) {
				resolve();
				return;
			}

			let queryData = {
				where: {
					GroupName: groupNames
				}
			};
			let queryDataString = JSON.stringify(queryData);

			request.delete('/api/groups').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	createGroupsInDB = (groups: Group[]) => {
		return new Promise((resolve, reject) => {
			if (groups.length <= 0) {
				resolve();
				return;
			}

			let queryData: {}[] = groups.map(group => {
				return {
					insertValues: {
						GroupName: group.name,
						Description: group.description
					},
					CRNs: group.crns
				};
			});

			let queryDataString = JSON.stringify(queryData);

			request.put('/api/groups').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	updateGroupsInDB = (groups: Group[]) => {
		return new Promise((resolve, reject) => {
			if (groups.length <= 0) {
				resolve();
				return;
			}

			let queryData: {}[] = groups.map(group => {
				return {
					setValues: {
						GroupName: group.name,
						Description: group.description
					},
					CRNs: group.crns,
					where: {
						GroupName: group.dbName
					}
				};
			});

			let queryDataString = JSON.stringify(queryData);

			request.post('/api/groups').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}

	// Utilities //////////////////////////////////////////////////////////////////////////////////////////////////////////

	doValidityChecks(): boolean {
		if (!this.crnsAreValid()) {
			alert('All CRNs must be exactly five characters long. Please review all CRNs before continuing.');
			return false;
		}
		if (this.groupNameIsTaken()) {
			alert('The group name you\'ve chosen is already being used. Please enter a valid group name before continuing.');
			return false;
		}
		if (this.duplicateCRNsPresent()) {
			alert('There are duplicate CRNs listed for the current group. Please ensure there are no duplicates before continuing.');
			return false;
		}
		if (this.groupNameIsEmpty()) {
			alert('The current group name is empty. Please enter a valid group name before continuing.');
			return false;
		}

		return true;
	}

	crnsAreValid = () => {
		let selectedGroup: Group | undefined = this.getSelectedGroup();

		let crnsAreValid = true;
		if (selectedGroup)
			selectedGroup.crns.forEach(crn => {
				if (crn.length !== 5)
					crnsAreValid = false;
			});

		return crnsAreValid;
	}

	duplicateCRNsPresent = () => {
		let selectedGroup: Group | undefined = this.getSelectedGroup();
		let duplicatesPresent = false;

		if (selectedGroup) {
			let crnSet: Set<string> = new Set(selectedGroup.crns);
			if (crnSet.size !== selectedGroup.crns.length)
				duplicatesPresent = true;
		}

		return duplicatesPresent;
	}

	atLeastOneCRN = () => {
		let selectedGroup: Group | undefined = this.getSelectedGroup();

		if (selectedGroup)
			return selectedGroup.crns.length > 0;

		return false;
	}

	groupNameIsTaken = (): boolean => {
		let selectedGroup: Group = this.getSelectedGroup();
		let groupNameIsTaken: boolean = false;
		this.state.groups.forEach((group, index) => {
			if (group.name === selectedGroup.name && Number(index) !== Number(this.state.selectedGroupIndex))
				groupNameIsTaken = true;
		});

		return groupNameIsTaken;
	}

	groupNameIsEmpty = (): boolean => {
		let selectedGroup: Group = this.getSelectedGroup();
		return selectedGroup.name === '';
	}

	resetDBNames = () => {
		let resetGroups: Group[] = this.state.groups.map(group => {
			return {
				dbName: group.name,
				name: group.name,
				description: group.description,
				crns: group.crns
			};
		});

		this.setState({ groups: resetGroups });
	}
}

export default ManageGroups;