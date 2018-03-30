import * as React from 'react';
import { Loading } from '../Generic/Loading';
import { Log } from './LogViewer';

const request = require('superagent');

interface Props {
	log: Log;
}

interface State {
	showDetails: boolean;
}

export class EventLog extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			showDetails: false
		};
	}

	render() {

		let details = null;
		if (this.state.showDetails)
			details = (
				<div>
					<hr />
					<div className="col-12 ml-3">
						{this.props.log.details}
					</div>
					<hr />
				</div>
			);

		return (
			<div className="row mb-1">
				<div className="col-sm-3 text-center">
					{this.props.log.name}
				</div>
				<div className="col-sm-4 text-center">
					{this.props.log.message}
				</div>
				<div className="col-sm-3 text-center">
					{this.formatDate(this.props.log.time)}
				</div>
				<div className="col-sm-2">
					<button onClick={() => this.setState({ showDetails: !this.state.showDetails })} className="btn btn-primary btn-sm float-right">
						{this.state.showDetails ? 'Hide Details' : 'Show Details'}
					</button>
				</div>
				{details}
			</div>
		);
	}
	// Get string of data and parse the data to display into specific format\
	formatDate = (dateString: string) => {
		let date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + dateString.substr(11);
	}
}
export default EventLog;
