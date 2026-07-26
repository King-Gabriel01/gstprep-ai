import api from './api';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const courseApi = {
  create: (data) => api.post('/courses', data),
  list: () => api.get('/courses'),
  discover: () => api.get('/courses/discover'),
  get: (id) => api.get(`/courses/${id}`),
  enrol: (enrolmentCode) => api.post('/courses/enrol', { enrolmentCode }),
};

export const materialApi = {
  upload: (formData) =>
    api.post('/materials/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  listForCourse: (courseId) => api.get(`/materials/course/${courseId}`),
  status: (materialId) => api.get(`/materials/${materialId}/status`),
};

export const questionApi = {
  listForCourse: (courseId, status) =>
    api.get(`/questions/course/${courseId}`, { params: status ? { status } : {} }),
  update: (id, data) => api.patch(`/questions/${id}`, data),
  approve: (id) => api.patch(`/questions/${id}/approve`),
  reject: (id) => api.patch(`/questions/${id}/reject`),
  remove: (id) => api.delete(`/questions/${id}`),
  approveAllPending: (courseId) => api.patch(`/questions/course/${courseId}/approve-all-pending`),
};

export const practiceApi = {
  start: (courseId, count) => api.get(`/practice/start/${courseId}`, { params: { count } }),
  submit: (data) => api.post('/practice/submit', data),
  history: (courseId) => api.get(`/practice/history/${courseId}`),
};

export const assessmentApi = {
  create: (data) => api.post('/assessments', data),
  publish: (id) => api.patch(`/assessments/${id}/publish`),
  listForCourse: (courseId) => api.get(`/assessments/course/${courseId}`),
  take: (id) => api.get(`/assessments/${id}/take`),
  submit: (id, data) => api.post(`/assessments/${id}/submit`, data),
};

export const analyticsApi = {
  student: (courseId, studentId) =>
    api.get(`/analytics/student/${courseId}`, { params: studentId ? { studentId } : {} }),
  lecturer: (courseId) => api.get(`/analytics/lecturer/${courseId}`),
};
