import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, authHeaders } from "../api";
import Toast from "../components/Toast";

const currentYear = new Date().getFullYear();

const fileUrl = (path, mode = "preview") => {
  const token = encodeURIComponent(localStorage.getItem("tour_admin_token") || "");
  return `${API_BASE_URL}/api/reports/file?mode=${mode}&path=${encodeURIComponent(path)}&token=${token}`;
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fileLink = (filePath, label) => (
  <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", marginBottom: 5 }}>
    <span>{label}</span>
    <a href={fileUrl(filePath, "preview")} target="_blank" rel="noreferrer">Preview</a>
    <a href={fileUrl(filePath, "download")} target="_blank" rel="noreferrer">Download</a>
  </span>
);

const reportFiles = (report) => {
  if (report.combined_pdf_path) {
    return fileLink(report.combined_pdf_path, "Combined report");
  }

  return (
    <>
      {report.approval_note_path && fileLink(report.approval_note_path, "Approval note")}<br />
      {report.supporting_documents.map((doc) => (
        <span key={doc.id}>
          {fileLink(doc.file_path, doc.file_name)}<br />
        </span>
      ))}
    </>
  );
};

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({
    year: String(currentYear),
    status: "all",
    fromDate: "",
    toDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });
  const navigate = useNavigate();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.setTimeout(() => setToast({ message: "", type }), 3000);
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/reports`, {
        headers: authHeaders(),
        params: {
          year: filters.year || undefined,
          status: filters.status,
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
        },
      });
      setReports(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("tour_admin_token");
        navigate("/admin");
        return;
      }
      showToast(err.response?.data?.message || "Reports could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("tour_admin_token")) {
      navigate("/admin");
      return;
    }
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id, status, rejection_reason = "") => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/reports/${id}/status`,
        { status, rejection_reason },
        { headers: authHeaders() }
      );
      showToast(`Report ${status.toLowerCase()} successfully.`);
      loadReports();
    } catch (err) {
      showToast(err.response?.data?.message || "Status update failed.", "error");
    }
  };

  const submitRejection = async (e) => {
    e.preventDefault();
    const reason = rejectReason.trim();
    if (!reason) {
      showToast("Please enter rejection reason.", "error");
      return;
    }
    await updateStatus(rejectTarget.id, "Rejected", reason);
    setRejectTarget(null);
    setRejectReason("");
  };

  const logout = () => {
    localStorage.removeItem("tour_admin_token");
    localStorage.removeItem("tour_admin");
    navigate("/admin");
  };

  return (
    <main className="page">
      <Toast toast={toast} onClose={() => setToast({ message: "", type: toast.type })} />
      <div className="shell">
        <div className="topbar">
          <div>
            <div className="brand-heading">
              <img className="brand-logo" src="/logo.svg" alt="Tour Report Management" />
              <h1>Admin Dashboard</h1>
            </div>
            <p style={{ margin: "5px 0 0", color: "#64748b" }}>Review tour program reports</p>
          </div>
          <div className="actions">
            <button className="btn btn-danger" onClick={logout} type="button">Logout</button>
          </div>
        </div>

        <div className="card">
          <div className="filters">
            <div>
              <label>Year</label>
              <input value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
            </div>
            <div>
              <label>Status</label>
              <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label>From Date</label>
              <input type="date" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
            </div>
            <div>
              <label>To Date</label>
              <input type="date" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
            </div>
          </div>
          <div className="actions">
            <button className="btn btn-muted" type="button" onClick={() => setFilters({ year: "", status: "all", fromDate: "", toDate: "" })}>Clear</button>
            <button className="btn btn-primary" type="button" onClick={loadReports}>Apply Filters</button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Tour</th>
                <th>Travel</th>
                <th>Files</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="8">No reports found.</td></tr>
              ) : reports.map((report) => (
                <tr key={report.id}>
                  <td>{formatDate(report.created_at)}</td>
                  <td>
                    <strong>{report.name}</strong><br />
                    SAP: {report.sap_id}<br />
                    {report.designation}, {report.grade}<br />
                    Dept: {report.department}
                  </td>
                  <td>
                    <strong>{report.purpose}</strong><br />
                    {formatDate(report.start_date)} to {formatDate(report.end_date)}<br />
                    {report.start_place} to {report.destination}
                  </td>
                  <td>
                    {report.mode_of_travel}<br />
                    Weekly off: {report.weekly_off}<br />
                    Authority: {report.approving_authority}
                  </td>
                  <td>
                    {reportFiles(report)}
                  </td>
                  <td><span className={`badge ${report.status}`}>{report.status}</span></td>
                  <td>{report.rejection_reason || "-"}</td>
                  <td>
                    {report.status === "Pending" ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className="btn btn-success" type="button" onClick={() => updateStatus(report.id, "Approved")}>Approve</button>
                        <button className="btn btn-danger" type="button" onClick={() => setRejectTarget(report)}>Reject</button>
                      </div>
                    ) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {rejectTarget && (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={submitRejection}>
            <h3>Rejection Reason</h3>
            <p style={{ color: "#64748b", marginTop: 0 }}>{rejectTarget.name} - {rejectTarget.destination}</p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection"
              autoFocus
            />
            <div className="actions" style={{ marginTop: 14 }}>
              <button className="btn btn-muted" type="button" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button className="btn btn-danger" type="submit">Reject Report</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
