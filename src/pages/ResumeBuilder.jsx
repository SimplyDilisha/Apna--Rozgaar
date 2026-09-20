import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, User, Loader2, Mail, Phone, MapPin, Globe,
  Briefcase, GraduationCap, Code, Medal, Link as LinkIcon,
  ChevronDown, Plus, Trash2, Download, Palette, FileText
} from 'lucide-react';
import { getGroqResumeExtraction } from '../services/groqService';
import { useVoiceControl } from '../useVoiceControl';
import './ResumeBuilder.css';

const ACCENT_COLORS = [
  '#000000', '#1a1a1a', '#2563eb', '#059669',
  '#dc2626', '#7c3aed', '#0891b2', '#b45309'
];

const THEMES = [
  { id: 'modern', name: 'Modern' },
  { id: 'professional', name: 'Professional' },
  { id: 'minimalist', name: 'Minimalist' },
  { id: 'creative', name: 'Creative' },
  { id: 'classic', name: 'Classic' },
];

function getDefaultFormData() {
  return {
    personal: {
      name: '', lastname: '', email: '', mob: '', city: '', country: '',
      title: '', quote: '', image: ''
    },
    interest: [{ hobbie: '' }],
    technicalSkill: [{ skill: '', rate: '' }],
    experience: [{
      company: '', description: '', worktitle: '', tags: '',
      yearfrom: '', yearto: '', present: false
    }],
    project: [{ name: '', tech: '', des: '', link: '' }],
    course: [{ name: '', provider: '' }],
    education: [{
      degree: '', grade: '', university: '', yearfrom: '', yearto: '', gradetype: 'percentage'
    }],
    link: { linkedin: '', github: '', portfolio: '' }
  };
}

const SectionIcon = ({ type }) => {
  const style = { width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
  const iconStyle = { width: 16, height: 16 };
  switch (type) {
    case 'personal':
      return <div style={{ ...style, background: 'rgba(0,0,0,0.06)' }}><User style={{ ...iconStyle, color: 'var(--rb-accent)' }} /></div>;
    case 'skills':
      return <div style={{ ...style, background: 'rgba(0,0,0,0.06)' }}><Sparkles style={{ ...iconStyle, color: 'var(--rb-accent)' }} /></div>;
    case 'experience':
      return <div style={{ ...style, background: 'rgba(0,0,0,0.06)' }}><Briefcase style={{ ...iconStyle, color: 'var(--rb-accent)' }} /></div>;
    case 'projects':
      return <div style={{ ...style, background: 'rgba(0,0,0,0.06)' }}><Code style={{ ...iconStyle, color: 'var(--rb-accent)' }} /></div>;
    case 'courses':
      return <div style={{ ...style, background: 'rgba(0,0,0,0.06)' }}><Medal style={{ ...iconStyle, color: 'var(--rb-accent)' }} /></div>;
    case 'education':
      return <div style={{ ...style, background: 'rgba(0,0,0,0.06)' }}><GraduationCap style={{ ...iconStyle, color: 'var(--rb-accent)' }} /></div>;
    case 'social':
      return <div style={{ ...style, background: 'rgba(0,0,0,0.06)' }}><LinkIcon style={{ ...iconStyle, color: 'var(--rb-accent)' }} /></div>;
    default:
      return null;
  }
};

function ResumeBuilder() {
  const [formData, setFormData] = useState(getDefaultFormData);
  const [theme, setTheme] = useState('modern');
  const [accentColor, setAccentColor] = useState('#000000');
  const [openSections, setOpenSections] = useState({
    personal: true, skills: true, experience: true, projects: true, courses: true, education: true, social: true
  });
  const [aiLoading, setAiLoading] = useState({});
  const previewRef = useRef(null);

  const {
    isListening, transcript, interimTranscript,
    startListening, stopListening, toggleListening,
    error: voiceError, isSupported: isVoiceSupported
  } = useVoiceControl({
    onResult: (text) => {
      setFormData(prev => {
        const active = document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
          const name = active.name;
          if (name) {
            const parts = name.split('.');
            if (parts.length === 2) {
              const [section, field] = parts;
              const updated = { ...prev };
              if (updated[section]) {
                updated[section] = { ...updated[section], [field]: text };
              }
              return updated;
            }
          }
        }
        return prev;
      });
    }
  });

  const updateField = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const updateNested = (section, index, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? { ...item, [field]: value } : item)
    }));
  };

  const appendArray = (section, emptyItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], emptyItem]
    }));
  };

  const removeArray = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAiGenerate = async (section) => {
    setAiLoading(prev => ({ ...prev, [section]: true }));
    try {
      const prompt = `Generate a realistic resume ${section} section as a JSON object based on these field names: ${JSON.stringify(getDefaultFormData()[section])}. ${section === 'personal' ? 'Use a realistic tech professional profile name like "Rahul Sharma" with believable details including first name, last name, email, mobile, city, country, title, quote, and image URL.' : section === 'experience' ? 'Generate 2 varied work experience entries with realistic Indian tech companies and roles. Use fields: company, description, worktitle, tags, yearfrom, yearto, present.' : section === 'education' ? 'Generate 2 education entries with Indian universities and degrees. Use fields: degree, grade, university, yearfrom, yearto, gradetype.' : section === 'project' ? 'Generate 3 diverse tech projects with realistic technologies. Use fields: name, tech, des, link.' : section === 'course' ? 'Generate 2-3 relevant online courses and certifications. Use fields: name, provider.' : section === 'technicalSkill' ? 'Generate 8-10 technical skills with ratings between 5-10. Use fields: skill, rate.' : section === 'interest' ? 'Generate 4-5 hobbies and interests. Use fields: hobbie.' : ''} Return ONLY a valid JSON object. No markdown, no explanations.`;

      const responseText = await getGroqResumeExtraction(prompt, []);

      if (responseText) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (section === 'interest' || section === 'technicalSkill' || section === 'experience' || section === 'project' || section === 'course' || section === 'education') {
            setFormData(prev => ({ ...prev, [section]: data }));
          } else {
            setFormData(prev => ({ ...prev, personal: { ...prev.personal, ...data } }));
          }
        }
      }
    } catch (err) {
      console.error('AI generation failed:', err);
    } finally {
      setAiLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const hasAnyData = () => {
    const d = formData;
    return (
      d.personal.name ||
      d.experience.some(e => e.company) ||
      d.education.some(e => e.degree) ||
      d.project.some(p => p.name) ||
      d.course.some(c => c.name) ||
      d.technicalSkill.some(s => s.skill)
    );
  };

  const renderPreview = () => {
    const p = formData.personal;
    const fullName = `${p.name || ''} ${p.lastname || ''}`.trim() || 'Your Name';
    const displayName = fullName;

    return (
      <div ref={previewRef} className={`rb-resume theme-${theme}`} style={{ '--preview-accent': accentColor }}>
        {theme === 'professional' || theme === 'creative' ? (
          <div className="rb-resume-header">
            <div className="rb-resume-name">{displayName}</div>
            {p.title && <div className="rb-resume-role">{p.title}</div>}
            <div className="rb-resume-contact">
              {p.email && <span><Mail size={12} /> {p.email}</span>}
              {p.mob && <span><Phone size={12} /> {p.mob}</span>}
              {(p.city || p.country) && <span><MapPin size={12} /> {p.city}{p.city && p.country && ', '}{p.country}</span>}
              {p.image && <span><Globe size={12} /> {p.image}</span>}
            </div>
          </div>
        ) : (
          <>
            <div className="rb-resume-name">{displayName}</div>
            {p.title && <div className="rb-resume-role">{p.title}</div>}
            <div className="rb-resume-contact">
              {p.email && <span><Mail size={12} /> {p.email}</span>}
              {p.mob && <span><Phone size={12} /> {p.mob}</span>}
              {(p.city || p.country) && <span><MapPin size={12} /> {p.city}{p.city && p.country && ', '}{p.country}</span>}
              {p.image && <span><Globe size={12} /> {p.image}</span>}
            </div>
          </>
        )}

        {p.quote && <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.5, marginBottom: 16 }}>{p.quote}</p>}

        {formData.technicalSkill.some(s => s.skill) && (
          <div className="rb-resume-section">
            <div className="rb-resume-section-title">Skills</div>
            <div className="rb-resume-skills">
              {formData.technicalSkill.filter(s => s.skill).map((item, i) => (
                <span key={i} className="rb-resume-skill-tag">{item.skill}</span>
              ))}
            </div>
          </div>
        )}

        <div className="rb-resume-grid">
          <div>
            {formData.experience.some(e => e.company || e.worktitle) && (
              <div className="rb-resume-section">
                <div className="rb-resume-section-title">Experience</div>
                <div className="rb-resume-list">
                  {formData.experience.filter(e => e.company || e.worktitle).map((exp, i) => (
                    <div key={i} className="rb-resume-item">
                      <div className="rb-resume-item-title">{exp.worktitle || 'Role'}</div>
                      <div className="rb-resume-item-sub">{exp.company}{exp.yearfrom ? ` | ${exp.yearfrom} - ${exp.present ? 'Present' : exp.yearto}` : ''}</div>
                      {exp.description && <div className="rb-resume-item-desc">{exp.description}</div>}
                      {exp.tags && <div style={{ fontSize: '0.75rem', color: accentColor, marginTop: 2 }}>{exp.tags}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.education.some(e => e.degree) && (
              <div className="rb-resume-section">
                <div className="rb-resume-section-title">Education</div>
                <div className="rb-resume-list">
                  {formData.education.filter(e => e.degree).map((edu, i) => (
                    <div key={i} className="rb-resume-item">
                      <div className="rb-resume-item-title">{edu.degree}</div>
                      <div className="rb-resume-item-sub">{edu.university}{edu.yearfrom ? ` | ${edu.yearfrom} - ${edu.yearto}` : ''}</div>
                      {edu.grade && <div style={{ fontSize: '0.8rem', color: '#666' }}>{edu.grade}{edu.gradetype === 'grade' ? ' /10' : ' %'}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            {formData.project.some(p => p.name) && (
              <div className="rb-resume-section">
                <div className="rb-resume-section-title">Projects</div>
                <div className="rb-resume-list">
                  {formData.project.filter(p => p.name).map((proj, i) => (
                    <div key={i} className="rb-resume-item">
                      <div className="rb-resume-item-title">{proj.name}</div>
                      {proj.tech && <div style={{ fontSize: '0.75rem', color: accentColor, marginBottom: 2 }}>{proj.tech}</div>}
                      {proj.des && <div className="rb-resume-item-desc">{proj.des}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.course.some(c => c.name) && (
              <div className="rb-resume-section">
                <div className="rb-resume-section-title">Courses & Certifications</div>
                <div className="rb-resume-list">
                  {formData.course.filter(c => c.name).map((c, i) => (
                    <div key={i} className="rb-resume-item">
                      <div className="rb-resume-item-title">{c.name}</div>
                      {c.provider && <div className="rb-resume-item-sub">{c.provider}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.interest.some(i => i.hobbie) && (
              <div className="rb-resume-section">
                <div className="rb-resume-section-title">Interests</div>
                <div className="rb-resume-skills">
                  {formData.interest.filter(i => i.hobbie).map((item, i) => (
                    <span key={i} className="rb-resume-skill-tag">{item.hobbie}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="rb-page"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{
        position: 'fixed', top: '-10%', left: '-5%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 60%)',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-10%', right: '-5%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)',
        borderRadius: '50%', zIndex: 0, pointerEvents: 'none'
      }} />

      <div className="rb-header" style={{ position: 'relative', zIndex: 1 }}>
        <div className="rb-header-left">
          <div className="rb-header-icon">
            <FileText size={22} color="white" />
          </div>
          <div>
            <h1 className="rb-header-title">AI Resume Builder</h1>
            <p className="rb-header-subtitle">Build a professional resume with AI assistance</p>
          </div>
        </div>
        <div className="rb-header-actions">
          <button className="rb-ai-btn" onClick={handleDownload} style={{ background: 'var(--primary-gradient)', color: 'white', border: 'none' }}>
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="rb-main" style={{ position: 'relative', zIndex: 1 }}>
        <div className="rb-form-panel">
          <div className="rb-form-scroll">
            <Section id="personal" title="Personal Details" icon={<SectionIcon type="personal" />} isOpen={openSections.personal} onToggle={() => toggleSection('personal')} onAi={() => handleAiGenerate('personal')} aiLoading={!!aiLoading.personal} badge={formData.personal.name ? 'Filled' : ''}>
              <div className="rb-field-row">
                <div className="rb-field">
                  <label className="rb-label">First Name <span className="required">*</span></label>
                  <input className="rb-input" value={formData.personal.name} onChange={e => updateField('personal', 'name', e.target.value)} placeholder="Rahul" />
                </div>
                <div className="rb-field">
                  <label className="rb-label">Last Name <span className="required">*</span></label>
                  <input className="rb-input" value={formData.personal.lastname} onChange={e => updateField('personal', 'lastname', e.target.value)} placeholder="Sharma" />
                </div>
              </div>
              <div className="rb-field-row">
                <div className="rb-field">
                  <label className="rb-label">Email <span className="required">*</span></label>
                  <input className="rb-input" type="email" value={formData.personal.email} onChange={e => updateField('personal', 'email', e.target.value)} placeholder="rahul@example.com" />
                </div>
                <div className="rb-field">
                  <label className="rb-label">Mobile <span className="required">*</span></label>
                  <input className="rb-input" type="tel" value={formData.personal.mob} onChange={e => updateField('personal', 'mob', e.target.value)} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="rb-field-row">
                <div className="rb-field">
                  <label className="rb-label">City <span className="required">*</span></label>
                  <input className="rb-input" value={formData.personal.city} onChange={e => updateField('personal', 'city', e.target.value)} placeholder="Bengaluru" />
                </div>
                <div className="rb-field">
                  <label className="rb-label">Country <span className="required">*</span></label>
                  <input className="rb-input" value={formData.personal.country} onChange={e => updateField('personal', 'country', e.target.value)} placeholder="India" />
                </div>
              </div>
              <div className="rb-field">
                <label className="rb-label">Professional Title <span className="required">*</span></label>
                <input className="rb-input" value={formData.personal.title} onChange={e => updateField('personal', 'title', e.target.value)} placeholder="Full Stack Developer" />
              </div>
              <div className="rb-field">
                <label className="rb-label">Short Bio</label>
                <textarea className="rb-textarea" value={formData.personal.quote} onChange={e => updateField('personal', 'quote', e.target.value)} placeholder="Describe yourself in 2-3 lines..." />
              </div>
              <div className="rb-field">
                <label className="rb-label">Profile Image URL</label>
                <input className="rb-input" value={formData.personal.image} onChange={e => updateField('personal', 'image', e.target.value)} placeholder="https://example.com/photo.jpg" />
              </div>
            </Section>

            <Section id="skills" title="Skills & Interests" icon={<SectionIcon type="skills" />} isOpen={openSections.skills} onToggle={() => toggleSection('skills')} onAi={() => handleAiGenerate('technicalSkill')} aiLoading={!!aiLoading.technicalSkill} badge={`${formData.technicalSkill.filter(s => s.skill).length} skills`}>
              {formData.technicalSkill.map((item, index) => (
                <div key={index} className="rb-array-item">
                  <div className="rb-array-item-header">
                    <span className="rb-array-index">Skill {index + 1}</span>
                    {index > 0 && (
                      <button className="rb-remove-btn" onClick={() => removeArray('technicalSkill', index)}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div className="rb-field-row">
                    <div className="rb-field">
                      <label className="rb-label">Skill <span className="required">*</span></label>
                      <input className="rb-input" value={item.skill} onChange={e => updateNested('technicalSkill', index, 'skill', e.target.value)} placeholder="JavaScript" />
                    </div>
                    <div className="rb-field">
                      <label className="rb-label">Rate (1-10)</label>
                      <input className="rb-input" type="number" min="0" max="10" value={item.rate} onChange={e => updateNested('technicalSkill', index, 'rate', e.target.value)} placeholder="8" />
                    </div>
                  </div>
                </div>
              ))}
              <button className="rb-add-btn" onClick={() => appendArray('technicalSkill', { skill: '', rate: '' })}>
                <Plus size={16} /> Add Skill
              </button>

              <label className="rb-label" style={{ marginTop: 8 }}>Interests / Hobbies</label>
              {formData.interest.map((item, index) => (
                <div key={index} className="rb-array-item">
                  <div className="rb-array-item-header">
                    <span className="rb-array-index">Interest {index + 1}</span>
                    {index > 0 && (
                      <button className="rb-remove-btn" onClick={() => removeArray('interest', index)}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div className="rb-field">
                    <input className="rb-input" value={item.hobbie} onChange={e => updateNested('interest', index, 'hobbie', e.target.value)} placeholder="Chess, Photography, Gaming..." />
                  </div>
                </div>
              ))}
              <button className="rb-add-btn" onClick={() => appendArray('interest', { hobbie: '' })}>
                <Plus size={16} /> Add Interest
              </button>
            </Section>

            <Section id="experience" title="Work Experience" icon={<SectionIcon type="experience" />} isOpen={openSections.experience} onToggle={() => toggleSection('experience')} onAi={() => handleAiGenerate('experience')} aiLoading={!!aiLoading.experience} badge={`${formData.experience.filter(e => e.company).length} entries`}>
              {formData.experience.map((item, index) => (
                <div key={index} className="rb-array-item">
                  <div className="rb-array-item-header">
                    <span className="rb-array-index">Experience {index + 1}</span>
                    {index > 0 && (
                      <button className="rb-remove-btn" onClick={() => removeArray('experience', index)}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Job Title <span className="required">*</span></label>
                    <input className="rb-input" value={item.worktitle} onChange={e => updateNested('experience', index, 'worktitle', e.target.value)} placeholder="Senior Developer" />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Company <span className="required">*</span></label>
                    <input className="rb-input" value={item.company} onChange={e => updateNested('experience', index, 'company', e.target.value)} placeholder="Acme Corp" />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Description</label>
                    <textarea className="rb-textarea" value={item.description} onChange={e => updateNested('experience', index, 'description', e.target.value)} placeholder="Brief description of your role and achievements..." />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Tags / Tech Stack</label>
                    <input className="rb-input" value={item.tags} onChange={e => updateNested('experience', index, 'tags', e.target.value)} placeholder="React, Node.js, AWS" />
                  </div>
                  <div className="rb-field-row">
                    <div className="rb-field">
                      <label className="rb-label">From</label>
                      <input className="rb-input" value={item.yearfrom} onChange={e => updateNested('experience', index, 'yearfrom', e.target.value)} placeholder="2021" />
                    </div>
                    {!item.present && (
                      <div className="rb-field">
                        <label className="rb-label">To</label>
                        <input className="rb-input" value={item.yearto} onChange={e => updateNested('experience', index, 'yearto', e.target.value)} placeholder="2023" />
                      </div>
                    )}
                  </div>
                  <label className="rb-checkbox-label">
                    <input type="checkbox" checked={item.present} onChange={e => updateNested('experience', index, 'present', e.target.checked)} />
                    Currently working here
                  </label>
                </div>
              ))}
              <button className="rb-add-btn" onClick={() => appendArray('experience', { company: '', description: '', worktitle: '', tags: '', yearfrom: '', yearto: '', present: false })}>
                <Plus size={16} /> Add Experience
              </button>
            </Section>

            <Section id="projects" title="Personal Projects" icon={<SectionIcon type="projects" />} isOpen={openSections.projects} onToggle={() => toggleSection('projects')} onAi={() => handleAiGenerate('project')} aiLoading={!!aiLoading.project} badge={`${formData.project.filter(p => p.name).length} projects`}>
              {formData.project.map((item, index) => (
                <div key={index} className="rb-array-item">
                  <div className="rb-array-item-header">
                    <span className="rb-array-index">Project {index + 1}</span>
                    {index > 0 && (
                      <button className="rb-remove-btn" onClick={() => removeArray('project', index)}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Project Name</label>
                    <input className="rb-input" value={item.name} onChange={e => updateNested('project', index, 'name', e.target.value)} placeholder="E-Commerce Dashboard" />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Tech Stack</label>
                    <input className="rb-input" value={item.tech} onChange={e => updateNested('project', index, 'tech', e.target.value)} placeholder="React, Firebase, Tailwind" />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Description</label>
                    <textarea className="rb-textarea" value={item.des} onChange={e => updateNested('project', index, 'des', e.target.value)} placeholder="Short description of the project..." />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Link</label>
                    <input className="rb-input" type="url" value={item.link} onChange={e => updateNested('project', index, 'link', e.target.value)} placeholder="https://github.com/..." />
                  </div>
                </div>
              ))}
              <button className="rb-add-btn" onClick={() => appendArray('project', { name: '', tech: '', des: '', link: '' })}>
                <Plus size={16} /> Add Project
              </button>
            </Section>

            <Section id="courses" title="Courses & Certifications" icon={<SectionIcon type="courses" />} isOpen={openSections.courses} onToggle={() => toggleSection('courses')} onAi={() => handleAiGenerate('course')} aiLoading={!!aiLoading.course} badge={`${formData.course.filter(c => c.name).length} entries`}>
              {formData.course.map((item, index) => (
                <div key={index} className="rb-array-item">
                  <div className="rb-array-item-header">
                    <span className="rb-array-index">Course {index + 1}</span>
                    {index > 0 && (
                      <button className="rb-remove-btn" onClick={() => removeArray('course', index)}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Course / Certificate Name</label>
                    <input className="rb-input" value={item.name} onChange={e => updateNested('course', index, 'name', e.target.value)} placeholder="AWS Solutions Architect" />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Provider</label>
                    <input className="rb-input" value={item.provider} onChange={e => updateNested('course', index, 'provider', e.target.value)} placeholder="Coursera / Udemy" />
                  </div>
                </div>
              ))}
              <button className="rb-add-btn" onClick={() => appendArray('course', { name: '', provider: '' })}>
                <Plus size={16} /> Add Course
              </button>
            </Section>

            <Section id="education" title="Education" icon={<SectionIcon type="education" />} isOpen={openSections.education} onToggle={() => toggleSection('education')} onAi={() => handleAiGenerate('education')} aiLoading={!!aiLoading.education} badge={`${formData.education.filter(e => e.degree).length} entries`}>
              {formData.education.map((item, index) => (
                <div key={index} className="rb-array-item">
                  <div className="rb-array-item-header">
                    <span className="rb-array-index">Education {index + 1}</span>
                    {index > 0 && (
                      <button className="rb-remove-btn" onClick={() => removeArray('education', index)}>
                        <Trash2 size={12} /> Remove
                      </button>
                    )}
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Degree / Diploma <span className="required">*</span></label>
                    <input className="rb-input" value={item.degree} onChange={e => updateNested('education', index, 'degree', e.target.value)} placeholder="B.Tech Computer Science" />
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">University / Institute <span className="required">*</span></label>
                    <input className="rb-input" value={item.university} onChange={e => updateNested('education', index, 'university', e.target.value)} placeholder="IIT Bombay" />
                  </div>
                  <div className="rb-field-row">
                    <div className="rb-field">
                      <label className="rb-label">From Year</label>
                      <input className="rb-input" value={item.yearfrom} onChange={e => updateNested('education', index, 'yearfrom', e.target.value)} placeholder="2016" />
                    </div>
                    <div className="rb-field">
                      <label className="rb-label">To Year</label>
                      <input className="rb-input" value={item.yearto} onChange={e => updateNested('education', index, 'yearto', e.target.value)} placeholder="2020" />
                    </div>
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Grade Type</label>
                    <div className="rb-radio-group">
                      <label className="rb-radio-label">
                        <input type="radio" name={`grade-${index}`} checked={item.gradetype === 'percentage'} onChange={() => updateNested('education', index, 'gradetype', 'percentage')} />
                        Percentage
                      </label>
                      <label className="rb-radio-label">
                        <input type="radio" name={`grade-${index}`} checked={item.gradetype === 'grade'} onChange={() => updateNested('education', index, 'gradetype', 'grade')} />
                        Grade /10
                      </label>
                    </div>
                  </div>
                  <div className="rb-field">
                    <label className="rb-label">Grade / Percentage</label>
                    <input className="rb-input" type="number" min="0" max="100" step="0.1" value={item.grade} onChange={e => updateNested('education', index, 'grade', e.target.value)} placeholder="8.5" />
                  </div>
                </div>
              ))}
              <button className="rb-add-btn" onClick={() => appendArray('education', { degree: '', grade: '', university: '', yearfrom: '', yearto: '', gradetype: 'percentage' })}>
                <Plus size={16} /> Add Education
              </button>
            </Section>

            <Section id="social" title="Social & Links" icon={<SectionIcon type="social" />} isOpen={openSections.social} onToggle={() => toggleSection('social')} onAi={() => {}} aiLoading={false} badge="Links">
              <div className="rb-field">
                <label className="rb-label">LinkedIn</label>
                <input className="rb-input" value={formData.link.linkedin} onChange={e => setFormData(prev => ({ ...prev, link: { ...prev.link, linkedin: e.target.value } }))} placeholder="https://linkedin.com/in/rahulsharma" />
              </div>
              <div className="rb-field">
                <label className="rb-label">GitHub</label>
                <input className="rb-input" value={formData.link.github} onChange={e => setFormData(prev => ({ ...prev, link: { ...prev.link, github: e.target.value } }))} placeholder="https://github.com/rahulsharma" />
              </div>
              <div className="rb-field">
                <label className="rb-label">Portfolio</label>
                <input className="rb-input" value={formData.link.portfolio} onChange={e => setFormData(prev => ({ ...prev, link: { ...prev.link, portfolio: e.target.value } }))} placeholder="https://rahulsharma.dev" />
              </div>
            </Section>
          </div>
        </div>

        <div className="rb-preview-panel">
          <div className="rb-preview-toolbar">
            <div className="rb-preview-title-group">
              <h3>Live Preview</h3>
              <p>Real-time resume preview</p>
            </div>
            <div className="rb-preview-controls">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Palette size={14} color="var(--rb-muted)" />
                <select className="rb-color-select" value={accentColor} onChange={e => setAccentColor(e.target.value)} aria-label="Accent color">
                  {ACCENT_COLORS.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <select className="rb-theme-select" value={theme} onChange={e => setTheme(e.target.value)} aria-label="Resume theme">
                {THEMES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rb-preview-scroll">
            {hasAnyData() ? (
              renderPreview()
            ) : (
              <div className="rb-empty-state">
                <Sparkles size={40} />
                <p>Start filling the form or use AI Generate to see your resume preview here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {voiceError && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px 16px',
          borderRadius: 12, fontSize: '0.8rem', zIndex: 100, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(239,68,68,0.2)'
        }}>
          {voiceError}
        </div>
      )}
    </motion.div>
  );
}

function Section({ id, title, icon, isOpen, onToggle, onAi, aiLoading, badge, children }) {
  return (
    <div className="rb-section">
      <div className="rb-section-header" onClick={onToggle} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onToggle()} aria-expanded={isOpen}>
        <div className="rb-section-header-left">
          {icon}
          <h3 className="rb-section-title">
            {title}
            {badge && <span className="rb-section-badge">{badge}</span>}
          </h3>
        </div>
        <div className="rb-section-actions">
          <button className="rb-ai-btn" onClick={(e) => { e.stopPropagation(); onAi(); }} disabled={aiLoading} title={`Generate ${title} with AI`}>
            {aiLoading ? (
              <Loader2 size={14} className="rb-spinner" />
            ) : (
              <Sparkles size={14} />
            )}
            {aiLoading ? 'Generating...' : 'AI Generate'}
          </button>
          <ChevronDown size={18} className={`rb-chevron ${isOpen ? 'open' : ''}`} />
        </div>
      </div>
      <motion.div
        className={`rb-section-body ${isOpen ? '' : 'collapsed'}`}
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default ResumeBuilder;
