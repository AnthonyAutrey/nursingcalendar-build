import * as React from 'react';
import { CSSProperties } from 'react';

interface Props {
	show: boolean;
	closeHandler: Function;
	creationHandler: Function;
}

interface State {
	title: string;
	description: string;
}

export class CreateEventModal extends React.Component<Props, State> {
	private defaultTitle: string = 'New Event';
	public titleInput: any = null;

	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			title: '',
			description: ''
		};
	}

	render() {
		if (!this.props.show)
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
							<button tabIndex={3} type="button" className="btn btn-primary" onClick={this.save}>Create Event</button>
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
		this.props.creationHandler(title, this.state.description);
		this.resetFields();
	}

	resetFields = () => {
		this.setState({ title: '', description: '' });
	}
}

export default CreateEventModal;