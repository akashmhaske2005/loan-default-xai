import { Component } from 'react';

export default class ErrorBoundary extends Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-base, #050d2e)', padding: 32, textAlign: 'center',
            }}>
                <div style={{ maxWidth: 520 }}>
                    <div style={{ fontSize: 64, marginBottom: 16 }}>⚠️</div>
                    <h1 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 800, marginBottom: 12 }}>
                        Something went wrong
                    </h1>
                    <p style={{ color: '#94a3b8', marginBottom: 28, lineHeight: 1.6 }}>
                        An unexpected error occurred. Please try refreshing the page.
                        If this keeps happening, contact support.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            background: '#1a56e8', color: '#fff', border: 'none', borderRadius: 99,
                            padding: '12px 32px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
                        }}
                    >
                        Refresh Page
                    </button>
                    {import.meta.env.DEV && this.state.error && (
                        <pre style={{
                            marginTop: 28, textAlign: 'left', background: '#0f172a', color: '#f87171',
                            padding: 16, borderRadius: 10, fontSize: '0.78rem', overflowX: 'auto'
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            </div>
        );
    }
}
