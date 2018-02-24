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

		let className = 'bg-light border-bottom rounded p-1 m-0 d-flex';
		if (this.state.style === 'error')
			className = 'bg-light text-danger border-bottom border-danger rounded p-1 m-0 d-flex';
		if (this.state.style === 'success')
			className = 'bg-light text-success border-bottom border-success rounded  p-1 m-0 d-flex';

		return (
			<div className={className}>
				<div className="w-100 align-self-center text-center">
					{this.state.message}
				</div>
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