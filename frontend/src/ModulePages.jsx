import { useState, useEffect, useCallback } from "react";
import { api, crud, projectCrud } from "./api";

const T = {
  charcoal: "#1C1F26", surface: "#242830", panel: "#2C3040",
  border: "#363C4E", orange: "#E8621A", orangeDim: "#9E3F0A",
  concrete: "#F2EDE6", muted: "#8B94A8", tarmac: "#3D4A5C",
  green: "#2D7A4F", greenDim: "#1A4A30", amber: "#D4920A",
  amberDim: "#7A5206", red: "#C0392B", text: "#E8EAF0", textSoft: "#A8B0C0",
};

function StatusPill({ status, map }) {
  const def = { label: status || "N/A", bg: T.tarmac, text: T.textSoft };
  const s = map?.[status] || def;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
      textTransform: "uppercase", padding: "2px 8px", borderRadius: 3,
      background: s.bg, color: s.text,
    }}>{s.label}</span>
  );
}

const statusMaps = {
  draft: { label: "Draft", bg: T.tarmac, text: T.textSoft },
  submitted: { label: "Submitted", bg: T.amberDim, text: T.amber },
  approved: { label: "Approved", bg: T.greenDim, text: T.green },
  published: { label: "Published", bg: T.greenDim, text: T.green },
  pending: { label: "Pending", bg: "#2a2a2a", text: T.muted },
  paid: { label: "Paid", bg: T.greenDim, text: T.green },
  cancelled: { label: "Cancelled", bg: T.red, text: "#fff" },
  open: { label: "Open", bg: T.orangeDim, text: T.orange },
  investigating: { label: "Investigating", bg: T.amberDim, text: T.amber },
  resolved: { label: "Resolved", bg: T.greenDim, text: T.green },
  closed: { label: "Closed", bg: T.tarmac, text: T.muted },
  available: { label: "Available", bg: T.greenDim, text: T.green },
  in_use: { label: "In Use", bg: T.orangeDim, text: T.orange },
  maintenance: { label: "Maintenance", bg: T.amberDim, text: T.amber },
  out_of_service: { label: "Out of Service", bg: T.red, text: "#fff" },
};

function fmtDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtCurrency(v) {
  if (v == null) return "";
  return "BWP " + Number(v).toLocaleString("en-BW", { minimumFractionDigits: 2 });
}

const fieldTypes = {
  text: { tag: "input", props: { type: "text" } },
  number: { tag: "input", props: { type: "number", step: "any" } },
  date: { tag: "input", props: { type: "date" } },
  textarea: { tag: "textarea", props: { rows: 3 } },
  select: { tag: "select", props: {} },
};

function FormField({ field, value, onChange }) {
  const ft = fieldTypes[field.type] || fieldTypes.text;
  const Tag = ft.tag;
  const inputStyle = {
    width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
    background: T.charcoal, color: T.text, fontSize: 13, outline: "none",
    fontFamily: "inherit", resize: "vertical",
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>
        {field.label}{field.required ? " *" : ""}
      </label>
      {field.type === "select" ? (
        <select value={value || ""} onChange={e => onChange(field.key, e.target.value)} style={inputStyle}>
          <option value="">{field.placeholder || `Select ${field.label}`}</option>
          {(field.options || []).map(o =>
            <option key={o.value} value={o.value}>{o.label}</option>
          )}
        </select>
      ) : (
        <Tag
          value={value || ""}
          onChange={e => onChange(field.key, e.target.value)}
          style={inputStyle}
          placeholder={field.placeholder || ""}
          {...ft.props}
        />
      )}
    </div>
  );
}

function FormModal({ title, fields, data, onSave, onClose }) {
  const [form, setForm] = useState({ ...(data || {}) });
  const [saving, setSaving] = useState(false);

  const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.6)", display: "flex",
      alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`,
        padding: 28, width: 520, maxHeight: "90vh", overflowY: "auto",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700,
          letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 20,
        }}>{data ? "Edit" : "New"} {title}</div>
        <form onSubmit={handleSubmit}>
          {fields.map(f => (
            <FormField key={f.key} field={f} value={form[f.key]} onChange={handleChange} />
          ))}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" onClick={onClose} style={{
              padding: "8px 20px", borderRadius: 6, border: `1px solid ${T.border}`,
              background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer",
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding: "8px 20px", borderRadius: 6, border: "none",
              background: saving ? T.border : T.orange, color: "#fff",
              fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
            }}>{saving ? "Saving..." : data ? "Update" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompanyHeader({ company }) {
  if (!company?.company_name) return null;
  return (
    <div style={{
      background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`,
      padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 16,
    }}>
      {company.logo ? (
        <img src={company.logo} alt="" style={{ height: 40, borderRadius: 4 }} />
      ) : (
        <div style={{
          width: 40, height: 40, borderRadius: 6, background: T.orange,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, fontWeight: 800, color: "#fff",
          fontFamily: "'Barlow Condensed', sans-serif",
        }}>{company.company_name?.charAt(0)?.toUpperCase() || "C"}</div>
      )}
      <div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, color: T.text }}>
          {company.company_name}
        </div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
          {[company.email, company.phone, company.address].filter(Boolean).join(" · ")}
        </div>
      </div>
    </div>
  );
}

function DetailModal({ item, fields, onClose }) {
  if (!item) return null;
  const fmt = (v) => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (v instanceof Date || (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))) {
      const d = new Date(v);
      if (!isNaN(d)) return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
    if (typeof v === "number") return v % 1 === 0 ? v.toLocaleString() : v.toFixed(2);
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 28, width: 560, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 20 }}>📄 Details</div>
        <div style={{ display: "grid", gap: 10 }}>
          {fields.map(f => {
            const val = item[f.key];
            if (val === null || val === undefined) return null;
            return (
              <div key={f.key}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{f.label || f.key}</div>
                <div style={{ fontSize: 13, color: T.text, padding: "6px 0", borderBottom: `1px solid ${T.border}`, wordBreak: "break-word" }}>
                  {fmt(val)}
                </div>
              </div>
            );
          })}
          <div key="_id">
            <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Record ID</div>
            <div style={{ fontSize: 13, color: T.muted, padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontFamily: "monospace", wordBreak: "break-word" }}>
              {item.id}
            </div>
          </div>
          {item.created_at && (
            <div key="_created">
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>Created At</div>
              <div style={{ fontSize: 13, color: T.text, padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>
                {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

function CrudPage({ resource, title, icon, columns, fields, defaultData, projectFilter, company }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = projectFilter ? { project_id: projectFilter } : {};
      const data = await resource.list(params);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load", title, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [resource, title, projectFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    if (editing) {
      await resource.update(editing.id, form);
    } else {
      await resource.create({ ...defaultData, ...form, project_id: projectFilter || form.project_id });
    }
    setEditing(null);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this record?")) return;
    try {
      await resource.delete(id);
      load();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const openEdit = (item) => {
    setEditing(item);
    setShowForm(true);
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  if (loading) return <div style={{ padding: 40, color: T.muted, textAlign: "center" }}>Loading {title}...</div>;

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <CompanyHeader company={company} />
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20,
      }}>
        <div style={{
          fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800,
          letterSpacing: "0.04em", textTransform: "uppercase", color: T.text,
        }}>{icon} {title}</div>
        <button onClick={openCreate} style={{
          padding: "8px 20px", borderRadius: 6, border: "none",
          background: T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
        }}>+ Add New</button>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: T.muted, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>
          No records yet. Click "+ Add New" to create the first entry.
        </div>
      ) : (
        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.panel }}>
                {columns.map(c => (
                  <th key={c.key} style={{
                    padding: "10px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase", color: T.muted, textAlign: "left",
                    borderBottom: `1px solid ${T.border}`,
                  }}>{c.label}</th>
                ))}
                <th style={{
                  padding: "10px 14px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", color: T.muted, textAlign: "right",
                  borderBottom: `1px solid ${T.border}`,
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id || i} style={{ borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  {columns.map(c => (
                    <td key={c.key} style={{ padding: "10px 14px", fontSize: 12, color: T.text }}>
                      {c.render ? c.render(item[c.key], item) : item[c.key]}
                    </td>
                  ))}
                  <td style={{ padding: "10px 14px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => setViewing(item)} style={{
                      padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`,
                      background: "transparent", color: T.textSoft, fontSize: 11, cursor: "pointer", marginRight: 4,
                    }}>View</button>
                    <button onClick={() => openEdit(item)} style={{
                      padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`,
                      background: "transparent", color: T.textSoft, fontSize: 11, cursor: "pointer", marginRight: 4,
                    }}>Edit</button>
                    <button onClick={() => handleDelete(item.id)} style={{
                      padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.red}`,
                      background: "transparent", color: T.red, fontSize: 11, cursor: "pointer",
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <FormModal
          title={title}
          fields={fields}
          data={editing}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      {viewing && (
        <DetailModal item={viewing} fields={fields} onClose={() => setViewing(null)} />
      )}
    </div>
  );
}

const statusField = (key, options, label) => ({
  key, label: label || "Status", type: "select",
  options: (options || []).map(v => ({ value: v, label: v.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) })),
});

const textField = (key, label, opts = {}) => ({ key, label, type: "text", ...opts });
const numberField = (key, label, opts = {}) => ({ key, label, type: "number", ...opts });
const dateField = (key, label, opts = {}) => ({ key, label, type: "date", ...opts });
const textareaField = (key, label, opts = {}) => ({ key, label, type: "textarea", ...opts });
const selectField = (key, label, options, opts = {}) => ({ key, label, type: "select", options, ...opts });

function fmtPill(status, map) {
  return status ? <StatusPill status={status} map={map} /> : "";
}

// ─── Site Reports ────────────────────────────────────────────────────────────

const siteReportFields = [
  dateField("report_date", "Report Date", { required: true }),
  textField("weather", "Weather"),
  textField("temperature", "Temperature"),
  selectField("status", "Status", [
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
  ]),
  textareaField("work_done", "Work Done"),
  textareaField("issues", "Issues / Challenges"),
  textareaField("planned_next", "Planned for Next Period"),
];

const siteReportColumns = [
  { key: "report_date", label: "Date", render: (v) => fmtDate(v) },
  { key: "weather", label: "Weather" },
  { key: "work_done", label: "Work Done", render: (v) => v?.length > 60 ? v.slice(0, 60) + "..." : v },
  { key: "status", label: "Status", render: (v) => fmtPill(v, statusMaps) },
];

export function SiteReportsPage() {
  return <CrudPage resource={api.siteReports} title="Site Reports" icon="📋" columns={siteReportColumns} fields={siteReportFields} />;
}

// ─── Equipment ───────────────────────────────────────────────────────────────

const equipmentFields = [
  textField("name", "Equipment Name", { required: true }),
  selectField("equipment_type", "Type", [
    { value: "excavator", label: "Excavator" },
    { value: "grader", label: "Grader" },
    { value: "roller", label: "Roller" },
    { value: "truck", label: "Truck" },
    { value: "dozer", label: "Dozer" },
    { value: "loader", label: "Loader" },
    { value: "crane", label: "Crane" },
    { value: "compactor", label: "Compactor" },
    { value: "water_tanker", label: "Water Tanker" },
    { value: "other", label: "Other" },
  ]),
  textField("make", "Make"),
  textField("model", "Model"),
  textField("registration", "Registration"),
  selectField("status", "Status", [
    { value: "available", label: "Available" },
    { value: "in_use", label: "In Use" },
    { value: "maintenance", label: "Maintenance" },
    { value: "out_of_service", label: "Out of Service" },
  ]),
  numberField("hours_used", "Hours Used"),
  numberField("fuel_consumption", "Fuel Consumption (L/hr)"),
  textareaField("notes", "Notes"),
];

const equipmentColumns = [
  { key: "name", label: "Name" },
  { key: "equipment_type", label: "Type" },
  { key: "registration", label: "Registration" },
  { key: "status", label: "Status", render: (v) => fmtPill(v, statusMaps) },
  { key: "hours_used", label: "Hours", render: (v) => v != null ? v.toLocaleString() : "" },
];

export function EquipmentPage() {
  return <CrudPage resource={api.equipment} title="Equipment" icon="🚜" columns={equipmentColumns} fields={equipmentFields} />;
}

// ─── Materials ───────────────────────────────────────────────────────────────

const materialsFields = [
  textField("name", "Material Name", { required: true }),
  selectField("category", "Category", [
    { value: "aggregate", label: "Aggregate" },
    { value: "cement", label: "Cement" },
    { value: "steel", label: "Steel" },
    { value: "fuel", label: "Fuel" },
    { value: "bitumen", label: "Bitumen" },
    { value: "timber", label: "Timber" },
    { value: "pipe", label: "Pipe" },
    { value: "electrical", label: "Electrical" },
    { value: "safety", label: "Safety Equipment" },
    { value: "other", label: "Other" },
  ]),
  numberField("quantity", "Quantity", { required: true }),
  textField("unit", "Unit", { required: true, placeholder: "tons, m³, liters, pieces" }),
  numberField("unit_price", "Unit Price (BWP)"),
  textField("supplier", "Supplier"),
  dateField("received_date", "Received Date"),
  textareaField("notes", "Notes"),
];

const materialsColumns = [
  { key: "name", label: "Material" },
  { key: "category", label: "Category" },
  { key: "quantity", label: "Qty", render: (v) => v != null ? v.toLocaleString() : "" },
  { key: "unit", label: "Unit" },
  { key: "unit_price", label: "Price", render: (v) => fmtCurrency(v) },
  { key: "supplier", label: "Supplier" },
];

export function MaterialsPage() {
  return <CrudPage resource={api.materials} title="Materials" icon="📦" columns={materialsColumns} fields={materialsFields} />;
}

// ─── Attendance ──────────────────────────────────────────────────────────────

const attendanceFields = [
  textField("worker_name", "Worker Name", { required: true }),
  dateField("date", "Date", { required: true }),
  numberField("hours_worked", "Hours Worked", { required: true }),
  textField("task", "Task / Activity"),
  numberField("pay_rate", "Pay Rate (BWP/hr)"),
  textareaField("notes", "Notes"),
];

const attendanceColumns = [
  { key: "worker_name", label: "Worker" },
  { key: "date", label: "Date", render: (v) => fmtDate(v) },
  { key: "hours_worked", label: "Hours", render: (v) => v != null ? v.toFixed(1) : "" },
  { key: "task", label: "Task" },
];

export function AttendancePage() {
  return <CrudPage resource={api.attendance} title="Attendance" icon="👷" columns={attendanceColumns} fields={attendanceFields} />;
}

// ─── Financial ───────────────────────────────────────────────────────────────

const financialFields = [
  selectField("record_type", "Record Type", [
    { value: "invoice", label: "Invoice" },
    { value: "payment", label: "Payment" },
    { value: "expense", label: "Expense" },
    { value: "variation", label: "Variation" },
  ], { required: true }),
  selectField("category", "Category", [
    { value: "materials", label: "Materials" },
    { value: "equipment", label: "Equipment" },
    { value: "labor", label: "Labor" },
    { value: "subcontractor", label: "Subcontractor" },
    { value: "transport", label: "Transport" },
    { value: "admin", label: "Administration" },
    { value: "other", label: "Other" },
  ]),
  numberField("amount", "Amount (BWP)", { required: true }),
  dateField("record_date", "Date", { required: true }),
  textField("reference", "Reference / Invoice #"),
  selectField("status", "Status", [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "paid", label: "Paid" },
    { value: "cancelled", label: "Cancelled" },
  ]),
  textareaField("description", "Description"),
];

const financialColumns = [
  { key: "record_type", label: "Type", render: (v) => v?.replace(/\b\w/g, c => c.toUpperCase()) },
  { key: "description", label: "Description", render: (v) => v?.length > 40 ? v.slice(0, 40) + "..." : v },
  { key: "amount", label: "Amount", render: (v) => fmtCurrency(v) },
  { key: "record_date", label: "Date", render: (v) => fmtDate(v) },
  { key: "reference", label: "Reference" },
  { key: "status", label: "Status", render: (v) => fmtPill(v, statusMaps) },
];

export function FinancialPage({ company }) {
  return <CrudPage resource={api.financial} title="Financial" icon="💰" columns={financialColumns} fields={financialFields} company={company} />;
}

// ─── Safety ──────────────────────────────────────────────────────────────────

const safetyFields = [
  dateField("incident_date", "Incident Date", { required: true }),
  selectField("severity", "Severity", [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "critical", label: "Critical" },
  ], { required: true }),
  selectField("incident_type", "Incident Type", [
    { value: "accident", label: "Accident" },
    { value: "near_miss", label: "Near Miss" },
    { value: "hazard", label: "Hazard" },
    { value: "injury", label: "Injury" },
    { value: "property_damage", label: "Property Damage" },
    { value: "environmental", label: "Environmental" },
  ]),
  textField("location", "Location"),
  selectField("status", "Status", [
    { value: "open", label: "Open" },
    { value: "investigating", label: "Investigating" },
    { value: "resolved", label: "Resolved" },
    { value: "closed", label: "Closed" },
  ]),
  textareaField("description", "Description"),
  textareaField("action_taken", "Action Taken"),
];

const safetyColumns = [
  { key: "incident_date", label: "Date", render: (v) => fmtDate(v) },
  { key: "severity", label: "Severity", render: (v) => fmtPill(v, {
    low: { label: "Low", bg: T.greenDim, text: T.green },
    medium: { label: "Medium", bg: T.amberDim, text: T.amber },
    high: { label: "High", bg: T.orangeDim, text: T.orange },
    critical: { label: "Critical", bg: "#6B1A1A", text: "#FF6B6B" },
  }) },
  { key: "incident_type", label: "Type", render: (v) => v?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) },
  { key: "description", label: "Description", render: (v) => v?.length > 50 ? v.slice(0, 50) + "..." : v },
  { key: "status", label: "Status", render: (v) => fmtPill(v, statusMaps) },
];

export function SafetyPage() {
  return <CrudPage resource={api.safety} title="Safety" icon="🛡️" columns={safetyColumns} fields={safetyFields} />;
}

// ─── Documents ───────────────────────────────────────────────────────────────

// ─── Documents (with file upload) ────────────────────────────────────────────

const docFields = [
  textField("name", "Document Name", { required: true }),
  selectField("doc_type", "Document Type", [
    { value: "drawing", label: "Drawing" }, { value: "contract", label: "Contract" },
    { value: "report", label: "Report" }, { value: "photo", label: "Photo" },
    { value: "invoice", label: "Invoice" }, { value: "correspondence", label: "Correspondence" },
    { value: "timesheet", label: "Timesheet" }, { value: "other", label: "Other" },
  ]),
  { key: "file_upload", label: "File (PDF, Image, etc.)", type: "file" },
  textField("tags", "Tags (comma-separated)"),
  textareaField("description", "Description"),
];

const docColumns = [
  { key: "name", label: "Name" },
  { key: "doc_type", label: "Type", render: (v) => v?.replace(/\b\w/g, c => c.toUpperCase()) },
  { key: "tags", label: "Tags" },
  { key: "created_at", label: "Uploaded", render: (v) => fmtDate(v) },
];

export function DocumentsPage({ company }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.documents.list();
      setItems(Array.isArray(data) ? data : []);
    } catch (_) { setItems([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    try {
      let file_url = editing?.file_url || "";
      if (form._file) {
        setUploading(true);
        const uploadRes = await api.uploadFile(form._file);
        file_url = uploadRes.file_url;
        setUploading(false);
      }
      const payload = { name: form.name, doc_type: form.doc_type || "other", tags: form.tags, description: form.description, file_url, project_id: form.project_id || "" };
      if (!editing && !payload.project_id) {
        const pl = await api.getProjects();
        if (pl.length > 0) payload.project_id = pl[0].id;
        else { alert("No project found"); return; }
      }
      if (editing) {
        await api.documents.update(editing.id, payload);
      } else {
        await api.documents.create(payload);
      }
      setEditing(null); setShowForm(false); load();
    } catch (ex) { alert("Error: " + ex.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
    try { await api.documents.delete(id); load(); } catch (ex) { alert("Delete failed: " + ex.message); }
  };

  const btn = { padding: "6px 14px", borderRadius: 4, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6 };
  const tblHd = { padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, textAlign: "left", borderBottom: `1px solid ${T.border}` };
  const tblCe = { padding: "8px 12px", fontSize: 12, color: T.text };
  const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.charcoal, color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" };

  if (loading) return <div style={{ padding: 40, color: T.muted, textAlign: "center" }}>Loading Documents...</div>;

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <CompanyHeader company={company} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: T.text }}>📄 Documents</div>
        <button onClick={() => { setEditing(null); setShowForm(true); }} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Upload Document</button>
      </div>

      {items.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: T.muted, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>No documents yet. Click "+ Upload Document" to add one.</div>
      ) : (
        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={tblHd}>Name</th><th style={tblHd}>Type</th><th style={tblHd}>Tags</th><th style={tblHd}>Uploaded</th><th style={{ ...tblHd, textAlign: "right" }}>Actions</th>
            </tr></thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <td style={tblCe}>
                    {item.file_url ? <a href={item.file_url} target="_blank" rel="noreferrer" style={{ color: T.orange }}>{item.name}</a> : item.name}
                  </td>
                  <td style={tblCe}>{item.doc_type?.replace(/\b\w/g, c => c.toUpperCase())}</td>
                  <td style={tblCe}>{item.tags}</td>
                  <td style={tblCe}>{fmtDate(item.created_at)}</td>
                  <td style={{ ...tblCe, textAlign: "right" }}>
                    <button onClick={() => { setEditing(item); setShowForm(true); }} style={{ padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.border}`, background: "transparent", color: T.textSoft, fontSize: 11, cursor: "pointer", marginRight: 4 }}>Edit</button>
                    <button onClick={() => handleDelete(item.id)} style={{ padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.red}`, background: "transparent", color: T.red, fontSize: 11, cursor: "pointer" }}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <DocForm editing={editing} onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} uploading={uploading} />
      )}
    </div>
  );
}

function DocForm({ editing, onSave, onClose, uploading }) {
  const [form, setForm] = useState({ name: editing?.name || "", doc_type: editing?.doc_type || "", tags: editing?.tags || "", description: editing?.description || "", _file: null });
  const h = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.charcoal, color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 28, width: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 20 }}>{editing ? "Edit" : "Upload"} Document</div>
        <form onSubmit={async (e) => { e.preventDefault(); onSave(form); }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>Document Name *</label>
            <input value={form.name} onChange={e => h("name", e.target.value)} style={inputStyle} placeholder="e.g. Site Photo — Section A" required />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>Document Type</label>
            <select value={form.doc_type} onChange={e => h("doc_type", e.target.value)} style={inputStyle}>
              <option value="">Select type</option>
              {["drawing","contract","report","photo","invoice","correspondence","timesheet","other"].map(o => <option key={o} value={o}>{o.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>File (PDF, Image, etc.)</label>
            {editing?.file_url && <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Current: <a href={editing.file_url} target="_blank" rel="noreferrer" style={{ color: T.orange }}>{editing.file_url}</a></div>}
            <input type="file" onChange={e => h("_file", e.target.files[0])} style={{ width: "100%", color: T.text, fontSize: 13 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>Tags</label>
            <input value={form.tags} onChange={e => h("tags", e.target.value)} style={inputStyle} placeholder="comma-separated" />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>Description</label>
            <textarea value={form.description} onChange={e => h("description", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} rows={3} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" onClick={onClose} disabled={uploading} style={{ padding: "8px 20px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={uploading} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: uploading ? T.border : T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer" }}>{uploading ? "Uploading..." : editing ? "Update" : "Upload"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────

const reportFields = [
  textField("name", "Report Name", { required: true }),
  selectField("report_type", "Report Type", [
    { value: "weekly", label: "Weekly Progress" },
    { value: "monthly", label: "Monthly Progress" },
    { value: "financial", label: "Financial Summary" },
    { value: "safety", label: "Safety Report" },
    { value: "completion", label: "Completion Certificate" },
    { value: "other", label: "Other" },
  ]),
  dateField("generated_date", "Generated Date", { required: true }),
  selectField("status", "Status", [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
  ]),
  textareaField("content", "Content"),
];

const reportColumns = [
  { key: "name", label: "Name" },
  { key: "report_type", label: "Type", render: (v) => v?.replace(/\b\w/g, c => c.toUpperCase()) },
  { key: "generated_date", label: "Date", render: (v) => fmtDate(v) },
  { key: "status", label: "Status", render: (v) => fmtPill(v, statusMaps) },
];

export function ReportsPage({ company }) {
  return <CrudPage resource={api.reports} title="Reports" icon="📊" columns={reportColumns} fields={reportFields} company={company} />;
}

// ─── Settings ────────────────────────────────────────────────────────────────

const roleOptions = [
  { value: "administrator", label: "Administrator" },
  { value: "project_manager", label: "Project Manager" },
  { value: "site_engineer", label: "Site Engineer" },
  { value: "foreman", label: "Foreman" },
  { value: "storekeeper", label: "Storekeeper" },
  { value: "equipment_manager", label: "Equipment Manager" },
  { value: "accountant", label: "Accountant" },
  { value: "client", label: "Client" },
];

const inputS = {
  width: "100%", padding: "8px 10px", borderRadius: 6,
  border: `1px solid ${T.border}`, background: T.charcoal, color: T.text,
  fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical",
};

export function SettingsPage({ user, company, onCompanyUpdate }) {
  const isAdmin = user?.role === "administrator";

  const [pwd, setPwd] = useState({ current: "", newPwd: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");

  const [compForm, setCompForm] = useState(company || {});
  const [compSaved, setCompSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: "", last_name: "", email: "", password: "", role: "site_engineer", job_title: "" });
  const [userMsg, setUserMsg] = useState("");
  const [resetPwdFor, setResetPwdFor] = useState(null);
  const [resetPwdVal, setResetPwdVal] = useState("");

  useEffect(() => { if (company) setCompForm(company); }, [company]);

  const loadUsers = useCallback(async () => {
    if (!isAdmin) return;
    try { const d = await api.getUsers(); setUsers(Array.isArray(d) ? d : []); } catch (_) { setUsers([]); }
  }, [isAdmin]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleChangePwd = async (e) => {
    e.preventDefault();
    setPwdMsg(""); setPwdErr("");
    if (pwd.newPwd !== pwd.confirm) { setPwdErr("Passwords do not match"); return; }
    if (pwd.newPwd.length < 8) { setPwdErr("Password must be at least 8 characters"); return; }
    try {
      await api.changePassword(pwd.current, pwd.newPwd);
      setPwdMsg("Password changed successfully");
      setPwd({ current: "", newPwd: "", confirm: "" });
    } catch (ex) { setPwdErr("Error: " + ex.message); }
  };

  const handleSaveCompany = async () => {
    try {
      await api.updateCompanySettings(compForm);
      setCompSaved(true);
      if (onCompanyUpdate) onCompanyUpdate();
      setTimeout(() => setCompSaved(false), 3000);
    } catch (ex) { alert("Error saving company info: " + ex.message); }
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const res = await api.uploadLogo(file);
      setCompForm(p => ({ ...p, logo: res.logo }));
      if (onCompanyUpdate) onCompanyUpdate();
    } catch (ex) { alert("Logo upload failed: " + ex.message); }
    finally { setLogoUploading(false); }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser);
      setShowUserForm(false);
      setNewUser({ first_name: "", last_name: "", email: "", password: "", role: "site_engineer", job_title: "" });
      setUserMsg("User created successfully");
      loadUsers();
      setTimeout(() => setUserMsg(""), 3000);
    } catch (ex) { alert("Error creating user: " + ex.message); }
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try { await api.deleteUser(id); loadUsers(); } catch (ex) { alert("Delete failed: " + ex.message); }
  };

  const handleResetPwdSubmit = async (id) => {
    if (!resetPwdVal || resetPwdVal.length < 8) { alert("Password must be at least 8 characters"); return; }
    try {
      await api.resetUserPassword(id, resetPwdVal);
      setResetPwdFor(null);
      setResetPwdVal("");
      setUserMsg("Password reset successfully");
      setTimeout(() => setUserMsg(""), 3000);
    } catch (ex) { alert("Reset failed: " + ex.message); }
  };

  // ── Shared table styles ──────────────────────────────────────────────────
  const secHd = { fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 16 };
  const tblHd = { padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, textAlign: "left", borderBottom: `1px solid ${T.border}` };
  const tblCe = { padding: "8px 12px", fontSize: 12, color: T.text };

  return (
    <div style={{ padding: "28px 28px 40px", maxWidth: 900 }}>
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800,
        letterSpacing: "0.04em", textTransform: "uppercase", color: T.text, marginBottom: 24,
      }}>⚙️ Settings</div>

      {/* ── Profile ──────────────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
        <div style={secHd}>Profile</div>
        <div style={{ display: "grid", gap: 12, fontSize: 13 }}>
          <div><span style={{ color: T.muted }}>Name:</span> <span style={{ color: T.text }}>{user?.full_name}</span></div>
          <div><span style={{ color: T.muted }}>Role:</span> <span style={{ color: T.text }}>{user?.role?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</span></div>
          <div><span style={{ color: T.muted }}>Email:</span> <span style={{ color: T.text }}>{user?.email}</span></div>
        </div>
      </div>

      {/* ── Change Password ──────────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
        <div style={secHd}>Change Password</div>
        {pwdMsg && <div style={{ color: T.green, fontSize: 12, marginBottom: 12 }}>{pwdMsg}</div>}
        {pwdErr && <div style={{ color: T.red, fontSize: 12, marginBottom: 12 }}>{pwdErr}</div>}
        <form onSubmit={handleChangePwd} style={{ maxWidth: 400 }}>
          <input type="password" placeholder="Current password" value={pwd.current}
            onChange={e => setPwd(p => ({ ...p, current: e.target.value }))}
            style={{ ...inputS, marginBottom: 12 }} />
          <input type="password" placeholder="New password" value={pwd.newPwd}
            onChange={e => setPwd(p => ({ ...p, newPwd: e.target.value }))}
            style={{ ...inputS, marginBottom: 12 }} />
          <input type="password" placeholder="Confirm new password" value={pwd.confirm}
            onChange={e => setPwd(p => ({ ...p, confirm: e.target.value }))}
            style={{ ...inputS, marginBottom: 20 }} />
          <button type="submit" style={{
            padding: "8px 24px", borderRadius: 6, border: "none",
            background: T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>Update Password</button>
        </form>
      </div>

      {/* ── Company Information ────────────────────────────────────────── */}
      <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 24, marginBottom: 20 }}>
        <div style={secHd}>Company Information</div>
        {compSaved && <div style={{ color: T.green, fontSize: 12, marginBottom: 12 }}>Company info saved</div>}
        <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Company Name</label>
            <input value={compForm.company_name || ""} onChange={e => setCompForm(p => ({ ...p, company_name: e.target.value }))} style={inputS} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Logo</label>
            {compForm.logo && <div style={{ marginBottom: 8 }}>
              <img src={compForm.logo} alt="Logo" style={{ maxHeight: 60, borderRadius: 4 }} />
              <div style={{ fontSize: 11, color: T.muted }}>{compForm.logo}</div>
            </div>}
            <input type="file" accept="image/*" onChange={handleUploadLogo} style={{ color: T.text, fontSize: 13 }} disabled={logoUploading} />
            {logoUploading && <span style={{ color: T.muted, fontSize: 12, marginLeft: 8 }}>Uploading...</span>}
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Email</label>
            <input value={compForm.email || ""} onChange={e => setCompForm(p => ({ ...p, email: e.target.value }))} style={inputS} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Phone</label>
            <input value={compForm.phone || ""} onChange={e => setCompForm(p => ({ ...p, phone: e.target.value }))} style={inputS} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Address</label>
            <textarea value={compForm.address || ""} onChange={e => setCompForm(p => ({ ...p, address: e.target.value }))} style={inputS} rows={2} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Website</label>
            <input value={compForm.website || ""} onChange={e => setCompForm(p => ({ ...p, website: e.target.value }))} style={inputS} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 4 }}>Tax ID</label>
            <input value={compForm.tax_id || ""} onChange={e => setCompForm(p => ({ ...p, tax_id: e.target.value }))} style={inputS} />
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={handleSaveCompany} style={{
              padding: "8px 24px", borderRadius: 6, border: "none",
              background: T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>Save Company Info</button>
          </div>
        </div>
      </div>

      {/* ── User Management (Admin only) ────────────────────────────────── */}
      {isAdmin && (
        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={secHd}>User Management</div>
            <button onClick={() => setShowUserForm(true)} style={{
              padding: "6px 16px", borderRadius: 6, border: "none",
              background: T.orange, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>+ Add User</button>
          </div>

          {userMsg && <div style={{ color: T.green, fontSize: 12, marginBottom: 12 }}>{userMsg}</div>}

          {users.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 13 }}>No users found.</div>
          ) : (
            <div style={{ overflow: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr>
                  <th style={tblHd}>Name</th><th style={tblHd}>Email</th><th style={tblHd}>Role</th><th style={tblHd}>Status</th><th style={{ ...tblHd, textAlign: "right" }}>Actions</th>
                </tr></thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: i < users.length - 1 ? `1px solid ${T.border}` : "none" }}>
                      <td style={tblCe}>{u.full_name}</td>
                      <td style={{ ...tblCe, color: T.muted }}>{u.email}</td>
                      <td style={tblCe}>{u.role?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</td>
                      <td style={tblCe}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
                          padding: "2px 8px", borderRadius: 3,
                          background: u.is_active ? T.greenDim : T.amberDim,
                          color: u.is_active ? T.green : T.amber,
                        }}>{u.is_active ? "Active" : "Inactive"}</span>
                      </td>
                      <td style={{ ...tblCe, textAlign: "right" }}>
                        <button onClick={() => setResetPwdFor(u)} style={{
                          padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.border}`,
                          background: "transparent", color: T.textSoft, fontSize: 11, cursor: "pointer", marginRight: 4,
                        }}>Reset Pwd</button>
                        <button onClick={() => handleDeleteUser(u.id, u.full_name)} style={{
                          padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.red}`,
                          background: "transparent", color: T.red, fontSize: 11, cursor: "pointer",
                        }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Add User Modal ─────────────────────────────────────────────── */}
      {showUserForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowUserForm(false)}>
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 28, width: 480 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 20 }}>Add User</div>
            <form onSubmit={handleAddUser}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <input placeholder="First Name *" value={newUser.first_name} onChange={e => setNewUser(p => ({ ...p, first_name: e.target.value }))} style={inputS} required />
                  <input placeholder="Last Name *" value={newUser.last_name} onChange={e => setNewUser(p => ({ ...p, last_name: e.target.value }))} style={inputS} required />
                </div>
                <input type="email" placeholder="Email *" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} style={inputS} required />
                <input type="password" placeholder="Password * (min 8 chars)" value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))} style={inputS} required />
                <input placeholder="Job Title" value={newUser.job_title} onChange={e => setNewUser(p => ({ ...p, job_title: e.target.value }))} style={inputS} />
                <select value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value }))} style={inputS}>
                  {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                <button type="button" onClick={() => setShowUserForm(false)} style={{ padding: "8px 20px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ──────────────────────────────────────── */}
      {resetPwdFor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setResetPwdFor(null); setResetPwdVal(""); }}>
          <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 28, width: 400 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 16 }}>Reset Password</div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 12 }}>New password for <strong style={{ color: T.text }}>{resetPwdFor.full_name}</strong> ({resetPwdFor.email}):</div>
            <input type="password" placeholder="New password (min 8 chars)" value={resetPwdVal}
              onChange={e => setResetPwdVal(e.target.value)} style={inputS} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => { setResetPwdFor(null); setResetPwdVal(""); }} style={{ padding: "8px 20px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleResetPwdSubmit(resetPwdFor.id)} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Projects Management (project list + detail with sections & milestones) ──

const projFields = [
  textField("name", "Project Name", { required: true }),
  textField("project_number", "Project Number", { required: true }),
  textField("location", "Location", { required: true }),
  textField("district", "District"),
  textField("village", "Village"),
  numberField("total_length_km", "Total Length (km)"),
  selectField("surface_type", "Surface Type", [
    { value: "gravel", label: "Gravel" }, { value: "bitumen", label: "Bitumen" },
    { value: "concrete", label: "Concrete" }, { value: "paved", label: "Paved" },
  ]),
  dateField("planned_start", "Planned Start", { required: true }),
  dateField("planned_end", "Planned End", { required: true }),
  numberField("contract_value", "Contract Value (BWP)"),
  selectField("status", "Status", [
    { value: "planning", label: "Planning" }, { value: "mobilising", label: "Mobilising" },
    { value: "active", label: "Active" }, { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
  ]),
  textField("client_name", "Client Name"),
  textareaField("description", "Description"),
];

const sectionFields = [
  textField("section_name", "Section Name", { required: true }),
  numberField("chainage_start", "Chainage Start (km)"),
  numberField("chainage_end", "Chainage End (km)"),
  numberField("length_km", "Length (km)"),
  selectField("status", "Status", [
    { value: "not_started", label: "Not Started" }, { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" }, { value: "defective", label: "Defective" },
  ]),
  numberField("completion_pct", "Completion %"),
  dateField("planned_start", "Planned Start"),
  dateField("planned_end", "Planned End"),
];

const milestoneFields = [
  textField("title", "Title", { required: true }),
  dateField("due_date", "Due Date", { required: true }),
  selectField("status", "Status", [
    { value: "pending", label: "Pending" }, { value: "in_progress", label: "In Progress" },
    { value: "achieved", label: "Achieved" }, { value: "overdue", label: "Overdue" },
  ]),
  numberField("weight_pct", "Weight %"),
  textareaField("description", "Description"),
];

function SectionForm({ fields, data, onSave, onClose, title }) {
  const [form, setForm] = useState({ ...(data || {}) });
  const [saving, setSaving] = useState(false);
  const h = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const submit = async (e) => { e.preventDefault(); setSaving(true); try { await onSave(form); onClose(); } catch (ex) { alert("Error: " + ex.message); } finally { setSaving(false); } };
  const inputStyle = { width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.charcoal, color: T.text, fontSize: 13, outline: "none", fontFamily: "inherit", resize: "vertical" };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: T.surface, borderRadius: 12, border: `1px solid ${T.border}`, padding: 28, width: 500, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 18, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.text, marginBottom: 20 }}>{data ? "Edit" : "New"} {title}</div>
        <form onSubmit={submit}>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: T.muted, display: "block", marginBottom: 4, fontWeight: 600 }}>{f.label}{f.required ? " *" : ""}</label>
              {f.type === "select" ? (
                <select value={form[f.key] || ""} onChange={e => h(f.key, e.target.value)} style={inputStyle}>
                  <option value="">Select {f.label}</option>
                  {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={form[f.key] || ""} onChange={e => h(f.key, e.target.value)} style={inputStyle} placeholder={f.placeholder || ""} step={f.type === "number" ? "any" : undefined} />
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button type="button" onClick={onClose} style={{ padding: "8px 20px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: saving ? T.border : T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving..." : data ? "Update" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const projCrud = projectCrud();

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [sections, setSections] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [editingProj, setEditingProj] = useState(null);
  const [editingSec, setEditingSec] = useState(null);
  const [editingMs, setEditingMs] = useState(null);
  const [subLoading, setSubLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    try {
      const data = await api.getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (_) { setProjects([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const loadDetail = useCallback(async (id) => {
    setSubLoading(true);
    try {
      const [proj, secs, ms] = await Promise.all([
        api.getProject(id), api.getSections(id), api.getMilestones(id),
      ]);
      setSelected(proj);
      setSections(Array.isArray(secs) ? secs : []);
      setMilestones(Array.isArray(ms) ? ms : []);
    } catch (_) { setSelected(null); } finally { setSubLoading(false); }
  }, []);

  const saveProject = async (form) => {
    if (editingProj) {
      await projCrud.update(editingProj.id, form);
      setEditingProj(null);
      await loadDetail(editingProj.id);
    } else {
      await projCrud.create(form);
      await loadProjects();
    }
  };

  const deleteProject = async (id) => {
    if (!confirm("Archive this project?")) return;
    await projCrud.delete(id);
    setSelected(null);
    loadProjects();
  };

  const saveSection = async (form) => {
    if (editingSec) {
      await projCrud.sections.update(selected.id, editingSec.id, form);
      setEditingSec(null);
    } else {
      await projCrud.sections.create(selected.id, form);
    }
    const secs = await api.getSections(selected.id);
    setSections(Array.isArray(secs) ? secs : []);
  };

  const deleteSection = async (id) => {
    if (!confirm("Delete this section?")) return;
    await projCrud.sections.delete(selected.id, id);
    const secs = await api.getSections(selected.id);
    setSections(Array.isArray(secs) ? secs : []);
  };

  const saveMilestone = async (form) => {
    if (editingMs) {
      await projCrud.milestones.update(selected.id, editingMs.id, form);
      setEditingMs(null);
    } else {
      await projCrud.milestones.create(selected.id, form);
    }
    const ms = await api.getMilestones(selected.id);
    setMilestones(Array.isArray(ms) ? ms : []);
  };

  const deleteMilestone = async (id) => {
    if (!confirm("Delete this milestone?")) return;
    await projCrud.milestones.delete(selected.id, id);
    const ms = await api.getMilestones(selected.id);
    setMilestones(Array.isArray(ms) ? ms : []);
  };

  const btn = { padding: "6px 14px", borderRadius: 4, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", marginRight: 6 };
  const tblHd = { padding: "8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.muted, textAlign: "left", borderBottom: `1px solid ${T.border}` };
  const tblCe = { padding: "8px 12px", fontSize: 12, color: T.text };

  if (loading) return <div style={{ padding: 40, color: T.muted, textAlign: "center" }}>Loading projects...</div>;

  if (selected) {
    return (
      <div style={{ padding: "28px 28px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <span onClick={() => setSelected(null)} style={{ cursor: "pointer", color: T.orange, fontSize: 12, marginRight: 12 }}>&larr; Back to Projects</span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: T.text }}>{selected.name}</span>
            <span style={{ fontSize: 11, color: T.muted, marginLeft: 10 }}>{selected.project_number} &middot; {selected.location}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditingProj(selected)} style={{ ...btn, background: T.orange, color: "#fff" }}>Edit Project</button>
            <button onClick={() => deleteProject(selected.id)} style={{ ...btn, background: "transparent", border: `1px solid ${T.red}`, color: T.red }}>Archive</button>
          </div>
        </div>

        {subLoading && <div style={{ padding: 20, color: T.muted, textAlign: "center" }}>Loading detail...</div>}

        {/* Sections */}
        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 20, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.text }}>Sections</span>
            <button onClick={() => setEditingSec({})} style={{ ...btn, background: T.orange, color: "#fff" }}>+ Add Section</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={tblHd}>Name</th><th style={tblHd}>Chainage</th><th style={tblHd}>Progress</th><th style={tblHd}>Status</th><th style={{ ...tblHd, textAlign: "right" }}>Actions</th>
            </tr></thead>
            <tbody>
              {sections.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < sections.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <td style={tblCe}>{s.section_name}</td>
                  <td style={tblCe}>{s.chainage_start != null ? `${s.chainage_start}–${s.chainage_end} km` : ""}</td>
                  <td style={tblCe}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 80, height: 6, borderRadius: 3, background: T.border }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${s.completion_pct || 0}%`, background: s.completion_pct > 0 ? T.orange : T.tarmac }} />
                      </div>
                      <span>{Math.round(s.completion_pct || 0)}%</span>
                    </div>
                  </td>
                  <td style={tblCe}><StatusPill status={s.status} /></td>
                  <td style={{ ...tblCe, textAlign: "right" }}>
                    <button onClick={() => setEditingSec(s)} style={{ padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.border}`, background: "transparent", color: T.textSoft, fontSize: 11, cursor: "pointer", marginRight: 4 }}>Edit</button>
                    <button onClick={() => deleteSection(s.id)} style={{ padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.red}`, background: "transparent", color: T.red, fontSize: 11, cursor: "pointer" }}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Milestones */}
        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: T.text }}>Milestones</span>
            <button onClick={() => setEditingMs({})} style={{ ...btn, background: T.orange, color: "#fff" }}>+ Add Milestone</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={tblHd}>Title</th><th style={tblHd}>Due Date</th><th style={tblHd}>Status</th><th style={tblHd}>Weight</th><th style={{ ...tblHd, textAlign: "right" }}>Actions</th>
            </tr></thead>
            <tbody>
              {milestones.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: i < milestones.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <td style={tblCe}>{m.title}</td>
                  <td style={tblCe}>{fmtDate(m.due_date)}</td>
                  <td style={tblCe}><StatusPill status={m.status} /></td>
                  <td style={tblCe}>{m.weight_pct || 0}%</td>
                  <td style={{ ...tblCe, textAlign: "right" }}>
                    <button onClick={() => setEditingMs(m)} style={{ padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.border}`, background: "transparent", color: T.textSoft, fontSize: 11, cursor: "pointer", marginRight: 4 }}>Edit</button>
                    <button onClick={() => deleteMilestone(m.id)} style={{ padding: "3px 10px", borderRadius: 3, border: `1px solid ${T.red}`, background: "transparent", color: T.red, fontSize: 11, cursor: "pointer" }}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editingProj && <SectionForm fields={projFields} data={editingProj} title="Project" onSave={saveProject} onClose={() => setEditingProj(null)} />}
        {editingSec && <SectionForm fields={sectionFields} data={editingSec.id ? editingSec : null} title="Section" onSave={saveSection} onClose={() => setEditingSec(null)} />}
        {editingMs && <SectionForm fields={milestoneFields} data={editingMs.id ? editingMs : null} title="Milestone" onSave={saveMilestone} onClose={() => setEditingMs(null)} />}
      </div>
    );
  }

  return (
    <div style={{ padding: "28px 28px 40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: T.text }}>All Projects</div>
        <button onClick={() => setEditingProj({})} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: T.orange, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ New Project</button>
      </div>
      {projects.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: T.muted, background: T.surface, borderRadius: 8, border: `1px solid ${T.border}` }}>No projects yet. Click "+ New Project" to create one.</div>
      ) : (
        <div style={{ background: T.surface, borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>
              <th style={tblHd}>Name</th><th style={tblHd}>Number</th><th style={tblHd}>Location</th><th style={tblHd}>Status</th><th style={tblHd}>Progress</th>
            </tr></thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.id} onClick={() => loadDetail(p.id)} style={{ cursor: "pointer", borderBottom: i < projects.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = T.panel} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={tblCe}>{p.name}</td>
                  <td style={{ ...tblCe, color: T.muted }}>{p.project_number}</td>
                  <td style={{ ...tblCe, color: T.muted }}>{p.location}</td>
                  <td style={tblCe}><StatusPill status={p.status} /></td>
                  <td style={tblCe}>{Math.round(p.completion_pct || 0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editingProj && !editingProj.id && <SectionForm fields={projFields} title="Project" onSave={saveProject} onClose={() => setEditingProj(null)} />}
    </div>
  );
}
