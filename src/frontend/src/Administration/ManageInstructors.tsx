import * as React from 'react';
import { InstructorGroupsSelector } from './InstructorGroupsSelector';
const uuid = require('uuid/v4');
const request = require('superagent');

export interface Group {
	name: string;
	description: string;
}

export interface Instructor {
	cwid: string;
	name: string;
	groups: Group[];
}

interface Props {
	handleShowAlert: Function;
}

interface State {
	instructors: Instructor[];
	groups: Group[];
	selectedInstructorCWID: string;
}

export class ManageInstructors extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			instructors: [],
			groups: [],
			selectedInstructorCWID: ''
		};
	}

	componentWillMount() {
		this.getInstructorsFromDB();
		this.getGroupsFromDB();
	}

	render() {
		let instructorOptions = this.state.instructors.map(inst => {
			return (<option key={uuid()} value={inst.cwid}>{inst.name}</option>);
		});

		let selectedInstructor = this.getSelectedInstructor();

		let instructorGroupsSelector = null;
		if (selectedInstructor)
			instructorGroupsSelector = (
				<InstructorGroupsSelector
					instructor={selectedInstructor}
					allPossibleGroups={this.state.groups}
					handleChangeGroups={this.handleChangeGroups}
					handleAddGroup={this.handleAddGroup}
					handleDeleteGroup={this.handleDeleteGroup}
				/>
			);

		return (
			<div className="col-lg-6 offset-lg-3">
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<h4 className="card-title">Manage Instructor Rights</h4>
						<hr />
						<div className="form-group row">
							<label className="col-lg-4 col-form-label text-left">Instructor:</label>
							<div className="col-lg-8">
								<select
									className="form-control"
									value={this.state.selectedInstructorCWID}
									onChange={this.handleSelectedInstructorChange}
								>
									{instructorOptions}
								</select>
							</div>
						</div>
						<hr />
						{instructorGroupsSelector}
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
	getInstructorsFromDB = () => {
		let queryData: {} = {
			where: {
				UserRole: 'instructor'
			}
		};

		let queryDataString: string = JSON.stringify(queryData);
		request.get('/api/users').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body)
				this.parseInstructors(res.body);
			else
				this.props.handleShowAlert('error', 'Error getting instructor data.');
		});
	}

	parseInstructors = (dBinstructors: any[]) => {
		let instructors: Instructor[] = [];

		dBinstructors.forEach(dBinst => {
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

			let instructor: Instructor = {
				cwid: dBinst.CWID,
				name: dBinst.FirstName + ' ' + dBinst.LastName,
				groups: groups
			};
			instructors.push(instructor);
		});

		let cwid = '';
		if (instructors[0])
			cwid = instructors[0].cwid.toString();

		this.setState({ instructors: instructors, selectedInstructorCWID: cwid });
	}

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
				description: dbGroup.Description
			};
			groups.push(group);
		});

		this.setState({ groups: groups });
	}

	// Handle Selections //////////////////////////////////////////////////////////////////////////////////////////////////////
	handleSelectedInstructorChange = (event: any) => {
		event.preventDefault();
		let instructorCWID = event.target.value;

		this.setState({ selectedInstructorCWID: instructorCWID });
	}

	handleChangeGroups = (event: any, index: number) => {
		let groupName = event.target.value;
		let selectedGroup = this.state.groups.find(group => {
			return groupName === group.name;
		});
		let instructor = this.getSelectedInstructor();
		let instructors = this.state.instructors;
		if (instructor && selectedGroup) {
			instructor.groups[index] = selectedGroup;
			instructors[this.getSelectedInstructorIndex()] = instructor;
			this.setState({ instructors: instructors });
		}
	}

	handleAddGroup = () => {
		let instructor = this.getSelectedInstructor();
		let instructors = this.state.instructors;
		let unselectedGroups = this.state.groups.filter(group => {
			let selected = true;
			if (instructor)
				instructor.groups.forEach(selectedGroup => {
					if (selectedGroup.name === group.name)
						selected = false;
				});

			return selected;
		});

		if (instructor && unselectedGroups.length > 0) {
			instructor.groups.push(unselectedGroups[0]);
			instructors[this.getSelectedInstructorIndex()] = instructor;
			this.setState({ instructors: instructors });
		}
	}

	handleDeleteGroup = (index: number) => {
		let instructor = this.getSelectedInstructor();
		let instructors = this.state.instructors;
		if (instructor) {
			instructor.groups.splice(index, 1);
			instructors[this.getSelectedInstructorIndex()] = instructor;
			this.setState({ instructors: instructors });
		}
	}

	getSelectedInstructor = () => {
		let selectedInstructor: Instructor | undefined = this.state.instructors.find(inst => {
			return inst.cwid.toString() === this.state.selectedInstructorCWID;
		});

		return selectedInstructor;
	}

	getSelectedInstructorIndex = () => {
		let selectedInstructor: Instructor | undefined = this.state.instructors.find(inst => {
			return inst.cwid === this.state.selectedInstructorCWID;
		});

		if (selectedInstructor)
			return this.state.instructors.indexOf(selectedInstructor);
		else
			return -1;
	}

	// Persist Changes ////////////////////////////////////////////////////////////////////////////////////////////////////
	handlePersistChanges = () => {
		this.deleteInstructorGroups().then(() => {

			let cwids: string[] = [];
			let groups: string[] = [];
			this.state.instructors.forEach(instructor => {
				instructor.groups.forEach(group => {
					cwids.push(instructor.cwid);
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

			// let insertPromises: Promise<any>[] = [];
			// this.state.instructors.forEach(instructor => {
			// 	instructor.groups.forEach(group => {
			// 		insertPromises.push(new Promise((resolve, reject) => {
			// 			let queryData = {
			// 				insertValues: {
			// 					'CWID': instructor.cwid,
			// 					'GroupName': group.name,
			// 				}
			// 			};
			// 			let queryDataString = JSON.stringify(queryData);
			// 			request.put('/api/usergroups').set('queryData', queryDataString).end((error: {}, res: any) => {
			// 				if (res && res.body)
			// 					resolve();
			// 				else
			// 					reject();
			// 			});
			// 		}));
			// 	});
			// });

			// Promise.all(insertPromises).then(() => {
			// 	this.props.handleShowAlert('success', 'Sucessfully submitted changes!');
			// }).catch(() => {
			// 	this.props.handleShowAlert('error', 'Error submitting changes.');
			// });

		}).catch(() => {
			this.props.handleShowAlert('error', 'Error submitting changes.');
		});
	}

	deleteInstructorGroups = (): Promise<any> => {
		let cwids = this.state.instructors.map(instructor => {
			return instructor.cwid;
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

export default ManageInstructors;