import * as React from 'react';
import { Loading } from '../Generic/Loading';
import { log } from 'util';
import { EventLog } from './EventLog';

const request = require('superagent');
const uuid = require('uuid/v4');

interface Props {
	handleShowAlert: Function;
}

interface State {
	loading: boolean;
	logs: Log[];
	showDeleteLogs: boolean;
	deleteDate: string;
}

export interface Log {
	name: string;
	message: string;
	time: string;
	details: string;
}

export class LogViewer extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			loading: false,
			logs: [],
			showDeleteLogs: false,
			deleteDate: this.getDateString(new Date),
		};
	}

	componentWillMount() {
		request.get('/api/logs').end((error: {}, res: any) => {
			if (res && res.body)
				this.parseLogs(res.body);
			else
				this.props.handleShowAlert('error', 'Error getting log data.');
		});
	}

	render() {
		let loading = null;
		if (this.state.loading)
			loading = <Loading />;

		let logs = this.state.logs.map(stateLog => {
			return <EventLog key={uuid()} log={stateLog} />;
		});

		let deleteLogs = null;
		if (this.state.showDeleteLogs)
			deleteLogs = (
				<div>
					<h5 className="mt-3">
						Clear logs up to:
					</h5>
					<div className="form-group row">
						<div className="col-form-label col-md-3">Date:</div>
						<div className="col-md-9">
							<input
								className="form-control"
								value={this.state.deleteDate}
								onChange={this.handleDeleteDateChange}
								type="date"
							/>
						</div>
					</div>
					<button className="btn btn-primary">
						Clear Logs
					</button>
				</div>
			);

		return (
			<div>
				{loading}
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<h4 className="card-title">Event Logs</h4>
						<hr />
						{logs}
						<hr />
						<button onClick={() => this.setState({ showDeleteLogs: !this.state.showDeleteLogs })} className="btn btn-primary btn-block ">
							Delete logs
						</button>
						{deleteLogs}
					</div>
				</div>
				<hr />
			</div>
		);
	}

	// Delete logs ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

	handleDeleteDateChange = (event: any) => {
		this.setState({ deleteDate: event.target.value });
	}

	// Parsing logs //////////////////////////////////////////////////////////////////////////////////////////////////////////////

	parseLogs = (body: any[]) => {
		let parsedLogs: Log[] = [];

		body.forEach(bodyLog => {
			let parsedLog: Log = {
				name: bodyLog.FirstName + ' ' + bodyLog.LastName,
				message: bodyLog.Message,
				time: bodyLog.Time,
				details: bodyLog.Details
			};
			parsedLogs.push(parsedLog);
		});
		this.setState({ logs: parsedLogs });
	}

	getDateString = (date: Date): string => {
		let day = ('0' + date.getDate()).slice(-2);
		let month = ('0' + (date.getMonth() + 1)).slice(-2);
		let dateString = date.getFullYear() + '-' + (month) + '-' + (day);

		return dateString;
	}
}
export default LogViewer;
