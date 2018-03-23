import * as React from 'react';
import { User, Group } from './ManageUsers';
import { UserGroup } from './UserGroup';
const uuid = require('uuid/v4');

interface Props {
	user: User;
	allPossibleGroups: Group[];
	handleChangeGroups: Function;
	handleAddGroup: Function;
	handleDeleteGroup: Function;
	userRole: 'student' | 'instructor';
}

export class UserGroupsSelector extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {

		let unselectedGroups = this.props.allPossibleGroups.filter(group => {
			let unselected = true;
			this.props.user.groups.forEach(selectedGroup => {
				if (selectedGroup.name === group.name)
					unselected = false;
			});
			return unselected;
		});

		let selectedGroups: Group[] = [];

		let selectors = this.props.user.groups.map((group, index) => {
			let groupOptions = unselectedGroups.map(g => {
				return g.name;
			});
			groupOptions.unshift(group.name);

			selectedGroups.push(group);
			unselectedGroups = unselectedGroups.filter(unselectedGroup => {
				return !selectedGroups.includes(unselectedGroup);
			});

			return (
				<UserGroup
					key={uuid()}
					index={index}
					groups={groupOptions}
					selectedGroup={group.name}
					handleChangeGroup={this.props.handleChangeGroups}
					handleDelete={this.props.handleDeleteGroup}
				/>
			);
		});

		let addButton = null;
		if (this.props.user.groups.length < this.props.allPossibleGroups.length)
			addButton = (
				<span className="addButton btn btn-primary cursor-p float-right" onClick={() => this.props.handleAddGroup()}>
					Add Group &nbsp;&nbsp;
					<span className="plusIcon oi oi-size-sm oi-plus" />
				</span>
			);

		let labelText = this.props.userRole === 'instructor' ? 'Schedulable Groups:' : 'Viewable Groups:';

		return (
			<div className="form-group row">
				<label className="col-lg-4 col-form-label text-left">{labelText}</label>
				<div className="col-lg-8">
					{selectors}
					{addButton}
				</div>
			</div>
		);
	}
}

export default UserGroupsSelector;