import { format, parseISO, isBefore, startOfDay } from "date-fns";

export const STATUSES = ["To Do", "In Progress", "Done"];
export const PRIORITIES = ["Low", "Medium", "High"];

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  try { return format(parseISO(dateStr), "MMM d, yyyy"); }
  catch { return dateStr; }
}

export function isOverdue(dateStr, status) {
  if (!dateStr) return false;
  if (status === "Done") return false;
  return isBefore(parseISO(dateStr), startOfDay(new Date()));
}

export function getStatusBadgeClass(status, overdue) {
  if (overdue) return "badge-overdue";
  if (status === "Done") return "badge-completed";
  if (status === "In Progress") return "badge-in-progress";
  return "badge-pending";
}

export function getPriorityColor(priority) {
  if (priority === "High") return "var(--danger)";
  if (priority === "Medium") return "var(--warning)";
  return "var(--success)";
}

export function getPriorityBg(priority) {
  if (priority === "High") return "var(--danger-dim)";
  if (priority === "Medium") return "var(--warning-dim)";
  return "var(--success-dim)";
}

export function truncate(str, n = 80) {
  if (!str) return "";
  return str.length > n ? str.slice(0, n) + "..." : str;
}
