export const ORG_STEP_LABELS = [
  'Organization',
  'Contact',
  'Domain',
  'Account',
  'Finish',
] as const

export const ORG_COMPANY_SIZE_OPTIONS = [
  { title: '1 – 10', _id: '1–10' },
  { title: '11 – 50', _id: '11–50' },
  { title: '51 – 200', _id: '51–200' },
  { title: '201 – 500', _id: '201–500' },
  { title: '501 – 1,000', _id: '501–1000' },
  { title: '1,001 – 5,000', _id: '1001–5000' },
  { title: '5,001 – 10,000', _id: '5001–10000' },
  { title: '10,001+', _id: '10001+' },
] as const

export const ORG_CONTACT_ROLE_OPTIONS = [
  { title: 'CEO / Founder', _id: 'ceo_founder' },
  { title: 'CTO / Technical Lead', _id: 'cto_tech_lead' },
  { title: 'Product Manager', _id: 'product_manager' },
  { title: 'Software Engineer', _id: 'software_engineer' },
  { title: 'Designer', _id: 'designer' },
  { title: 'Marketing', _id: 'marketing' },
  { title: 'Sales', _id: 'sales' },
  { title: 'Operations', _id: 'operations' },
  { title: 'HR / People', _id: 'hr_people' },
  { title: 'Finance', _id: 'finance' },
  { title: 'Student', _id: 'student' },
  { title: 'Teacher / Lecturer', _id: 'teacher_lecturer' },
  { title: 'Other', _id: 'other' },
] as const

export const ORG_REFERRAL_OPTIONS = [
  { id: 'google', label: 'Google Search' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'friend', label: 'Friend / Colleague' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'producthunt', label: 'Product Hunt' },
  { id: 'ads', label: 'Ads' },
  { id: 'blog', label: 'Blog / Article' },
  { id: 'other', label: 'Other' },
] as const

export const OTP_DIGITS = 5
export const OTP_RESEND_COOLDOWN_SEC = 45

/** Domain verification methods (same as CreateProfile step 8). */
export const ORG_VERIFICATION_METHODS = [
  { value: 'cname', label: 'CNAME' },
  { value: 'txt', label: 'TXT' },
  { value: 'http', label: 'HTTP File' },
] as const

/** Shown when DNS check reports domain is not registered (same as CreateProfile). */
export const ORG_DOMAIN_REGISTRARS = [
  { name: 'GoDaddy', getUrl: (d: string) => `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(d)}` },
  { name: 'Namecheap', getUrl: (d: string) => `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(d)}` },
  { name: 'Cloudflare', getUrl: () => 'https://www.cloudflare.com/products/registrar/' },
  { name: 'Hostinger', getUrl: (d: string) => `https://www.hostinger.com/domain-name-search?query=${encodeURIComponent(d)}` },
  { name: 'Porkbun', getUrl: (d: string) => `https://porkbun.com/checkout/search?q=${encodeURIComponent(d)}` },
] as const
