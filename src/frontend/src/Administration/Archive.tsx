import * as React from 'react';
import * as archiveGenerator from './ics.deps.min.js';
import { Loading } from '../Generic/Loading';
import { Event } from '../Home/ViewingCalendar';
const request = require('superagent');
var cal = archiveGenerator.ics();

interface Props {
	handleShowAlert: Function;
}

interface State {
	archiveStartDate: string;
	archiveEndDate: string;
	loading: boolean;
}

export class Archive extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);

		this.state = {
			archiveStartDate: this.getDateString(new Date),
			archiveEndDate: this.getDateString(new Date),
			loading: false
		};
	}

	render() {
		let dates = null;
		let loading = null;
		if (this.state.loading)
			loading = <Loading />;
		else
			dates = (
				<div>
					<div className="form-group row">
						<div className="col-form-label col-md-3">Start Date:</div>
						<div className="col-md-9">
							<input
								className="form-control"
								value={this.state.archiveStartDate}
								onChange={this.handleArchiveStartDateChange}
								type="date"
							/>
						</div>
					</div>
					<div className="form-group row">
						<label className="col-form-label col-md-3">End Date:</label>
						<div className="col-md-9">
							<input
								className="form-control"
								value={this.state.archiveEndDate}
								onChange={this.handleArchiveEndDateChange}
								type="date"
							/>
						</div>
					</div>
				</div>
			);

		return (
			<div>
				{loading}
				<hr />
				<div className="w-100 px-5">
					<div className="card-body">
						<form onSubmit={this.handleArchiveEvents} >
							<h4 className="card-title">Archive Events</h4>
							<hr />
							<p className="d-none d-md-block" >
								This will permanently remove all events during the selected period from the calendar and download them to your computer in an archive file.
							</p>
							{dates}
							<hr />
							<div className="row">
								<button tabIndex={3} type="submit" className="btn btn-primary btn-block mx-2 mt-2">
									Delete and Archive
								</button>
							</div>
						</form>
					</div>
				</div>
				<hr />
			</div>
		);
	}

	getDateString = (date: Date): string => {
		let day = ('0' + date.getDate()).slice(-2);
		let month = ('0' + (date.getMonth() + 1)).slice(-2);
		let dateString = date.getFullYear() + '-' + (month) + '-' + (day);

		return dateString;
	}

	handleArchiveStartDateChange = (e: any) => {
		let date = e.target.value;
		this.setState({ archiveStartDate: date });
	}

	handleArchiveEndDateChange = (e: any) => {
		let date = e.target.value;
		this.setState({ archiveEndDate: date });
	}

	handleArchiveEvents = (e: any) => {
		e.preventDefault();

		if (confirm('Are you sure you want to permanently archive all events within the selected period? This cannot be undone!'))
			request.get('/api/eventswithrelations').end((error: {}, res: any) => {
				if (res && res.body) {
					let events = this.parseDBEvents(res.body);
					let filteredEvents = this.filterEventsByDate(events);
					this.deleteArchivedEventsInDB(filteredEvents).then(() => {
						this.createAndDownloadArchive(filteredEvents);
						this.props.handleShowAlert('success', 'Successfully archived events!');
					}).catch(() => {
						this.props.handleShowAlert('error', 'Error archiving events.');
					});
				} else
					this.props.handleShowAlert('error', 'Error archiving events.');
			});
	}

	createAndDownloadArchive = (events: Event[]) => {
		if (events.length < 1)
			this.props.handleShowAlert('error', 'No events found during selected period!');

		events.forEach(event => {
			let description = 'Owner: ' + event.ownerName + ', Description: ' +
				(event.description.trim() === '' ? 'no description' : '\'' + event.description + '\'') +
				', Groups: (' + event.groups.join(', ') + ')';

			if (cal)
				cal.addEvent(event.title, description, event.location + ', ' + event.room, event.start, event.end);
		});
		if (cal) {
			cal.download('nursingCalendarArchive_FROM--' + this.state.archiveStartDate + '_TO--' + this.state.archiveEndDate);
			// reset cal to clear events
			cal = archiveGenerator.ics();
		}
	}

	deleteArchivedEventsInDB = (events: Event[]): Promise<null> => {
		let deleteMap: Map<string, Event[]> = new Map<string, Event[]>();

		events.forEach(event => {
			let mapEntry = deleteMap.get(event.location + event.room);
			if (mapEntry)
				mapEntry.push(event);
			else
				deleteMap.set(event.location + event.room, [event]);
		});

		let deleteEvents: Promise<null>[] = [];
		deleteMap.forEach((value: Event[], key: string) => {
			let ids = value.map(event => {
				return event.id;
			});
			let location = value[0].location;
			let room = value[0].room;

			deleteEvents.push(new Promise((resolve, reject) => {
				let queryData = {
					where: {
						EventID: ids,
						LocationName: location,
						RoomName: room,
					}
				};
				let queryDataString: string = JSON.stringify(queryData);
				request.delete('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
					if (res && res.body)
						resolve();
					else
						reject();
				});
			}));
		});

		return new Promise((resolve, reject) => {
			Promise.all(deleteEvents).then(() => {
				resolve();
			}).catch(() => {
				reject();
			});
		});
	}

	parseDBEvents(body: any): Event[] {
		let parsedEvents: Event[] = [];
		for (let event of body) {

			let groups: string[] = event.Groups.map((group: any) => {
				return group.GroupName;
			});

			let parsedEvent: any = {
				id: event.EventID,
				title: event.Title,
				description: event.Description,
				start: event.StartTime,
				end: event.EndTime,
				ownerName: event.OwnerName,
				groups: groups,
				location: event.LocationName,
				room: event.RoomName,
			};

			parsedEvents.push(parsedEvent);
		}

		return parsedEvents;
	}

	filterEventsByDate = (events: Event[]): Event[] => {
		let archiveStartDate = new Date(this.state.archiveStartDate);
		let archiveEndDate = new Date(this.state.archiveEndDate);
		archiveStartDate.setMinutes(archiveStartDate.getMinutes() + archiveStartDate.getTimezoneOffset());
		archiveEndDate.setMinutes(archiveEndDate.getMinutes() + archiveEndDate.getTimezoneOffset());
		archiveEndDate.setHours(23, 59, 59, 999);
		return events.filter(event => {
			if (event.end) {
				let eventStart = new Date(event.start);
				let eventEnd = new Date(event.end);

				return eventStart > archiveStartDate &&
					eventEnd < archiveEndDate;
			} else
				return false;
		});
	}
}

export default Archive;