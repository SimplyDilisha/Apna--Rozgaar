// AI Matching Logic - Calculates compatibility score between candidate and job

/**
 * Calculate match score between a candidate profile and a job posting
 * @param {Object} candidate - Candidate profile data
 * @param {Object} job - Job posting data
 * @returns {Object} - { matchScore: number, explanation: string, breakdown: Object }
 */
export const calculateMatchScore = (candidate, job) => {
  let totalScore = 0;
  let maxScore = 100;
  const breakdown = {};
  const explanations = [];

  // 1. Skills Match (40% weight)
  const skillsWeight = 40;
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase());
  const requiredSkills = (job.skillsRequired || []).map(s => s.toLowerCase());
  
  if (requiredSkills.length > 0) {
    const matchedSkills = candidateSkills.filter(skill => 
      requiredSkills.some(reqSkill => 
        reqSkill.includes(skill) || skill.includes(reqSkill)
      )
    );
    const skillMatchRatio = matchedSkills.length / requiredSkills.length;
    const skillScore = Math.min(skillMatchRatio * skillsWeight, skillsWeight);
    
    totalScore += skillScore;
    breakdown.skills = {
      score: Math.round(skillScore),
      maxScore: skillsWeight,
      matched: matchedSkills.length,
      required: requiredSkills.length
    };
    
    if (skillMatchRatio >= 0.7) {
      explanations.push(`Strong skills match (${matchedSkills.length}/${requiredSkills.length} required skills)`);
    } else if (skillMatchRatio >= 0.4) {
      explanations.push(`Moderate skills overlap (${matchedSkills.length}/${requiredSkills.length} required skills)`);
    } else {
      explanations.push(`Limited skills match - consider upskilling`);
    }
  }

  // 2. Work Preference Match (25% weight)
  const preferenceWeight = 25;
  const candidatePref = (candidate.workPreference || '').toLowerCase();
  const jobType = (job.jobType || '').toLowerCase();
  
  let prefScore = 0;
  if (candidatePref === jobType) {
    prefScore = preferenceWeight;
    explanations.push(`Perfect work preference match (${jobType})`);
  } else if (candidatePref === 'hybrid' || jobType === 'hybrid') {
    prefScore = preferenceWeight * 0.7;
    explanations.push(`Flexible work arrangement available`);
  } else if (candidatePref && jobType) {
    prefScore = preferenceWeight * 0.3;
    explanations.push(`Work preference differs: you prefer ${candidatePref}, job is ${jobType}`);
  }
  
  totalScore += prefScore;
  breakdown.workPreference = {
    score: Math.round(prefScore),
    maxScore: preferenceWeight,
    candidatePref,
    jobType
  };

  // 3. Accessibility Features Match (35% weight)
  const accessibilityWeight = 35;
  const candidateNeeds = getAccessibilityNeeds(candidate);
  const jobFeatures = (job.accessibilityFeatures || []).map(f => f.toLowerCase());
  
  let accessScore = 0;
  const metNeeds = [];
  const unmetNeeds = [];
  
  if (candidateNeeds.length > 0 && jobFeatures.length > 0) {
    candidateNeeds.forEach(need => {
      if (jobFeatures.some(feature => 
        feature.includes(need) || need.includes(feature)
      )) {
        metNeeds.push(need);
      } else {
        unmetNeeds.push(need);
      }
    });
    
    const accessMatchRatio = candidateNeeds.length > 0 
      ? metNeeds.length / candidateNeeds.length 
      : 1;
    accessScore = accessMatchRatio * accessibilityWeight;
    
    if (metNeeds.length > 0) {
      explanations.push(`Employer provides: ${metNeeds.join(', ')}`);
    }
    if (unmetNeeds.length > 0) {
      explanations.push(`May need to discuss: ${unmetNeeds.join(', ')}`);
    }
  } else if (jobFeatures.length > 0) {
    accessScore = accessibilityWeight * 0.8;
    explanations.push(`Employer offers accessibility features: ${jobFeatures.join(', ')}`);
  }
  
  totalScore += accessScore;
  breakdown.accessibility = {
    score: Math.round(accessScore),
    maxScore: accessibilityWeight,
    metNeeds,
    unmetNeeds,
    jobFeatures
  };

  // Calculate final score
  const finalScore = Math.round(totalScore);
  
  // Generate overall recommendation
  let recommendation;
  if (finalScore >= 80) {
    recommendation = "Excellent Match - Highly Recommended";
  } else if (finalScore >= 60) {
    recommendation = "Good Match - Worth Applying";
  } else if (finalScore >= 40) {
    recommendation = "Moderate Match - Review Requirements";
  } else {
    recommendation = "Low Match - May Need Upskilling";
  }

  return {
    matchScore: finalScore,
    recommendation,
    explanation: explanations.join('. '),
    breakdown,
    explanations
  };
};

/**
 * Extract accessibility needs from candidate profile
 */
function getAccessibilityNeeds(candidate) {
  const needs = [];
  
  // Based on disability type
  const disabilityType = (candidate.disabilityType || '').toLowerCase();
  
  if (disabilityType === 'visual' || disabilityType.includes('visual')) {
    needs.push('screen_reader_compatible');
  }
  if (disabilityType === 'hearing' || disabilityType.includes('hearing')) {
    needs.push('sign_language_support', 'visual_alerts');
  }
  if (disabilityType === 'mobility' || disabilityType.includes('mobility')) {
    needs.push('wheelchair_accessible');
  }
  if (disabilityType === 'cognitive' || disabilityType.includes('cognitive')) {
    needs.push('flexible_hours', 'clear_instructions');
  }
  
  // Based on assistive tech
  const assistiveTech = (candidate.assistiveTech || []).map(t => t.toLowerCase());
  
  if (assistiveTech.some(t => t.includes('screen reader'))) {
    needs.push('screen_reader_compatible');
  }
  if (assistiveTech.some(t => t.includes('voice'))) {
    needs.push('voice_control_compatible');
  }
  
  // Remove duplicates
  return [...new Set(needs)];
}

/**
 * Batch calculate matches for a candidate against multiple jobs
 */
export const calculateBatchMatches = (candidate, jobs) => {
  return jobs.map(job => ({
    job,
    ...calculateMatchScore(candidate, job)
  })).sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Find top matching jobs for a candidate
 */
export const findTopMatches = (candidate, jobs, limit = 10) => {
  const matches = calculateBatchMatches(candidate, jobs);
  return matches.slice(0, limit);
};
