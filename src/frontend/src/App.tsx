import * as React from 'react';
import { Scheduler } from './Scheduler/Scheduler';
import './App.css';

class App extends React.Component<{}, {}> {

	constructor(props: {}) {
		super(props);

		this.state = { events: {} };
	}

	render() {
		return (
			<div className="App">
				<header className="App-header">
					<h1 className="App-title">Nursing Scheduler</h1>
				</header>
				<Scheduler />
			</div>
		);
	}
}

export default App;
