import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="page">
          <div className="form-shell">
            <div className="header">
              <div className="brand-heading">
                <img className="brand-logo" src="/logo.svg" alt="Tour Report Management" />
                <h1>Something went wrong</h1>
              </div>
              <p>Please refresh the page and try again.</p>
            </div>
            <div className="actions">
              <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
