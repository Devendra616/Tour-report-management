const normalizeTime = (value, period = "") => {
  let raw = String(value || "").trim().toUpperCase();
  if (!raw) return null;

  const suffixMatch = raw.match(/\s*(AM|PM)$/);
  const effectivePeriod = suffixMatch ? suffixMatch[1] : String(period || "").toUpperCase();
  if (suffixMatch) raw = raw.replace(/\s*(AM|PM)$/, "").trim();

  let hours;
  let minutes;

  if (/^\d{1,2}$/.test(raw)) {
    hours = Number(raw);
    minutes = 0;
  } else if (/^\d{3,4}$/.test(raw)) {
    const padded = raw.padStart(4, "0");
    hours = Number(padded.slice(0, 2));
    minutes = Number(padded.slice(2));
  } else {
    const match = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    hours = Number(match[1]);
    minutes = Number(match[2]);
  }

  if (effectivePeriod) {
    if (!["AM", "PM"].includes(effectivePeriod) || hours < 1 || hours > 12) return null;
    hours = effectivePeriod === "AM" ? (hours === 12 ? 0 : hours) : (hours === 12 ? 12 : hours + 12);
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const validateSubmittedReport = (body, hasApprovalNote) => {
  const required = [
    body.name,
    body.designation,
    body.grade,
    body.department,
    body.tour_type,
    body.purpose,
    body.start_date,
    body.start_time,
    body.start_place,
    body.end_date,
    body.end_time,
    body.destination,
    body.mode_of_travel,
    body.weekly_off,
    body.approving_authority,
  ];

  if (required.some((value) => !String(value || "").trim())) return "Please fill all required fields.";
  if (!hasApprovalNote) return "Approval note is required.";
  if (new Date(body.start_date) > new Date(body.end_date)) return "End date cannot be before start date.";

  const startTime = normalizeTime(body.start_time, body.start_period);
  const endTime = normalizeTime(body.end_time, body.end_period);
  if (!startTime || !endTime) return "Start time and end time are required.";

  if (body.start_date === body.end_date && startTime >= endTime) {
    return "End time must be after start time for same-day tour.";
  }

  const start = new Date(`${body.start_date}T${startTime}`);
  const end = new Date(`${body.end_date}T${endTime}`);
  if (end <= start) return "End date/time must be after start date/time.";

  return "";
};

module.exports = { normalizeTime, validateSubmittedReport };
