// Job-related Realtime Database operations
import {
  ref,
  push,
  get,
  set,
  update,
  remove,
  serverTimestamp
} from 'firebase/database';
import { rtdb } from './config';

const COLLECTION = 'jobs';

// Create new job posting
export const createJob = async (jobData, employerId) => {
  try {
    const jobsRef = ref(rtdb, COLLECTION);
    const newJobRef = push(jobsRef);
    await set(newJobRef, {
      ...jobData,
      employerId,
      status: jobData.status || 'active',
      applicants: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: newJobRef.key };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all active jobs
export const getAllJobs = async () => {
  try {
    const jobsRef = ref(rtdb, COLLECTION);
    const snapshot = await get(jobsRef);
    const jobs = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.status === 'active') {
          jobs.push({ ...data, id: childSnapshot.key });
        }
      });
    }
    // Sort by createdAt descending client-side
    jobs.sort((a, b) => {
      const ta = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const tb = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
    return { success: true, data: jobs };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get job by ID
export const getJobById = async (jobId) => {
  try {
    const jobRef = ref(rtdb, `${COLLECTION}/${jobId}`);
    const snapshot = await get(jobRef);
    if (snapshot.exists()) {
      return { success: true, data: { ...snapshot.val(), id: snapshot.key } };
    }
    return { success: false, error: 'Job not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get jobs by employer ID
export const getJobsByEmployer = async (employerId) => {
  try {
    const jobsRef = ref(rtdb, COLLECTION);
    const snapshot = await get(jobsRef);
    const jobs = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.employerId === employerId) {
          jobs.push({ ...data, id: childSnapshot.key });
        }
      });
    }
    jobs.sort((a, b) => {
      const ta = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt || 0).getTime();
      const tb = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt || 0).getTime();
      return tb - ta;
    });
    return { success: true, data: jobs };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Apply to job
export const applyToJob = async (jobId, candidateId, candidateData) => {
  try {
    const jobRef = ref(rtdb, `${COLLECTION}/${jobId}`);
    const snapshot = await get(jobRef);
    if (!snapshot.exists()) return { success: false, error: 'Job not found' };

    const jobData = snapshot.val();
    const applicants = jobData.applicants || [];

    if (applicants.some((a) => a.candidateId === candidateId)) {
      return { success: false, error: 'Already applied' };
    }

    applicants.push({
      candidateId,
      candidateName: candidateData.name,
      candidateSkills: candidateData.skills || [],
      candidateResume: candidateData.resume || '',
      appliedAt: new Date().toISOString(),
      status: 'pending',
      isPremium: candidateData.isPremium || false
    });

    await update(jobRef, { applicants });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Update job
export const updateJob = async (jobId, updateData) => {
  try {
    const jobRef = ref(rtdb, `${COLLECTION}/${jobId}`);
    await update(jobRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete job
export const deleteJob = async (jobId) => {
  try {
    const jobRef = ref(rtdb, `${COLLECTION}/${jobId}`);
    await remove(jobRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Create a job report (flag a scam/fake job)
export const reportJob = async (jobId, reporterId, reason, description) => {
  try {
    const reportsRef = ref(rtdb, 'jobReports');
    const newReportRef = push(reportsRef);
    await set(newReportRef, {
      jobId,
      reporterId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return { success: true, id: newReportRef.key };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all pending review jobs (suspicious risk flag)
export const getPendingJobs = async () => {
  try {
    const jobsRef = ref(rtdb, COLLECTION);
    const snapshot = await get(jobsRef);
    const jobs = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const data = childSnapshot.val();
        if (data.status === 'pending_admin') {
          jobs.push({ ...data, id: childSnapshot.key });
        }
      });
    }
    return { success: true, data: jobs };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all job reports
export const getJobReports = async () => {
  try {
    const reportsRef = ref(rtdb, 'jobReports');
    const snapshot = await get(reportsRef);
    const reports = [];
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.keys(data).forEach((id) => {
        reports.push({ ...data[id], id });
      });
    }
    // Sort by newest reports first
    reports.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return { success: true, data: reports };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Resolve a report (dismiss or take action)
export const resolveReport = async (reportId, actionStatus) => {
  try {
    const reportRef = ref(rtdb, `jobReports/${reportId}`);
    await update(reportRef, {
      status: actionStatus, // 'resolved' or 'dismissed'
      resolvedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Fetch ALL jobs for duplicate check or admin view
export const getAllJobsRaw = async () => {
  try {
    const jobsRef = ref(rtdb, COLLECTION);
    const snapshot = await get(jobsRef);
    const jobs = [];
    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        jobs.push({ ...childSnapshot.val(), id: childSnapshot.key });
      });
    }
    return { success: true, data: jobs };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

