import * as React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import { NavigationBar } from './Navigation/NavigationBar';
import { Scheduler } from './Scheduler/Scheduler';
import { ViewingCalendar } from './Home/ViewingCalendar';

class App extends React.Component<{}, {}> {

	constructor(props: {}) {
		super(props);

		this.state = { events: {} };
	}

	render() {
		return (
			<div className="App">
				<NavigationBar />
				<Router>
					<Switch>
						<Route path="/" exact={true} component={ViewingCalendar} />
						<Route path="/schedule" component={Scheduler} />
						<Route component={() => <div>404</div>} />
					</Switch>
				</Router>
			</div>
		);
	}
}

export default App;
