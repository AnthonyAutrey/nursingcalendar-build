import * as React from 'react';
const uuid = require('uuid/v4');

interface Props {
	handleLogout: any;
	role: string;
	activeRoute: string;
}

export class NavigationBar extends React.Component<Props, {}> {
	private scheduleClassName = 'nav-item';
	private manageClassesClassName = 'nav-item';
	private administrationClassName = 'nav-item';

	constructor(props: Props, state: {}) {
		super(props, state);
	}

	componentWillReceiveProps(nextProps: Props) {
		if (nextProps.activeRoute !== this.props.activeRoute) {
			this.scheduleClassName = 'nav-item';
			this.manageClassesClassName = 'nav-item';
			this.administrationClassName = 'nav-item';
		}
		if (nextProps.activeRoute === 'Scheduler')
			this.scheduleClassName = 'nav-item active';
		else if (nextProps.activeRoute === 'ManageClasses')
			this.manageClassesClassName = 'nav-item active';
		else if (nextProps.activeRoute === 'Administration')
			this.administrationClassName = 'nav-item active';
	}

	render() {
		let style = {
			top: 3
		};

		let navLinks: JSX.Element[] = this.getNavLinks();

		return (
			<nav className="navbar navbar-expand-md navbar-light bg-light border-bottom mb-3">
				<a className="navbar-brand text-primary" href="/">
					<h2>
						ULM Nursing Schedule
					</h2>
				</a>
				<button
					className="navbar-toggler border-0"
					type="button"
					data-toggle="collapse"
					data-target="#navbar"
					aria-controls="navbar"
					aria-expanded="false"
					aria-label="Toggle navigation"
				>
					<span className="bg-light text-dark oi oi-menu" />
				</button>
				<div className="collapse navbar-collapse" id="navbar">
					<ul className="navbar-nav mt-2 mt-lg-0">
						{navLinks}
					</ul>
					<ul className="nav nav-pills mt-2 mt-lg-0 ml-auto">
						<li className="nav-item dropdown">
							<a
								className="nav-link dropdown-toggle bg-secondary text-light"
								href="#"
								id="navbarDropdown"
								role="button"
								data-toggle="dropdown"
								aria-haspopup="true"
								aria-expanded="false"
							>
								<span className="oi oi-bell mr-2" style={style} />
								2 Notifications
							</a>
							<div className="dropdown-menu" aria-labelledby="navbarDropdown">
								<div className="dropdown-item">
									Notification
								</div>
							</div>
						</li>
					</ul>
				</div>
			</nav>
		);
	}

	// Navigation Links /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getNavLinks = (): JSX.Element[] => {
		let navLinks: JSX.Element[] = [];
		navLinks.push(
			<li key={uuid()} className={this.manageClassesClassName}>
				<a className="nav-link" href="/classes"	>
					<span className=" oi oi-clipboard" />
					&nbsp;
			Manage Classes
		</a>
			</li>
		);

		if (this.props.role === 'instructor' || this.props.role === 'administrator')
			navLinks.unshift(
				<li key={uuid()} className={this.scheduleClassName + ' ml-2'}>
					<a className="nav-link" href="/schedule">
						<span className=" oi oi-pencil" />
						&nbsp;
				Schedule Events
			</a>
				</li>
			);

		if (this.props.role === 'administrator')
			navLinks.push(
				<li key={uuid()} className={this.manageClassesClassName + ' ml-2'}>
					<a className="nav-link" href="/administration">
						<span className=" oi oi-key" />
						&nbsp;
			Administration
		</a>
				</li>
			);

		navLinks.push(
			<li key={uuid()} className="nav-item">
				<a className="nav-link" href="/" onClick={this.props.handleLogout}>
					<span className=" oi oi-account-logout" />
					&nbsp;
			Logout
		</a>
			</li>
		);

		return navLinks;
	}
}

export default NavigationBar;