import * as React from 'react';

interface Props {
	index: number;
	title: string;
	message: string;
	handleDeleteNotification: Function;
}

export class Notification extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {
		return (
			<div className="card p-2 mb-1">
				<div className="d-flex">
					<div className="w-100 mr-2">
						<h6 className="mt-2" style={{ wordBreak: 'break-all' }}><strong>{this.props.title}</strong></h6>
						<hr />
						<p style={{ wordBreak: 'break-all' }}>
							{this.props.message}
						</p>
					</div>
					<div className="ml-auto">
						<button className="btn btn-sm btn-danger" onClick={() => this.props.handleDeleteNotification(this.props.index)} >&#10006;</button>
					</div>
				</div>
			</div>
		);
	}
}

export default Notification;