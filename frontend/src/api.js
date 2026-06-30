const API = "/api/v1";

let _token = null;
let _user = null;

export function setAuth(token, user) {
  _token = token;
  _user = user;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
  if (user) localStorage.setItem("user", JSON.stringify(user));
  else localStorage.removeItem("user");
}

export function loadAuth() {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  if (token && user) {
    _token = token;
    _user = JSON.parse(user);
    return _user;
  }
  return null;
}

export function getToken() { return _token; }
export function getUser() { return _user; }

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function crud(resource) {
  return {
    list: (params = {}) => {
      const qs = Object.entries(params).filter(([_,v]) => v != null).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&");
      return request("GET", `/${resource}${qs ? "?"+qs : ""}`);
    },
    get: (id) => request("GET", `/${resource}/${id}`),
    create: (data) => request("POST", `/${resource}`, data),
    update: (id, data) => request("PATCH", `/${resource}/${id}`, data),
    delete: (id) => request("DELETE", `/${resource}/${id}`),
  };
}

export function projectCrud() {
  return {
    list: () => request("GET", "/projects/"),
    get: (id) => request("GET", `/projects/${id}`),
    create: (data) => request("POST", "/projects/", data),
    update: (id, data) => request("PATCH", `/projects/${id}`, data),
    delete: (id) => request("DELETE", `/projects/${id}`),
    sections: {
      list: (projectId) => request("GET", `/projects/${projectId}/sections`),
      create: (projectId, data) => request("POST", `/projects/${projectId}/sections`, data),
      update: (projectId, sectionId, data) => request("PATCH", `/projects/${projectId}/sections/${sectionId}`, data),
      delete: (projectId, sectionId) => request("DELETE", `/projects/${projectId}/sections/${sectionId}`),
    },
    milestones: {
      list: (projectId) => request("GET", `/projects/${projectId}/milestones`),
      create: (projectId, data) => request("POST", `/projects/${projectId}/milestones`, data),
      update: (projectId, milestoneId, data) => request("PATCH", `/projects/${projectId}/milestones/${milestoneId}`, data),
      delete: (projectId, milestoneId) => request("DELETE", `/projects/${projectId}/milestones/${milestoneId}`),
    },
  };
}

export const api = {
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),

  me: () => request("GET", "/auth/me"),

  changePassword: (current_password, new_password) =>
    request("POST", "/auth/change-password", { current_password, new_password }),

  getProjects: () => request("GET", "/projects/"),

  getProject: (id) => request("GET", `/projects/${id}`),

  getProjectStats: () => request("GET", "/projects/stats"),

  getSections: (projectId) => request("GET", `/projects/${projectId}/sections`),

  getMilestones: (projectId) => request("GET", `/projects/${projectId}/milestones`),

  getUsers: () => request("GET", "/users/"),

  siteReports: crud("site-reports"),
  equipment: crud("equipment"),
  materials: crud("materials"),
  attendance: crud("attendance"),
  financial: crud("financial"),
  safety: crud("safety"),
  documents: crud("documents"),
  reports: crud("reports"),

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const headers = {};
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const res = await fetch(`${API}/upload`, { method: "POST", headers, body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getCompanySettings: () => request("GET", "/company-settings/"),
  updateCompanySettings: (data) => request("PUT", "/company-settings/", data),
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const headers = {};
    if (_token) headers["Authorization"] = `Bearer ${_token}`;
    const res = await fetch(`${API}/company-settings/upload-logo`, { method: "POST", headers, body: formData });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  createUser: (data) => request("POST", "/users/", data),
  deleteUser: (id) => request("DELETE", `/users/${id}`),
  resetUserPassword: (id, new_password) => request("POST", `/users/${id}/reset-password`, { new_password }),
};
