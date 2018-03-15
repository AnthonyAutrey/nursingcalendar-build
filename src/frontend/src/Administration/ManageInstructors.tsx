import * as React from 'react';
const request = require('superagent');

interface Instructor {
	name: string;
	groups: string[];
}

interface State {
	instructors: Instructor[];
	groups: string[];
}

export class ManageInstructors extends React.Component<{}, State> {
	constructor(props: {}, state: State) {
		super(props, state);
		this.state = {
			instructors: [],
			groups: []
		};
	}

	componentWillMount() {
		// request.get('/api/events').set('queryData', queryDataString).end((error: {}, res: any) => {
		// 	if (res && res.body)
		// 		resolve(this.getEventIdsFromResponseBody(res.body));
		// 	else
		// 		reject();
		// });
	}

	render() {
		return (
			<div>change me</div>
		);
	}
}

export default ManageInstructors;