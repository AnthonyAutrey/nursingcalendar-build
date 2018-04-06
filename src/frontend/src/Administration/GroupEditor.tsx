import * as React from 'react';
import { Group } from './ManageGroups';
const uuid = require('uuid/v4');

interface Props {
	group: Group;
	index: number;
	selectedCRNIndex: number;
	handleChangeGroupName: Function;
	handleDeleteGroup: Function;
	handleChangeGroupDescription: Function;
	handleChangeCRN: Function;
	handleAddCRN: Function;
	handleDeleteCRN: Function;
	handleChangeSelectedCRNIndex: Function;
}

export class GroupEditor extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {
		let crnInputs = this.props.group.crns.map((crn, crnIndex) => {
			return (
				<div key={uuid()} className="d-flex mb-1">
					<input
						className="form-control form-control"
						type="number"
						value={crn}
						autoFocus={crnIndex === this.props.selectedCRNIndex}
						onFocus={(e) => { this.moveCaretToEnd(e); this.props.handleChangeSelectedCRNIndex(crnIndex); }}
						onBlur={() => this.props.handleChangeSelectedCRNIndex(-1)}
						onChange={(e) => this.props.handleChangeCRN(e, this.props.index, crnIndex)}
					/>
					<button
						className="btn btn-danger ml-2"
						onClick={() => this.props.handleDeleteCRN(this.props.index, crnIndex)}
					>
						&#10006;
					</button>
				</div>
			);
		});

		let deleteButton = null;
		if (this.props.group.name !== 'Semester 1' &&
			this.props.group.name !== 'Semester 2' &&
			this.props.group.name !== 'Semester 3' &&
			this.props.group.name !== 'Semester 4' &&
			this.props.group.name !== 'Semester 5')
			deleteButton = (
				<div className="form-group row">
					<div className="col-lg-12">
						<button type="button" className="btn btn-danger" onClick={() => this.props.handleDeleteGroup(this.props.index)}>
							<span className=" oi oi-trash" />
							<span>&nbsp;&nbsp;</span>
							Delete Group
						</button>
					</div>
				</div>
			);

		return (
			<div>
				<div className="form-group row">
					<label className="col-lg-4 col-form-label text-left">Name:</label>
					<div className="col-lg-8">
						<input
							className="form-control form-control"
							type="text"
							value={this.props.group.name}
							disabled={this.props.group.name === 'Semester 1' ||
								this.props.group.name === 'Semester 2' ||
								this.props.group.name === 'Semester 3' ||
								this.props.group.name === 'Semester 4' ||
								this.props.group.name === 'Semester 5'
							}
							onChange={(e) => this.props.handleChangeGroupName(e, this.props.index)}
						/>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-lg-4 col-form-label text-left">Description:</label>
					<div className="col-lg-8">
						<textarea
							tabIndex={2}
							value={this.props.group.description}
							onChange={(e) => this.props.handleChangeGroupDescription(e, this.props.index)}
							className="form-control"
							placeholder="(Optional)"
							rows={2}
						/>
					</div>
				</div>
				<div className="form-group row">
					<label className="col-lg-4 col-form-label text-left">CRNs:</label>
					<div className="col-lg-8">
						{crnInputs}
						<button className="btn btn-primary mt-2 float-right" onClick={() => this.props.handleAddCRN(this.props.index)}>
							Add CRN &nbsp;&nbsp;
							<span className="plusIcon oi oi-size-sm oi-plus" style={{ top: '-1px' }} />
						</button>
					</div>
				</div>
				{deleteButton}
			</div>
		);
	}

	moveCaretToEnd = (e: any) => {
		let tempValue = e.target.value;
		e.target.value = '';
		e.target.value = tempValue;
	}
}

export default GroupEditor;