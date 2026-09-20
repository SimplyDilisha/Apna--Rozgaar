/**
 * Automated Fake Job Detection Scoring Algorithm
 * Scans job title, description, contact details, salary, and company info
 * to output a Risk Score (0-100), Risk Level (low, medium, high) and flag reasons.
 */
export const evaluateJobRisk = (jobData, existingJobs = []) => {
  let riskScore = 0;
  const reasons = [];

  const titleText = (jobData.title || '').toLowerCase();
  const descText = (jobData.description || '').toLowerCase();
  const combinedText = `${titleText} ${descText}`;

  // 1. Asking for money / registration fees (High risk indicator)
  const moneyPatterns = [
    'registration fee', 'processing fee', 'security deposit',
    'refundable deposit', 'pay money', 'deposit fee',
    'charges apply', 'payment required', 'training charges',
    'buy kit', 'application charges', 'refundable fee'
  ];
  const foundMoney = moneyPatterns.filter(p => combinedText.includes(p));
  if (foundMoney.length > 0) {
    riskScore += 45 * foundMoney.length;
    reasons.push(`Mentions payment/fee requirements: ${foundMoney.join(', ')}`);
  }

  // 2. Unrealistic salary
  // Check if salary numbers are extremely high
  if (jobData.salaryMin || jobData.salaryMax) {
    const minVal = parseFloat(jobData.salaryMin) || 0;
    const maxVal = parseFloat(jobData.salaryMax) || 0;
    
    // In India, entry/mid level salaries > 50 Lakhs (5,000,000) are extremely suspicious
    if (maxVal > 5000000) {
      riskScore += 35;
      reasons.push(`Unrealistically high expected salary: ₹${maxVal.toLocaleString('en-IN')}/year`);
    }
  }

  // 3. Suspicious contact/email or links
  const contactPatterns = [
    't.me/', 'wa.me/', 'whatsapp group', 'telegram channel',
    'bit.ly', 'tinyurl.com', 't.co', 'g.co', 'cutt.ly'
  ];
  const foundContact = contactPatterns.filter(p => combinedText.includes(p));
  if (foundContact.length > 0) {
    riskScore += 30 * foundContact.length;
    reasons.push(`Contains suspicious redirection link or chat invite: ${foundContact.join(', ')}`);
  }

  // 4. Free/Suspicious email domain in description (gmail, yahoo, etc.)
  const emailRegex = /[a-zA-Z0-9._%+-]+@(gmail|yahoo|outlook|hotmail|rediffmail)\.com/g;
  const emails = combinedText.match(emailRegex);
  if (emails && emails.length > 0) {
    riskScore += 20;
    reasons.push(`Uses free email domain in description: ${emails.join(', ')}`);
  }

  // 5. Fake or missing company info
  if (!jobData.company || jobData.company.trim().length === 0) {
    riskScore += 25;
    reasons.push('Missing company name');
  }
  if (!jobData.location || jobData.location.trim().length === 0) {
    riskScore += 15;
    reasons.push('Missing job location');
  }

  // 6. Suspicious job description length or spam phrases
  if (descText.length < 50) {
    riskScore += 25;
    reasons.push('Extremely short job description (less than 50 chars)');
  }
  const spamPhrases = [
    'earn money fast', 'no experience required earn',
    'work 2 hours', 'earn daily', 'guaranteed income',
    'make money online', 'data entry work from home earn'
  ];
  const foundSpam = spamPhrases.filter(p => combinedText.includes(p));
  if (foundSpam.length > 0) {
    riskScore += 35;
    reasons.push(`Contains spam/get-rich-quick phrases: ${foundSpam.join(', ')}`);
  }

  // 7. Duplicate postings check
  const isDuplicate = existingJobs.some(existing => 
    existing.employerId === jobData.employerId &&
    (existing.title || '').toLowerCase().trim() === (jobData.title || '').toLowerCase().trim() &&
    (existing.description || '').toLowerCase().trim() === (jobData.description || '').toLowerCase().trim()
  );
  if (isDuplicate) {
    riskScore += 40;
    reasons.push('Duplicate job posting detected (identical title & description by same employer)');
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  let riskLevel = 'low';
  let status = 'active';

  if (riskScore > 65) {
    riskLevel = 'high';
    status = 'rejected';
  } else if (riskScore > 30) {
    riskLevel = 'medium';
    status = 'pending_admin';
  }

  return {
    riskScore,
    riskLevel,
    status,
    reasons
  };
};

import { verifyJobWithAI } from '../services/groqService';

/**
 * Automated Fake Job Detection Scoring Algorithm (Hybrid Rule + Groq AI)
 * Scans job title, description, contact details, salary, and company info
 * to output a Risk Score (0-100), Risk Level (low, medium, high) and flag reasons.
 */
export const evaluateJobRiskWithAI = async (jobData, existingJobs = []) => {
  // 1. First run rule-based heuristic check
  const ruleResult = evaluateJobRisk(jobData, existingJobs);

  // 2. Run Groq AI screening
  try {
    const aiResult = await verifyJobWithAI(jobData);
    if (aiResult) {
      // Combine risk scores (take max of rule-based or AI to prioritize safety)
      const combinedScore = Math.max(ruleResult.riskScore, aiResult.riskScore);
      const combinedReasons = Array.from(new Set([...ruleResult.reasons, ...(aiResult.reasons || [])]));

      const riskLevel = combinedScore > 65 ? 'high' : combinedScore > 30 ? 'medium' : 'low';
      const status = riskLevel === 'high' ? 'rejected' : riskLevel === 'medium' ? 'pending_admin' : 'active';

      return {
        riskScore: combinedScore,
        riskLevel,
        status,
        reasons: combinedReasons,
        aiSummary: aiResult.summary || 'AI Safety verification completed.'
      };
    }
  } catch (err) {
    console.warn('Groq AI job screening fallback to rule engine:', err);
  }

  // Fallback to rule engine if AI unavailable
  return {
    ...ruleResult,
    aiSummary: ruleResult.riskScore === 0 ? 'Passed safety screening.' : 'Flagged by safety screening.'
  };
};

