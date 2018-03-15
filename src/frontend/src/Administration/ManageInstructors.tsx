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
		let queryData: {} = {
			where: {
				UserRole: 'instructor'
			}
		};

		let queryDataString: string = JSON.stringify(queryData);
		request.get('/api/users').set('queryData', queryDataString).end((error: {}, res: any) => {
			if (res && res.body)
				console.log(res.body);
			else
				alert('handle error!');
		});
	}

	render() {
		return (
			<div>change me</div>
		);
	}
}

export default ManageInstructors;