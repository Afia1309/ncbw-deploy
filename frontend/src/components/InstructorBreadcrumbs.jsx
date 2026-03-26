import { Link } from "react-router-dom";

export default function InstructorBreadcrumbs({ items = [] }) {
  if (!items.length) return null;

  return (
    <div style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.2 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index}>
            {isLast ? (
              <span style={{ color: "#111827", fontWeight: 600 }}>{item.label}</span>
            ) : (
              <>
                <Link
                  to={item.path}
                  style={{ color: "#6B7280", textDecoration: "none" }}
                >
                  {item.label}
                </Link>
                <span style={{ margin: "0 8px" }}>/</span>
              </>
            )}
          </span>
        );
      })}
    </div>
  );
}