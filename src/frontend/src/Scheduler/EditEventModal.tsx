import * as React from 'react';
import { CSSProperties } from 'react';

interface Props {
	saveHandler: Function;
	deleteHandler: Function;
}

interface State {
	show: boolean;
	eventID?: number;
	title: string;
	description: string;
}

export class EditEventModal extends React.Component<Props, State> {
	public titleInput: any = null;

	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			show: false,
			title: '',
			description: ''
		};
	}

	render() {
		if (!this.state.show)
			return null;

		let backdropStyle: CSSProperties = {
			zIndex: Number.MAX_SAFE_INTEGER,
			position: 'fixed',
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
			backgroundColor: 'rgba(0,0,0,0.3)',
			padding: '15%'
		};

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
						<div className="modal-body">
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
						</div>
						<div className="modal-footer">
							<button tabIndex={3} type="button" className="btn btn-danger mr-auto" onClick={this.delete}>
								<span className=" oi oi-trash" />
								<span>&nbsp;&nbsp;</span>
								Delete
							</button>
							<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.save}>Save Changes</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	public beginEdit = (eventID: number, title: string, description: string) => {
		this.setState({ title: title, description: description, eventID: eventID, show: true });
	}

	private handleTitleChange = (event: any) => {
		this.setState({ title: event.target.value });
	}

	private handleDescriptionChange = (event: any) => {
		if (event.target.value.length <= 300)
			this.setState({ description: event.target.value });
	}

	private handleKeyPress = (event: any) => {
		if (event.key === 'Enter')
			this.save();
	}

	private close = () => {
		this.resetState();
	}

	private save = () => {
		let title = this.state.title;
		this.props.saveHandler(this.state.eventID, title, this.state.description);
		this.resetState();
	}

	private delete = () => {
		this.resetState();
		this.props.deleteHandler(this.state.eventID);
	}

	private resetState = () => {
		this.setState({ eventID: undefined, title: '', description: '', show: false });
	}
}

export default EditEventModal;