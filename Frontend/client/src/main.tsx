import { createRoot } from "react-dom/client";
import { Component, ErrorInfo, ReactNode } from "react";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", fontFamily: "system-ui" }}>
          <h1 style={{ color: "#ef4444" }}>Something went wrong</h1>
          <pre style={{ backgroundColor: "#f3f4f6", padding: "10px", borderRadius: "4px", overflow: "auto" }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ fontSize: "12px", color: "#6b7280", marginTop: "10px" }}>
            {this.state.error?.stack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  console.log("Mounting React App...");
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Root element not found");

  createRoot(rootElement).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log("React App Mounted");
} catch (e: any) {
  console.error("Mount Error:", e);
  document.body.innerHTML = `<div style="color: red; padding: 20px; font-size: 20px;">
    <h1>Application Crash</h1>
    <pre>${e?.message || e}</pre>
  </div>`;
}
