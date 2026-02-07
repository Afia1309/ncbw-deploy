export default function ModuleCard({ name, status, onClick }) {
  return (
    <div className="dash-module" onClick={onClick}>
      <div className="dash-module-name">{name}</div>
      {status && <div className="dash-module-status">{status}</div>}
    </div>
  );
}
