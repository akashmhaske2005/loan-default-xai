import "../..//styles/global.css";

export default function Button({ children, onClick }) {
  return (
    <button className="btn-primary" onClick={onClick}>
      {children}
    </button>
  );
}