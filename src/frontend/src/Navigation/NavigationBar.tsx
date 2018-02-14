import * as React from 'react';

export class NavigationBar extends React.Component<{}, {}> {
	constructor(props: {}, state: {}) {
		super(props, state);
	}

	render() {
		let style = {
			top: 3
		};

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
						<li className="nav-item active">
							<a className="nav-link" href="/">Home <span className="sr-only">(current)</span></a>
						</li>
						<li className="nav-item">
							<a className="nav-link" href="/schedule">Schedule Events</a>
						</li>
						<li className="nav-item">
							<a className="nav-link disabled" href="#">Manage Classes</a>
						</li>

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
}

export default NavigationBar;