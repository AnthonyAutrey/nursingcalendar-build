import * as React from 'react';
import { CSSProperties } from 'react';

interface Props {
	handleSave: Function;
	handleRevert: Function;
}

export class Toolbar extends React.Component<Props, {}> {
	constructor(props: Props, state: {}) {
		super(props, state);
	}

	render() {

		let backdropStyle: CSSProperties = {
			zIndex: 9999,
			position: 'fixed',
			left: 0,
			bottom: 0,
			width: '100%',
		};

		return (
			<div style={backdropStyle}>
				<div className="d-flex flex-no-wrap">
					<div className="bg-light border border-right-0 rounded-left mb-3 py-2 px-4 ml-auto align-bottom">
						<button
							tabIndex={3}
							type="button"
							onClick={() => this.props.handleRevert()}
							className="align-bottom btn btn-outline-dark mx-2"
						>
							<span className=" oi oi-action-undo" />
							&nbsp;
							Undo All
						</button>
						<button tabIndex={3} type="button" onClick={() => this.props.handleSave()} className="btn btn-primary mr-2">
							<span className=" oi oi-file" />
							&nbsp;
							Save All Changes
						</button>
					</div>
				</div>
			</div>
		);
	}
}

export default Toolbar;