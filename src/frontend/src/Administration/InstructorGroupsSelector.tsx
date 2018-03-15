import * as React from 'react';
import { Instructor, Group } from './ManageInstructors';
import { InstructorGroup } from './InstructorGroup';
const uuid = require('uuid/v4');

interface Props {
	instructor: Instructor;
	allPossibleGroups: Group[];
	handleChangeGroups: Function;
	handleAddGroup: Function;
	handleDeleteGroup: Function;
}

interface State {

}

export class InstructorGroupsSelector extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
	}

	render() {

		let unselectedGroups = this.props.allPossibleGroups.filter(group => {
			let unselected = true;
			this.props.instructor.groups.forEach(selectedGroup => {
				if (selectedGroup.name === group.name)
					unselected = false;
			});
			return unselected;
		});

		let selectedGroups: Group[] = [];

		let selectors = this.props.instructor.groups.map((group, index) => {
			let groupOptions = unselectedGroups.map(g => {
				return g.name;
			});
			groupOptions.unshift(group.name);

			selectedGroups.push(group);
			unselectedGroups = unselectedGroups.filter(unselectedGroup => {
				return !selectedGroups.includes(unselectedGroup);
			});

			return (
				<InstructorGroup
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
		if (this.props.instructor.groups.length < this.props.allPossibleGroups.length)
			addButton = (
				<span className="addButton btn btn-primary cursor-p float-right" onClick={() => this.props.handleAddGroup()}>
					Add Group &nbsp;&nbsp;
					<span className="plusIcon oi oi-size-sm oi-plus" />
				</span>
			);

		return (
			<div className="form-group row">
				<label className="col-lg-4 col-form-label text-left">Schedulable Groups:</label>
				<div className="col-lg-8">
					{selectors}
					{addButton}
				</div>
			</div>
		);
	}
}

export default InstructorGroupsSelector;