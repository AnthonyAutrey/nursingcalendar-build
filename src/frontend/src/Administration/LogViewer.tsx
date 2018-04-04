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
	logID: number;
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

		let noLogsMessage = null;

		if (this.state.logs.length < 1)
			noLogsMessage = <div> No logs to display. </div>;

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
					<button onClick={() => this.clearLogs()} className="btn btn-primary btn-block">
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
						{noLogsMessage}
						{logs}
						<hr />
						{
							this.state.logs.length > 0 &&
							<button onClick={() => this.setState({ showDeleteLogs: !this.state.showDeleteLogs })} className="btn btn-primary btn-block ">
								Delete logs
							</button>
						}
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
				logID: bodyLog.LogID,
				name: bodyLog.FirstName + ' ' + bodyLog.LastName,
				message: bodyLog.Message,
				time: bodyLog.Time,
				details: bodyLog.Details
			};
			parsedLogs.push(parsedLog);
		});

		parsedLogs.sort((a, b) => {
			let aDate = new Date(a.time);
			let bDate = new Date(b.time);
			if (aDate < bDate) return 1;
			if (aDate > bDate) return -	1;
			return 0;
		});

		this.setState({ logs: parsedLogs });
	}

	getDateString = (date: Date): string => {
		let day = ('0' + date.getDate()).slice(-2);
		let month = ('0' + (date.getMonth() + 1)).slice(-2);
		let dateString = date.getFullYear() + '-' + (month) + '-' + (day);

		return dateString;
	}

	clearLogs = () => {
		let logsToDelete: Log[] = this.state.logs.filter(stateLog => {
			let deleteDate = new Date(this.state.deleteDate);
			deleteDate.setHours(23, 59, 59, 999);
			deleteDate.setMinutes(deleteDate.getMinutes() - deleteDate.getTimezoneOffset());
			deleteDate.setDate(deleteDate.getDate() + 1);
			console.log(deleteDate.toISOString());

			return new Date(stateLog.time) <= deleteDate;
		});

		let deleteLogIDs: number[] = logsToDelete.map(deleteLog => {
			return deleteLog.logID;
		});

		console.log(deleteLogIDs);

		let queryData = {
			where: { LogID: deleteLogIDs }
		};

		let queryDataString = JSON.stringify(queryData);

		request.delete('/api/logs').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body) {
				let logsToKeep = this.state.logs.filter(filteredLog => {
					return !deleteLogIDs.includes(filteredLog.logID);
				});
				this.setState({ logs: logsToKeep });

				this.props.handleShowAlert('success', 'Successfully cleared logs!');
			} else
				this.props.handleShowAlert('error', 'Error getting log data.');
		});
	}
}
export default LogViewer;
