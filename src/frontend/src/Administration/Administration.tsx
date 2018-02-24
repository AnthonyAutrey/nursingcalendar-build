import * as React from 'react';

interface State {
	publishStartDate: Date;
	publishEndDate: Date;
}

export class Administration extends React.Component<{}, State> {
	constructor(props: {}, state: State) {
		super(props, state);

		this.state = {
			publishStartDate: new Date(),
			publishEndDate: new Date()
		};
	}

	render() {
		return (

			<div className="col-lg-6 offset-lg-3">
				<div className="w-100 px-5">
					<div className="card-body">
						<form onSubmit={this.handleSubmitPublishPeriod} >
							<h4 className="card-title">Calendar Publish Period</h4>
							<hr />
							<p>During this period, the calendar will be visible to students and events will have to be approved before being created or modified.</p>
							<div className="form-group row">
								<div className="col-form-label col-md-3">Start Date:</div>
								<div className="col-md-9">
									<input
										className="form-control"
										value={this.getDateString(this.state.publishStartDate)}
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
										value={this.getDateString(this.state.publishEndDate)}
										onChange={this.handlePublishEndDateChange}
										type="date"
									/>
								</div>
							</div>
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
				<form method="get" action="/logs" >
					<button type="submit" className="btn btn-primary btn-block mb-1" >
						View Logs
					</button>
				</form>
				<form method="get" action="/manageRooms" >
					<button type="submit" className="btn btn-primary btn-block mb-1" >
						Manage Rooms
					</button>
				</form>
				<form method="get" action="/manageAdmin" >
					<button type="submit" className="btn btn-primary btn-block mb-1" >
						Manage Admin Rights
					</button>
				</form>
			</div>
		);
	}

	getDateString = (date: Date): string => {
		let day = ('0' + date.getDate()).slice(-2);
		let month = ('0' + (date.getMonth() + 1)).slice(-2);
		let dateString = date.getFullYear() + '-' + (month) + '-' + (day);

		return dateString;
	}

	handlePublishStartDateChange = (e: any) => {
		let date = new Date(e.target.value);
		date.setDate(date.getDate() + 1);
		this.setState({ publishStartDate: date });
	}

	handlePublishEndDateChange = (e: any) => {
		let date = new Date(e.target.value);
		date.setDate(date.getDate() + 1);
		this.setState({ publishEndDate: date });
	}

	handleSubmitPublishPeriod = (e: any) => {
		e.preventDefault();
		alert('Submit: ' + this.state.publishStartDate + ', ' + this.state.publishEndDate);
	}
}

export default Administration;