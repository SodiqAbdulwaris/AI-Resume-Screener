const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";

export async function apiCall(method, path, body = null, token = null, isForm = false) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isForm && body) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, status: res.status, message: data.message || "Request failed" };
    }
    return data;
  } catch (err) {
    return { success: false, message: "Network error — is the server running?" };
  }
}

export const authRegister = (body) => apiCall("POST", "/auth/register", body);
export const authLogin = (body) => apiCall("POST", "/auth/login", body);
export const getJobs = (token) => apiCall("GET", "/jobs", null, token);
export const applyToJob = (jobId, token) => apiCall("POST", `/jobs/${jobId}/apply`, null, token);
export const getMyApplications = (token) => apiCall("GET", "/jobs/my-applications", null, token);
export const getCandidateProfile = (token) => apiCall("GET", "/candidates/me", null, token);
export const uploadResume = (formData, token) => apiCall("POST", "/resumes", formData, token, true);
export const createJob = (body, token) => apiCall("POST", "/jobs", body, token);
export const triggerMatch = (jobId, token) => apiCall("POST", `/jobs/${jobId}/match`, null, token);
export const getMatchResults = (jobId, token) => apiCall("GET", `/jobs/${jobId}/matches`, null, token);
export const getResume = (resumeId, token) => apiCall("GET", `/resumes/${resumeId}`, null, token);
