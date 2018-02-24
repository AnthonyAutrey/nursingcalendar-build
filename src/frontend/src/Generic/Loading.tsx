import * as React from 'react';
import { CSSProperties } from 'react';

export class Loading extends React.Component<{}, {}> {
	private backDropStyle: CSSProperties = {
		zIndex: Number.MAX_SAFE_INTEGER,
		position: 'fixed',
		overflow: 'auto',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: 'rgba(255,255,255,0.2)',
		padding: 'auto'
	};

	private gifStyle: CSSProperties = {
		position: 'fixed',
		top: '50%',
		left: '50%',
		margin: '-50px 0px 0px -50px'
	};

	constructor(props: {}, state: {}) {
		super(props, state);
	}

	render() {
		return (
			<div style={this.backDropStyle}>
				<div style={this.gifStyle}>
					<img src={require('./nursing-cal-loading.svg')} />
				</div>
			</div>
		);
	}
}

export default Loading;