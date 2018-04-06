import * as React from 'react';
import { UserGroupsSelector } from './UserGroupsSelector';
const uuid = require('uuid/v4');
const request = require('superagent');

export interface Group {
	name: string;
	description: string;
}

export interface User {
	cwid: string;
	name: string;
	groups: Group[];
}

interface Props {
	handleShowAlert: Function;
	userRole: 'student' | 'instructor';
}

interface State {
	users: User[];
	groups: Group[];
	selectedUserCWID: string;
	loading: boolean;
}

export class ManageUsers extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			users: [],
			groups: [],
			selectedUserCWID: '',
			loading: true
		};
	}

	componentWillMount() {
		this.getUsersFromDB();
		this.getGroupsFromDB();
	}

	render() {
		if (this.state.loading)
			return null;

		let userOptions = this.state.users.map(inst => {
			return (<option key={uuid()} value={inst.cwid}>{inst.name}</option>);
		});

		let selectedUser = this.getSelectedUser();

		let userGroupsSelector = null;
		if (selectedUser)
			userGroupsSelector = (
				<UserGroupsSelector
					user={selectedUser}
					allPossibleGroups={this.state.groups}
					handleChangeGroups={this.handleChangeGroups}
					handleAddGroup={this.handleAddGroup}
					handleDeleteGroup={this.handleDeleteGroup}
					userRole={this.props.userRole}
				/>
			);

		let titeText = this.props.userRole === 'instructor' ? 'Manage Instructor Rights' : 'Manage Student Classes';
		let labelText = this.props.userRole === 'instructor' ? 'Instructor:' : 'Student:';

		return (
			<div>
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<h4 className="card-title">{titeText}</h4>
						<hr />
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">{labelText}</label>
							<div className="col-lg-8">
								<select
									className="form-control"
									value={this.state.selectedUserCWID}
									onChange={this.handleSelectedUserChange}
								>
									{userOptions}
								</select>
							</div>
						</div>
						<hr />
						{userGroupsSelector}
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
	getUsersFromDB = () => {
		let queryData: {} = {
			where: {
				UserRole: this.props.userRole
			}
		};

		let queryDataString: string = JSON.stringify(queryData);
		request.get('/api/users').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body)
				this.parseUsers(res.body);
			else
				this.props.handleShowAlert('error', 'Error getting user data.');
		});
	}

	parseUsers = (dBusers: any[]) => {
		let users: User[] = [];

		dBusers.forEach(dBinst => {
			let groups: Group[] = [];
			let dBGroups = Object.keys(dBinst.Groups);
			dBGroups.forEach((dBGroupKey: any) => {
				let dBGroup = dBinst.Groups[dBGroupKey];
				let group: Group = {
					name: dBGroup.Name,
					description: dBGroup.Description
				};
				groups.push(group);
			});

			let user: User = {
				cwid: dBinst.CWID,
				name: dBinst.FirstName + ' ' + dBinst.LastName,
				groups: groups
			};
			users.push(user);
		});

		let cwid = '';
		if (users[0])
			cwid = users[0].cwid.toString();

		this.setState({ users: users, selectedUserCWID: cwid, loading: false });
	}

	getGroupsFromDB = () => {
		request.get('/api/groups').end((error: {}, res: any) => {
			if (res && res.body)
				this.parseGroups(res.body);
			else
				this.props.handleShowAlert('error', 'Error getting group data.');
		});
	}

	parseGroups = (dbGroups: any[]) => {
		let groups: Group[] = [];
		dbGroups.forEach(dbGroup => {
			let group: Group = {
				name: dbGroup.GroupName,
				description: dbGroup.Description
			};
			groups.push(group);
		});

		this.setState({ groups: groups });
	}

	// Handle Selections //////////////////////////////////////////////////////////////////////////////////////////////////////
	handleSelectedUserChange = (event: any) => {
		event.preventDefault();
		let userCWID = event.target.value;

		this.setState({ selectedUserCWID: userCWID });
	}

	handleChangeGroups = (event: any, index: number) => {
		let groupName = event.target.value;
		let selectedGroup = this.state.groups.find(group => {
			return groupName === group.name;
		});
		let user = this.getSelectedUser();
		let users = this.state.users;
		if (user && selectedGroup) {
			user.groups[index] = selectedGroup;
			users[this.getSelectedUserIndex()] = user;
			this.setState({ users: users });
		}
	}

	handleAddGroup = () => {
		let user = this.getSelectedUser();
		let users = this.state.users;
		let unselectedGroups = this.state.groups.filter(group => {
			let selected = true;
			if (user)
				user.groups.forEach(selectedGroup => {
					if (selectedGroup.name === group.name)
						selected = false;
				});

			return selected;
		});

		if (user && unselectedGroups.length > 0) {
			user.groups.push(unselectedGroups[0]);
			users[this.getSelectedUserIndex()] = user;
			this.setState({ users: users });
		}
	}

	handleDeleteGroup = (index: number) => {
		let user = this.getSelectedUser();
		let users = this.state.users;
		if (user) {
			user.groups.splice(index, 1);
			users[this.getSelectedUserIndex()] = user;
			this.setState({ users: users });
		}
	}

	getSelectedUser = () => {
		let selectedUser: User | undefined = this.state.users.find(inst => {
			return inst.cwid.toString() === this.state.selectedUserCWID;
		});

		return selectedUser;
	}

	getSelectedUserIndex = () => {
		let selectedUser: User | undefined = this.state.users.find(inst => {
			return inst.cwid === this.state.selectedUserCWID;
		});

		if (selectedUser)
			return this.state.users.indexOf(selectedUser);
		else
			return -1;
	}

	// Persist Changes ////////////////////////////////////////////////////////////////////////////////////////////////////
	handlePersistChanges = () => {
		this.deleteUserGroups().then(() => {

			let cwids: string[] = [];
			let groups: string[] = [];
			this.state.users.forEach(user => {
				user.groups.forEach(group => {
					cwids.push(user.cwid);
					groups.push(group.name);
				});
			});

			let queryData = {
				insertValues: {
					'CWID': cwids,
					'GroupName': groups,
				}
			};

			let queryDataString = JSON.stringify(queryData);
			request.put('/api/usergroups').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					this.props.handleShowAlert('success', 'Sucessfully submitted changes!');
				else
					this.props.handleShowAlert('error', 'Error submitting changes.');
			});

		}).catch(() => {
			this.props.handleShowAlert('error', 'Error submitting changes.');
		});
	}

	deleteUserGroups = (): Promise<any> => {
		let cwids = this.state.users.map(user => {
			return user.cwid;
		});

		let queryData: {} = {
			where: {
				CWID: cwids
			}
		};

		let queryDataString: string = JSON.stringify(queryData);

		return new Promise((resolve, reject) => {
			request.delete('/api/usergroups').set('queryData', queryDataString).end((error: {}, res: any) => {
				if (res && res.body)
					resolve();
				else
					reject();
			});
		});
	}
}

export default ManageUsers;