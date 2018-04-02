import * as React from 'react';
import { PublishPeriod } from './PublishPeriod';
import { Archive } from './Archive';
import { ManageUsers } from './ManageUsers';
import { LogViewer } from './LogViewer';

interface Props {
	handleShowAlert: Function;
}

interface State {
	showPublishPeriod: boolean;
	showArchive: boolean;
	showManageInstructors: boolean;
	showLogViewer: boolean;
}

export class Administration extends React.Component<Props, State> {
	constructor(props: Props, state: State) {
		super(props, state);
		this.state = {
			showPublishPeriod: false,
			showArchive: false,
			showManageInstructors: false,
			showLogViewer: false
		};
	}

	render() {
		return (
			<div className="col-lg-8 offset-lg-2">
				<button onClick={() => this.setState({ showPublishPeriod: !this.state.showPublishPeriod })} className="btn btn-primary btn-block mb-2" >
					Publish Period
				</button>
				<div className={this.state.showPublishPeriod ? '' : 'd-none'}>
					<PublishPeriod handleShowAlert={this.props.handleShowAlert} />
				</div>
				<button onClick={() => this.setState({ showManageInstructors: !this.state.showManageInstructors })} className="btn btn-primary btn-block mb-2" >
					Manage Instructor Rights
				</button>
				<div className={this.state.showManageInstructors ? '' : 'd-none'}>
					<ManageUsers handleShowAlert={this.props.handleShowAlert} userRole="instructor" />
				</div>
				<button className="btn btn-primary btn-block mb-2" >
					Manage Rooms
				</button>
				<button className="btn btn-primary btn-block mb-2" >
					Manage Groups
				</button>
				<button onClick={() => this.setState({ showLogViewer: !this.state.showLogViewer })} className="btn btn-primary btn-block mb-2" >
					Event Logs
				</button>
				<div className={this.state.showLogViewer ? '' : 'd-none'}>
					<LogViewer handleShowAlert={this.props.handleShowAlert} />
				</div>
				<button onClick={() => this.setState({ showArchive: !this.state.showArchive })} className="btn btn-primary btn-block mb-2" >
					Archive Events
				</button>
				<div className={this.state.showArchive ? '' : 'd-none'}>
					<Archive handleShowAlert={this.props.handleShowAlert} />
				</div>
			</div>
		);
	}
}

export default Administration;