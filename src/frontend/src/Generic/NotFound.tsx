import * as React from 'react';

export class NotFound extends React.Component<{}, {}> {
	constructor(props: {}, state: {}) {
		super(props, state);
	}

	render() {
		return (
			<div>
				<div className="col-lg-6 offset-lg-3">
					<hr />
					<div className="w-100 px-5">
						<div className="card-body d-flex justify-content-center align-items-center">
							<span className="oi oi-magnifying-glass" style={{ top: 1, fontSize: '7em' }} />
							<h1 className="ml-5">
								Sorry! We couldn't find the page you were looking for.
							</h1>
						</div>
					</div>
					<hr />
				</div>
			</div>
		);
	}
}

export default NotFound;