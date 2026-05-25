# Organization onboarding — API contract

Frontend route: `/onboarding-organization`

## 1. Signup — `POST /auth/signup` (step 5a)

```json
{
  "u_full_name": "Alex Morgan",
  "u_email": "alex@acme.com",
  "u_password": "Str0ng!Pass",
  "agree_to_terms": true
}
```

- Backend creates pending user and emails a **5-digit OTP** (same as `/register`).
- Do **not** use `endOtp: true` (that skips email verification).

## 2. Verify OTP — `POST /auth/verify-otp` (step 5b)

```json
{
  "u_email": "alex@acme.com",
  "otp": "12345"
}
```

- Success must include `data.token` for authenticated company create.

## 3. Resend OTP — `POST /auth/resend-otp`

```json
{ "u_email": "alex@acme.com" }
```

## 4. Login — `POST /auth/login` (fallback only)

Use only if `verify-otp` does not return a token.

## 5. Create company — `POST /workspace/company` (step 5c)

```json
{
  "type": "team",
  "title": "Acme Corporation",
  "company_size": "51–200",
  "industries": ["Ecommerce", "SaaS"],
  "work_to_do": "software_development",
  "like_to_manage": ["tasks", "projects", "docs", "goals"],
  "role_id": "product_manager",
  "primary_contact_name": "Jordan Lee",
  "primary_contact_email": "jordan@acme.com"
}
```

| Field | Notes |
|-------|--------|
| `industries` | **(NEW)** string[], min 1, from `GET /common/industries` |
| `work_to_do` | Work type id (step 4) |
| `primary_contact_name` / `primary_contact_email` | **(NEW)** from step 2 |

## 6. Update company — `PUT /workspace/company`

Domain (optional):

```json
{ "custom_domain": "acme.com" }
```

Referral:

```json
{ "heard_about_us": ["google", "friend"] }
```

## 7. Domain verification (optional)

- `POST /company-domains/verify` — `{ domain, verification_method, company_id }`
- `POST /company-domains/{domainId}/recheck`

## Lifecycle

| Phase | Endpoint | Fields |
|-------|----------|--------|
| 5a | `POST /auth/signup` | user fields → OTP email |
| 5b | `POST /auth/verify-otp` | `u_email`, `otp` → token |
| 5c | `POST /workspace/company` | steps 1–4 aggregate |
| 6 | `PUT /workspace/company` | `custom_domain`, `heard_about_us` |
