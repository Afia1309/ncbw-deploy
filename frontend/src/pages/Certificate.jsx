import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MemberLayout from "../../components/MemberLayout";
import "./Dashboard.css";

export default function Certificate() {
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCertificate();
  }, []);

  const fetchCertificate = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/training/certificate/", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Certificate not available.");
      }

      setCertificate(data.certificate);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MemberLayout title="Certificate">
        <div className="dash-loading">Loading certificate...</div>
      </MemberLayout>
    );
  }

  if (error) {
    return (
      <MemberLayout title="Certificate">
        <div className="dash-error">{error}</div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout title="Certificate">
      <div className="dash-card" style={{ padding: "32px", textAlign: "center" }}>
        <p className="dash-eyebrow">Certificate of Completion</p>
        <h1 className="dash-block-title">{certificate.user}</h1>
        <p className="dash-subtext">
          has successfully completed the
        </p>
        <h2 style={{ marginTop: "12px" }}>{certificate.track}</h2>

<div style={{ marginTop: "24px" }}>
  <p><strong>Member ID:</strong> {certificate.member_id}</p>
  <p><strong>Issued Date:</strong> {certificate.issued_date}</p>
  <p><strong>Certificate Code:</strong> {certificate.certificate_code}</p>

  <button
    type="button"
    className="primary-btn"
    style={{ marginTop: "20px" }}
    onClick={async () => {
      try {
        const token = localStorage.getItem("access_token");

        const response = await fetch("http://127.0.0.1:8000/api/training/certificate/pdf/", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to download certificate PDF");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "certificate.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        alert(err.message);
      }
    }}
  >
    Download PDF
  </button>
</div>
      </div>
    </MemberLayout>
  );
}