import * as React from 'react';

interface State {
	show: boolean;
	message: string;
	style: 'success' | 'error';
}

export class Alert extends React.Component<{}, State> {
	constructor(props: {}, state: State) {
		super(props, state);

		this.state = {
			show: false,
			message: '',
			style: 'success'
		};
	}

	render() {
		if (!this.state.show)
			return null;

		let className = 'bg-light border rounded mt-0 p-1 m-2 d-flex';
		if (this.state.style === 'error')
			className = 'bg-light text-danger border border-danger rounded mt-0 p-1 m-2 d-flex';

		return (
			<div className={className}>
				<div className="w-100 align-self-center">
					{this.state.message}
				</div>
				<button className="btn btn-sm btn-danger ml-auto mr-2" onClick={this.close}>x</button>
			</div>
		);
	}

	public display = (style: 'success' | 'error', message: string) => {
		this.setState({ show: true, style: style, message: message });
		setTimeout(() => this.close(), 3000);
	}

	private close = () => {
		this.setState({ show: false, message: '' });
	}
}

export default Alert;