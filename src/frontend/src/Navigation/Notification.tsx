import * as React from 'react';
const uuid = require('uuid/v4');

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

		let messages: JSX.Element[] = this.props.message.split('<<break>>').map(str => {
			if (str.includes('Event owner\'s response:')) {
				let split = str.split('Event owner\'s response:');
				if (split.length > 0)
					return <div key={uuid()}><strong>{'Event owner\'s response:'}</strong>{split[1]}</div>;
			}

			return <div key={uuid()}>{str}</div>;
		});

		console.log(this.props.message);
		let title: JSX.Element = <h6 className="mt-2"><strong>{this.props.title}</strong></h6>;
		if (this.props.title === 'Timeslot Request Denied.')
			title = <h6 className="mt-2"><strong><span className="text-danger">Timeslot Request Denied</span>.</strong></h6>;
		if (this.props.title === 'Timeslot Request Granted.')
			title = <h6 className="mt-2"><strong><span className="text-success">Timeslot Request Granted</span>.</strong></h6>;

		return (
			<div className="card p-2 mb-1" style={style}>
				<div className="d-flex">
					<div className="w-100 mr-2">
						{title}
						<hr />
					</div>
					<div className="ml-auto">
						<button className="btn btn-sm btn-danger" onClick={() => this.props.handleDeleteNotification(this.props.index)} >&#10006;</button>
					</div>
				</div>
				{messages}
			</div>
		);
	}
}

export default Notification;