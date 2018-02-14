import * as React from 'react';
const uuid = require('uuid/v4');

interface Props {
	index: number;
	selected: string;
	options: string[];
	handleGroupChange: Function;
	handleDelete: Function;
}

interface State {
	selected: string;
}

export class EventGroupSelector extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			selected: this.props.selected
		};
	}

	render() {
		let groupOptions = this.props.options.map(groupOption => {
			return (<option key={uuid()} value={groupOption}>{groupOption}</option>);
		});

		return (
			<div className="container-fluid p-0 m-0">
				<div className="d-flex p-0 m-0">
					<div className="form-group w-100 mr-2 p-0">
						<select
							value={this.state.selected}
							onChange={(e) => this.props.handleGroupChange(this.props.index, e)}
							className="form-control"
						>
							{groupOptions}
						</select>
					</div>
					<div className="ml-auto mr-0">
						<button className="btn btn-danger float-right" onClick={() => this.props.handleDelete(this.props.index)}>&#10006;</button>
					</div>
				</div>
			</div>
		);
	}
}

export default EventGroupSelector;