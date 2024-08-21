import { Component } from 'react';
import cx from 'classnames';

export default class Counter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: 42,
    } as any;
  }

  incrementCounter = () => {
    this.setState((prevState: any) => ({
      count: prevState.count + 1,
    }));
  };

  render() {
    return (
      <>
        <div>
          <h2 className="counter">{(this.state as any).count}</h2>
          <button
            className={cx('counter-button')}
            onClick={this.incrementCounter}
          >
            Click
          </button>
        </div>
        <style>{`
          .counter-button {
            font-size: 1rem;
            padding: 5px 10px;
            color: #585858;
          }
          .counter {
            color: #000;
          }
        `}</style>
      </>
    );
  }
}
