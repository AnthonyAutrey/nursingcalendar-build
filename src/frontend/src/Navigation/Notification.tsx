import * as React from 'react';

interface Props {
	index: number;
	title: string;
	message: string;
	hasBeenSeen: boolean;
	handleDeleteNotification: Function;
}

export class Notification extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {
		let style = {};
		if (this.props.hasBeenSeen)
			style = {
				color: '#898989',
			};

		return (
			<div className="card p-2 mb-1" style={style}>
				<div className="d-flex">
					<div className="w-100 mr-2">
						<h6 className="mt-2" style={{ wordBreak: 'break-all' }}><strong>{this.props.title}</strong></h6>
						<hr />
					</div>
					<div className="ml-auto">
						<button className="btn btn-sm btn-danger" onClick={() => this.props.handleDeleteNotification(this.props.index)} >&#10006;</button>
					</div>
				</div>
				<p>
					{this.props.message}
				</p>
			</div>
		);
	}
}

export default Notification;