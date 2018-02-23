import * as React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { Login } from './Login/Login';
import { NavigationBar } from './Navigation/NavigationBar';
import { Scheduler } from './Scheduler/Scheduler';
import { ViewingCalendar } from './Home/ViewingCalendar';
const request = require('superagent');

interface State {
	sessionRetreived: boolean;
	cwid?: number;
	role?: string;
}

class App extends React.Component<{}, State> {

	constructor(props: {}, state: State) {
		super(props, state);

		this.state = { sessionRetreived: false };
	}

	componentWillMount() {
		this.getSession();
	}

	render() {
		if (!this.state.sessionRetreived)
			return null;

		if (!(this.state.cwid && this.state.role))
			return <Login handleLogin={this.handleLogin} />;

		// let cwid: number = this.state.cwid || 0;

		return (
			<div className="App">
				<NavigationBar role={this.state.role} handleLogout={this.handleLogout} />
				<Router>
					<Switch>
						{this.getRoutesAvailableToRole()}
					</Switch>
				</Router>
			</div>
		);
	}
	// Log in/out //////////////////////////////////////////////////////////////////////////////////////////////////////////
	getSession = () => {
		request.get('/api/session').end((error: {}, res: any) => {
			if (res && res.body) {
				this.setState({ sessionRetreived: true });
				if (res.body.cwid && res.body.role)
					this.setState({ cwid: res.body.cwid, role: res.body.role });
			} else {
				// TODO: handle failed session request
				alert('Unable to get session. Handle this properly!');
			}
		});
	}

	handleLogin = () => {
		this.getSession();
		this.forceUpdate();
	}

	handleLogout = () => {
		request.get('/api/logout').end((error: {}, res: any) => {
			this.setState({ cwid: undefined, role: undefined });
		});
	}

	// Routes //////////////////////////////////////////////////////////////////////////////////////////////////////////////
	getRoutesAvailableToRole(): JSX.Element[] {
		let routes: JSX.Element[] = [
			(<Route path="/" exact={true} component={ViewingCalendar} />),
			(<Route path="/classes" component={() => <div>Create Manage Classes Component!</div>} />)
		];

		if (this.state.role === 'instructor' || this.state.role === 'administrator')
			routes.push(
				<Route path="/schedule" >
					<Scheduler cwid={this.state.cwid || 0} />
				</Route>
			);

		if (this.state.role === 'administrator')
			routes.push(
				<Route path="/administration" exact={true} component={() => <div>Create Admin Component!</div>} />
			);

		routes.push(
			<Route component={() => <div>404</div>} />
		);

		return routes;
	}
}

export default App;
