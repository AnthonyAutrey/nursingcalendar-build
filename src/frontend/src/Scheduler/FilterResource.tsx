import * as React from 'react';
const uuid = require('uuid/v4');

interface Props {
	index: number;
	resources: string[];
	selectedResource: string;
	handleResourceChange: Function;
	handleMinChange: Function;
	handleMaxChange: Function;
	handleDelete: Function;
}

interface State {
	min: number;
	max: number;
}

export class FilterResource extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);

		this.state = { min: 0, max: 1000 };
	}

	render() {
		let resourceOptions = this.props.resources.map(resource => {
			return (<option key={uuid()} value={resource}>{resource}</option>);
		});

		return (
			<div>
				{/* TODO: Send the event along with this */}
				<select value={this.props.selectedResource} onChange={(event) => this.props.handleResourceChange(event, this.props.index)}>
					{resourceOptions}
				</select>
				<label>
					Min:
					<input type="number" value={this.state.min} onChange={this.props.handleMinChange(this.props.index)} />
				</label>
				<label>
					Max:
					<input type="number" value={this.state.max} onChange={this.props.handleMaxChange(this.props.index)} />
				</label>
				<button className="btn btn-danger" onClick={() => this.props.handleDelete(this.props.index)}>X</button>
				<br />
			</div>
		);
	}
}

export default FilterResource;