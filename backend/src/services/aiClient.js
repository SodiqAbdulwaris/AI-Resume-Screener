const axios = require('axios');
const FormData = require('form-data');

const BASE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '30000', 10);

const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
});

/**
 * Send a resume file buffer to the AI parse endpoint.
 * @param {Buffer} fileBuffer  Raw file bytes
 * @param {string} fileName    Original filename (used to set Content-Disposition)
 * @param {string} mimeType    MIME type of the file
 * @returns {Promise<object>}  ParsedCandidate object from AI service
 */
async function parseResume(fileBuffer, fileName, mimeType) {
  const form = new FormData();
  form.append('file', fileBuffer, { filename: fileName, contentType: mimeType });

  try {
    const response = await client.post('/parse', form, {
      headers: form.getHeaders(),
    });
    return response.data;
  } catch (err) {
    throw buildAiError(err, 'parse');
  }
}

/**
 * Send a job + candidate list to the AI match endpoint.
 * @param {object} aiJobInput         AI-shaped job payload
 * @param {object[]} aiCandidateInputs AI-shaped candidate array
 * @returns {Promise<object>}          AI match response
 */
async function matchCandidates(aiJobInput, aiCandidateInputs) {
  try {
    const response = await client.post('/match/', {
      job: aiJobInput,
      candidates: aiCandidateInputs,
    });
    return response.data;
  } catch (err) {
    throw buildAiError(err, 'match');
  }
}

/**
 * Convert an axios error into a structured backend error object.
 */
function buildAiError(err, operation) {
  if (err.response) {
    // AI service returned a non-2xx response
    const status = err.response.status;
    const body = err.response.data || {};
    const message = body.message || `AI service ${operation} failed`;
    const error = new Error(message);
    error.aiStatus = status;
    error.aiErrorCode = body.error_code || null;
    error.isAiError = true;
    return error;
  }
  if (err.code === 'ECONNABORTED') {
    const error = new Error(`AI service ${operation} timed out`);
    error.isAiTimeout = true;
    return error;
  }
  // Network error or unexpected failure
  err.isAiError = true;
  return err;
}

module.exports = { parseResume, matchCandidates };
