import "./Pages.css";

export default function HomePage() {
  return (
    <div className="page-empty">
      <div className="page-empty-icon">🏠</div>
      <h2 className="page-empty-title">Welcome to Sweetshark Client</h2>
      <p className="page-empty-subtitle">
        Add a server using the <strong>+</strong> button in the sidebar to get started.
      </p>
    </div>
  );
}
