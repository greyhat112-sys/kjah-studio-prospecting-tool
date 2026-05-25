// Per-prospect audit checklist. Ticked items live on prospect.checks
// (JSONB array of IDs in Supabase). The first four map 1:1 to KJAH's
// service offerings — a ticked box is a known pitch angle. The last
// two are leading indicators of "actually has budget to spend".

export const CHECKLIST = [
  { id: 'no_website',       label: 'No website',             group: 'pitch'  },
  { id: 'needs_redesign',   label: 'Site needs redesign',    group: 'pitch'  },
  { id: 'needs_funnel',     label: 'Needs funnel / CTA',     group: 'pitch'  },
  { id: 'needs_automation', label: 'Needs automation',       group: 'pitch'  },
  { id: 'active_social',    label: 'Active on social',       group: 'signal' },
  { id: 'has_reviews',      label: 'Has reviews / traction', group: 'signal' },
]

export const CHECKLIST_GROUPS = [
  { id: 'pitch',  label: 'Pitch angle' },
  { id: 'signal', label: 'Positive signals' },
]

export const CHECKLIST_TOTAL = CHECKLIST.length
