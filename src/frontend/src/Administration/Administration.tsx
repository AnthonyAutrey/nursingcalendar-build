import * as React from 'react';
import { Loading } from '../Generic/Loading';
const request = require('superagent');

interface Props {
	handleShowAlert: Function;
}

interface State {
	publishStartDate: string;
	publishEndDate: string;
	loading: boolean;
}

export class Administration extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			publishStartDate: '',
			publishEndDate: '',
			loading: false
		};
	}

	componentWillMount() {
		this.getPublishDatesFromAPI();
	}

	render() {
		let dates = null;
		let loading = null;
		if (this.state.loading)
			loading = <Loading />;
		else {
			dates = (
				<div>
					<div className="form-group row">
						<div className="col-form-label col-md-3">Start Date:</div>
						<div className="col-md-9">
							<input
								className="form-control"
								value={this.state.publishStartDate}
								onChange={this.handlePublishStartDateChange}
								type="date"
							/>
						</div>
					</div>
					<div className="form-group row">
						<label className="col-form-label col-md-3">End Date:</label>
						<div className="col-md-9">
							<input
								className="form-control"
								value={this.state.publishEndDate}
								onChange={this.handlePublishEndDateChange}
								type="date"
							/>
						</div>
					</div>
				</div>
			);
		}

		return (
			<div>
				{loading}
				<div className="col-lg-6 offset-lg-3">
					<hr />
					<div className="w-100 px-5">
						<div className="card-body">
							<form onSubmit={this.handleSubmitPublishPeriod} >
								<h4 className="card-title">Calendar Publish Period</h4>
								<hr />
								<p className="d-none d-md-block" >
									During this period, the calendar will be visible to students and events will have to be approved before being created or modified.
								</p>
								{dates}
								<hr />
								<div className="row">
									<button tabIndex={3} type="submit" className="btn btn-primary btn-block mx-2 mt-2">
										Submit
								</button>
								</div>
							</form>
						</div>
					</div>
					<hr />
					<form method="get" action="/manageRooms" >
						<button type="submit" className="btn btn-primary btn-block mb-1" >
							Manage Rooms
						</button>
					</form>
					<form method="get" action="/manageGroups" >
						<button type="submit" className="btn btn-primary btn-block mb-1" >
							Manage Groups
						</button>
					</form>
					<form method="get" action="/manageInstructors" >
						<button type="submit" className="btn btn-primary btn-block mb-1" >
							Manage Instructor Rights
						</button>
					</form>
					<form method="get" action="/manageStudents" >
						<button type="submit" className="btn btn-primary btn-block mb-1" >
							Manage Student Classes
						</button>
					</form>
					<form method="get" action="/logs" >
						<button type="submit" className="btn btn-primary btn-block mb-1" >
							View Logs
						</button>
					</form>
				</div>
			</div>
		);
	}

	getPublishDatesFromAPI = () => {
		this.setState({ loading: true });

		request.get('/api/publishdates').end((error: {}, res: any) => {
			if (res && res.body)
				this.setState({ publishStartDate: res.body.Start, publishEndDate: res.body.End, loading: false });
			else {
				this.props.handleShowAlert('error', 'Error getting calendar publish dates.');
				this.setState({ loading: false });
			}
		});
	}

	getDateString = (date: Date): string => {
		let day = ('0' + date.getDate()).slice(-2);
		let month = ('0' + (date.getMonth() + 1)).slice(-2);
		let dateString = date.getFullYear() + '-' + (month) + '-' + (day);

		return dateString;
	}

	handlePublishStartDateChange = (e: any) => {
		let date = e.target.value;
		this.setState({ publishStartDate: date });
	}

	handlePublishEndDateChange = (e: any) => {
		let date = e.target.value;
		this.setState({ publishEndDate: date });
	}

	handleSubmitPublishPeriod = (e: any) => {
		e.preventDefault();

		let queryData: {} = {
			insertValues: {
				Start: this.state.publishStartDate,
				End: this.state.publishEndDate
			}
		};

		let queryDataString = JSON.stringify(queryData);
		request.put('/api/publishdates').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.statusCode === 201)
				this.props.handleShowAlert('success', 'Successfully saved calendar publish period!');
			else
				this.props.handleShowAlert('error', 'Error saving calendar publish period.');
		});
	}
}

export default Administration;