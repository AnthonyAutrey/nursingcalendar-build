import * as React from 'react';
import { CSSProperties } from 'react';

interface Props {
	message: string;
	status?: 'error' | 'success' | 'info';
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

		let className: string = 'bg-light border border-right-0 rounded-left mb-3 py-2 px-4 ml-auto';
		let icon: JSX.Element | null = null;
		if (this.props.status && this.props.status === 'error') {
			className = 'text-danger bg-light border border-danger border-right-0 rounded-left mb-3 py-2 px-4 ml-auto';
		} else if (this.props.status && this.props.status === 'success') {
			className = 'text-success bg-light border border-2 border-success border-right-0 rounded-left mb-3 py-2 px-4 ml-auto';
			icon = <span className="oi oi-check mr-2" />;
		} else if (this.props.status && this.props.status === 'info') {
			icon = <span className="oi oi-calendar mr-2" />;
			className = 'bg-light border border-2 border-secondary border-right-0 rounded-left mb-3 py-2 px-4 ml-auto';
		}

		return (
			<div style={backdropStyle}>
				<div className="d-flex flex-no-wrap align-self-center">
					<div className={className}>
						<span className="justify-content-center align-self-center mr-3">
							{icon}
							{this.props.message}
						</span>
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