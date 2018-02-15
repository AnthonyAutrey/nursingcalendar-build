import * as React from 'react';
import { CSSProperties } from 'react';
import { EventGroupSelector } from './EventGroupSelector';
const uuid = require('uuid/v4');

interface Props {
	show: boolean;
	groupOptionsFromAPI: string[];
	closeHandler: Function;
	creationHandler: Function;
}

interface State {
	title: string;
	description: string;
	groups: string[];
}

export class CreateEventModal extends React.Component<Props, State> {
	private defaultTitle: string = 'New Event';
	public titleInput: any = null;

	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			title: '',
			description: '',
			groups: []
		};
	}

	render() {
		if (!this.props.show)
			return null;

		let backdropStyle: CSSProperties = {
			zIndex: Number.MAX_SAFE_INTEGER,
			// position: 'fixed',
			position: 'fixed',
			overflow: 'auto',
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
			backgroundColor: 'rgba(0,0,0,0.3)',
			padding: 'auto'
		};

		let remainingGroupOptions: string[] = this.props.groupOptionsFromAPI.filter(option => {
			return !this.state.groups.includes(option);
		});

		let groupSelectors = this.state.groups.map(group => {
			let options: string[] = remainingGroupOptions.slice(0);
			options.unshift(group);
			options.sort((a, b) => {
				if (a < b) return -1;
				if (a > b) return 1;
				return 0;
			});
			let selector = (
				<EventGroupSelector
					key={uuid()}
					index={this.state.groups.indexOf(group)}
					selected={group}
					options={options}
					handleGroupChange={this.handleGroupChange}
					handleDelete={this.handleDeleteGroup}
				/>
			);
			return selector;
		});

		let addButton: JSX.Element | null = (
			<div>
				<button type="button" onClick={this.handleAddGroup} className="d-block d-sm-none btn btn-primary">
					Add &nbsp;
					<span className="plusIcon oi oi-size-sm oi-plus" />
				</button>
				<button type="button" onClick={this.handleAddGroup} className="d-none d-sm-block btn btn-primary">
					Add Group &nbsp;&nbsp;
					<span className="plusIcon oi oi-size-sm oi-plus" />
				</button>
			</div>
		);

		if (this.props.groupOptionsFromAPI.length === this.state.groups.length)
			addButton = null;

		return (
			<div onKeyPress={this.handleKeyPress} style={backdropStyle}>
				<div className="modal-dialog" role="document">
					<div className="modal-content">
						<div className="modal-header">
							<input
								autoFocus={true}
								tabIndex={1}
								type="text"
								placeholder="New Event"
								value={this.state.title}
								onChange={this.handleTitleChange}
								className="modal-title form-control mx-0 px-0"
								id="exampleModalLabel"
							/>
							<button type="button" className="close" onClick={this.close} aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
						</div>
						<div className="modal-body pb-0 mb-0">
							<div className="form-group text-left">
								<label>Description:</label>
								<textarea
									tabIndex={2}
									value={this.state.description}
									onChange={this.handleDescriptionChange}
									className="form-control"
									placeholder="(Optional)"
									rows={3}
								/>
							</div>
							<div className="form-group text-left mr-auto">
								<div className="d-flex flex-wrap mb-2">
									<label className="mr-auto">Relevant Groups:</label>
									{addButton}
								</div>
								{groupSelectors}
							</div>
						</div>
						<div className="modal-footer">
							<div className="d-none d-sm-block mr-0">
								<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.save}>Create Event</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	handleTitleChange = (event: any) => {
		this.setState({ title: event.target.value });
	}

	handleDescriptionChange = (event: any) => {
		if (event.target.value.length <= 300)
			this.setState({ description: event.target.value });
	}

	// Groups //////////////////////////////////////////////////////////////////////////////////////////////////////////////
	private handleGroupChange = (index: number, event: any) => {
		let newGroups = this.state.groups.slice(0);
		newGroups[index] = event.target.value;
		this.setState({ groups: newGroups });
	}

	private handleDeleteGroup = (index: number) => {
		let newGroups = this.state.groups.slice(0);
		newGroups.splice(index, 1);
		this.setState({ groups: newGroups });
	}

	private handleAddGroup = () => {
		let unselectedGroups: string[] = this.props.groupOptionsFromAPI.filter(option => {
			return !this.state.groups.includes(option);
		});

		if (unselectedGroups.length > 0) {
			let newGroups = this.state.groups.slice(0);
			newGroups.push(unselectedGroups[0]);
			this.setState({ groups: newGroups });
		}
	}

	handleKeyPress = (event: any) => {
		if (event.key === 'Enter')
			this.save();
	}

	close = () => {
		this.resetFields();
		this.props.closeHandler();
	}

	save = () => {
		let title = this.state.title;
		if (title === '')
			title = this.defaultTitle;
		this.props.creationHandler(title, this.state.description, this.state.groups);
		this.resetFields();
	}

	resetFields = () => {
		this.setState({ title: '', description: '', groups: [] });
	}
}

export default CreateEventModal;