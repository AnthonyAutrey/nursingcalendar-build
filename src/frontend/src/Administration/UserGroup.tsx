import * as React from 'react';
const uuid = require('uuid/v4');

interface Props {
	index: number;
	groups: string[];
	selectedGroup: string;
	handleChangeGroup: Function;
	handleDelete: Function;
}

export class UserGroup extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {
		let groupOptions = this.props.groups.map(group => {
			return (<option key={uuid()} value={group}>{group}</option>);
		});

		return (
			<div className="d-flex mb-3">
				<select
					key={uuid()}
					className="form-control"
					value={this.props.selectedGroup}
					onChange={(event) => this.props.handleChangeGroup(event, this.props.index)}
				>
					{groupOptions}
				</select>
				<button className="btn btn-danger ml-2" onClick={() => this.props.handleDelete(this.props.index)}>&#10006;</button>
			</div>
		);
	}
}

export default UserGroup;