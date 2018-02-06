import * as React from 'react';
const uuid = require('uuid/v4');

interface Props {
	index: number;
	resources: string[];
	selectedResource: string;
	handleResourceChange: Function;
	handleMinChange: Function;
	handleDelete: Function;
	isEnumerable: boolean;
	min?: number;
}

// interface State {
// 	min: number;
// 	max: number;
// }

export class FilterResource extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);

		this.state = { min: 0, max: 1000 };
	}

	render() {
		const resourceOptions = this.props.resources.map(resource => {
			return (<option key={uuid()} value={resource}>{resource}</option>);
		});

		let minInput = (
			<label>
				At Least:
				<input type="number" value={this.props.min} onChange={(e) => this.props.handleMinChange(e, this.props.index)} />
			</label>
		);

		if (!this.props.isEnumerable)
			minInput = <span />;

		return (
			<div>
				<select value={this.props.selectedResource} onChange={(event) => this.props.handleResourceChange(event, this.props.index)}>
					{resourceOptions}
				</select>
				{minInput}
				<button className="btn btn-danger" onClick={() => this.props.handleDelete(this.props.index)}>X</button>
				<br />
			</div>
		);
	}
}

export default FilterResource;