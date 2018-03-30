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
			logs: []
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

		return (
			<div>
				{loading}
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<h4 className="card-title">Event Logs</h4>
						<hr />
						{logs}
					</div>
				</div>
				<hr />
			</div>
		);
	}

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
