import * as React from 'react';
const uuid = require('uuid/v4');
const classNames = require('classnames');

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
			<input
				className="form-control"
				type="number"
				value={this.props.min}
				placeholder="min"
				onChange={(e) => this.props.handleMinChange(e, this.props.index)}
			/>
		);

		let selectClass = classNames('col-lg-7');
		let minInputClass = classNames('col-lg-3 mx-0 px-0');
		if (!this.props.isEnumerable) {
			minInput = <span />;
			selectClass = classNames('col-lg-10 mr-0 pr-0');
			minInputClass = classNames('');
		}

		return (
			<div className="form-group row">
				<div className={selectClass}>
					<select
						className="form-control mx-0 px-0"
						value={this.props.selectedResource}
						onChange={(event) => this.props.handleResourceChange(event, this.props.index)}
					>
						{resourceOptions}
					</select>
				</div>
				<div className={minInputClass}>
					{minInput}
				</div>
				<div className="col-lg-2">
					<button className="btn btn-danger" onClick={() => this.props.handleDelete(this.props.index)}>X</button>
				</div>
			</div>
		);
	}
}

export default FilterResource;