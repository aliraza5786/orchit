import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore, getToken } from "../stores/auth";
import { redirectToLogin } from "../utilities/authRedirect";
import Task from "../views/Workspaces/Task.vue";
import Users from "../views/Workspaces/Users.vue";
import api from "../libs/api";
import type { AxiosError, AxiosResponse } from "axios";
import ReleaseNote from "../views/ReleaseNote.vue";

const Login = () => import("../views/Auth/Login.vue");
const Register = () => import("../views/Auth/Register.vue");
const OtpVerification = () => import("../views/Auth/OtpVerification.vue");
const CreateProfile = () => import("../views/Auth/CreateProfile.vue");
const ForgotPassword = () => import("../views/Auth/ForgotPassword.vue");
const ResetPassword = () => import("../views/Auth/ResetPassword.vue");
const FinishProfile = () => import("../views/FinishProfile.vue");
const NotFound = () => import("../views/NotFound.vue");
const ModuleDetail = () => import("../views/More/ModuleDetail.vue");
const Plan = () => import("../views/Plan/Plan.vue");
const Pin = () => import("../views/Pin/Pin.vue");
const LandingLayout = () => import("../layout/mainLayout/LandingPageLayout.vue");
const Home = () => import("../views/Workspaces/Home.vue");
const CreateWorkspace = () => import("../views/CreateWorkspace/CreateWorkspace.vue");
const WorkspaceLayout = () => import("../layout/WorkspaceLayout/WorkspaceLayout.vue");
const Peak = () => import("../views/Peak.vue");
const People = () => import("../views/People/People.vue");
const Process2 = () => import("../views/Process2/Process2.vue");
const More = () => import("../views/More/More.vue");
const Product = () => import("../views/Product/Product.vue");
const WorkspaceInvite = () => import("../views/Invites/WorkspaceInvite.vue");
const CompanyInvites = () => import("../views/Invites/CompanyInvites.vue");
const companyJoin = () => import("../views/Invites/JoinPage.vue");
const joinAsOwner = () => import("../views/Invites/OrganizationOwnershipInvite.vue");
const LandingPageLayout = () => import("../layout/LandingPageLayout/LandingPageLayout.vue");
const requestDelete = () => import("../views/request_delete.vue");
const NewHomepage = () => import("../views/homenew.vue");
const Pricing = () => import("../views/Pricing.vue");
const TermsOfServices = () => import("../views/TermsOfServices.vue");
const PrivactPolicy = () => import("../views/PrivacyPolicy.vue");
const ContactUs = () => import("../views/ContactUs.vue");
const BlogList = () => import("../views/blog/BlogList.vue");
const BlogDetail = () => import("../views/blog/BlogDetail.vue");
const KnowledgeCenterView = () => import("../views/KnowledgeCenter/KnowledgeCenterView.vue");
const SettingsView = () => import("../views/Settings/SettingsView.vue");

const ONBOARDING_ROUTE_NAMES = new Set([
  'Register',
  'Otp',
  'create-profile',
])

function resolveOnboardingRedirect(auth: ReturnType<typeof useAuthStore>): string | null {
  const hasToken = !!getToken()
 
  if (!hasToken) return '/login'
  if (!auth.user) return null // bootstrap still in progress — don't redirect yet
 
  // API wraps data under .data in some responses
  const userData = auth.user?.data ?? auth.user
 
  const hasActiveCompany = !!userData?.active_company_id
  const hasWorkspaces    = Array.isArray(userData?.workspaces) && userData.workspaces.length > 0
 
  // Onboarding complete: has a company or has workspaces → send to dashboard & clear keys
  if (hasActiveCompany || hasWorkspaces) {
    const keys = [
      'onboarding_active_step', 'onboarding_dns_input', 'onboarding_has_custom_domain',
      'onboarding_company_id', 'onboarding_site_name', 'onboarding_site_slug',
      'onboarding_super_admin_otp_sent', 'onboarding_super_admin_user_id',
      'onboarding_super_admin_email_prefix', 'onboarding_super_admin_name',
      'onboarding_domain_phase', 'onboarding_current_domain', 'onboarding_current_instructions',
      'onboarding_selected_verification_method'
    ]
    keys.forEach(k => localStorage.removeItem(k))
    return '/dashboard'
  }

  // If there is an incomplete onboarding step saved in localStorage, force routing to create-profile
  const onboardingStep = localStorage.getItem('onboarding_active_step')
  if (onboardingStep && ['5', '51', '8', '9'].includes(onboardingStep)) {
    return '/create-profile'
  }
 
  // Onboarding incomplete: no company, no workspaces → must finish create-profile
  return '/create-profile'
}
const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: LandingPageLayout,
    children: [
      {
        path: "",
        name: "new-homepage",
        component: NewHomepage,
        beforeEnter: (_to, _from, next) => {
          const authStore = useAuthStore()
          if (authStore.isAuthenticated) {
            next('/dashboard')
          } else {
            next()
          }
        }
      },
      { path: "contact-us", name: "contact-us", component: ContactUs },
      { path: "/pricing", name: "pricing", component: Pricing, meta: { requiresAuth: false } },
      { path: "/terms-of-services", name: "terms-of-services", component: TermsOfServices, meta: { requiresAuth: false } },
      { path: "/privacy-policy", name: "Privact-policy", component: PrivactPolicy, meta: { requiresAuth: false } },
      { path: "/release-notes", name: "release-note", component: ReleaseNote, meta: { requiresAuth: false } },
      { path: "/blogs", name: "blogList", component: BlogList, meta: { requiresAuth: false } },
      { path: "/blog/:id", name: "BlogDetail", component: BlogDetail, props: true, meta: { requiresAuth: false } },
    ],
  },
  {
    path: "/knowledge-center",
    component: KnowledgeCenterView,
    children: [
      {
        path: "/knowledge-center/:slug",
        name: "KnowledgeCenter",
        component: KnowledgeCenterView,
        props: true,
        meta: { requiresAuth: false },
      },
    ],
  },

  // ── Auth / Onboarding routes ─────────────────────────────────────────────
  // All marked with meta.onboarding = true so the global guard can handle them.
  { path: "/login",                  name: "Login",          component: Login,            meta: { requiresAuth: false } },
  { path: "/register",               name: "Register",       component: Register,         meta: { requiresAuth: false, onboarding: true } },
  { path: "/otp-verification/:email",name: "Otp",            component: OtpVerification,  meta: { requiresAuth: false, onboarding: true } },
  { path: "/create-profile",         name: "create-profile", component: CreateProfile,    meta: { requiresAuth: false, onboarding: true } },
  { path: "/forgot-password",        name: "ForgotPassword", component: ForgotPassword,   meta: { requiresAuth: false } },
  { path: "/reset-password",         name: "ResetPassword",  component: ResetPassword,    meta: { requiresAuth: false } },
  { path: "/finish-profile",         name: "finishProfile",  component: FinishProfile,    meta: { requiresAuth: true } },

  // ── Invite routes ────────────────────────────────────────────────────────
  { path: "/workspace-invite/:token", name: "workspaceInvite", component: WorkspaceInvite, meta: { requiresAuth: false } },
  { path: "/space-invite/:token",     name: "spaceInvite",     component: CompanyInvites,  meta: { requiresAuth: false } },
  { path: "/company-invite/:token",   name: "companyInvite",   component: CompanyInvites,  meta: { requiresAuth: false } },
  { path: "/company-join/:token",     name: "companyjoin",     component: companyJoin,     meta: { requiresAuth: false } },
  { path: "/join-as-owner/:token/:action", name: "joinAsOwner", component: joinAsOwner,   meta: { requiresAuth: false } },

  // ── App routes ───────────────────────────────────────────────────────────
  {
    path: "/dashboard",
    component: LandingLayout,
    children: [
      { path: "", name: "Home", component: Home, meta: { requiresAuth: true } },
      { path: "task", name: "task", component: Task, meta: { requiresAuth: true } },
      { path: "users", name: "users", component: Users, meta: { requiresAuth: true } },
    ],
  },
  { path: "/create-workspace/:id?", name: "create-workspace", component: CreateWorkspace, props: true, meta: { requiresAuth: false } },
  { path: "/request_delete", name: "Request Delete", component: requestDelete, meta: { requiresAuth: false } },
  {
    path: "/workspace",
    component: WorkspaceLayout,
    meta: { requiresAuth: true },
    children: [
      { path: "peak/:id/:job_id", name: "peakWithJob", component: Peak },
      { path: "peak/:id",         name: "peak",        component: Peak },
      { path: "talent/:id",       name: "people",      component: People },
      { path: "pin/:id/:module_id", name: "pin",       component: Pin },
      { path: "plan/:id",         name: "plan",        component: Plan },
      { path: "process/:id",      name: "process",     component: Process2 },
      { path: "more/:id",         name: "more",        component: More },
      { path: "more/detail/:id/:module_id", name: "moreDetail", component: ModuleDetail },
      {
        path: ":id/:module_id",
        component: Product,
        children: [
          { path: "task/:card_id", name: "productTask", component: Product }
        ]
      }
    ],
  },
  { path: "/settings", name: "settings", component: SettingsView, meta: { requiresAuth: true } },
  { path: "/:pathMatch(.*)*", name: "NotFound", component: NotFound },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_, __, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0, behavior: 'smooth' }
  },
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      redirectToLogin(router, window.location.pathname)
    }
    return Promise.reject(error)
  }
)

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  // Handle cross-subdomain logout synchronization
  if (to.name === 'Login' && to.query.logout === 'true') {
    auth.logout()
  }

  // 1. Bootstrap auth state once per session
  if (!auth.initialized) {
    await auth.bootstrap()
  }

  // ── Subdomain logic (unchanged from your original) ──────────────────────
  const hostname = window.location.hostname
  let subdomain: string | null = null

  if (hostname.endsWith('.streamed.space') && hostname !== 'streamed.space') {
    subdomain = hostname.replace('.streamed.space', '')
    if (subdomain === 'www' || subdomain === 'stagging') subdomain = null
  } else if (hostname.endsWith('.localhost') && hostname !== 'localhost') {
    subdomain = hostname.replace('.localhost', '')
    if (subdomain === 'www') subdomain = null
  }

  if (subdomain && to.name === 'NotFound') {
    return next('/dashboard')
  }

  if (subdomain && to.name === 'Login') {
    const primary = import.meta.env.VITE_PRIMARY_DOMAIN || 'stagging.streamed.space'
    window.location.href = `${window.location.protocol}//${primary}/login?logout=true`
    return
  }
  // ── End subdomain logic ──────────────────────────────────────────────────

  const hasToken = !!getToken()

  // 1.5 Force incomplete onboarding redirect for all authenticated / app routes
  if (hasToken && auth.user) {
    const userData = auth.user?.data ?? auth.user
    const hasActiveCompany = !!userData?.active_company_id
    const hasWorkspaces    = Array.isArray(userData?.workspaces) && userData.workspaces.length > 0

    if (hasActiveCompany || hasWorkspaces) {
      const keys = [
        'onboarding_active_step', 'onboarding_dns_input', 'onboarding_has_custom_domain',
        'onboarding_company_id', 'onboarding_site_name', 'onboarding_site_slug',
        'onboarding_super_admin_otp_sent', 'onboarding_super_admin_user_id',
        'onboarding_super_admin_email_prefix', 'onboarding_super_admin_name',
        'onboarding_domain_phase', 'onboarding_current_domain', 'onboarding_current_instructions',
        'onboarding_selected_verification_method'
      ]
      keys.forEach(k => localStorage.removeItem(k))
    } else {
      const onboardingStep = localStorage.getItem('onboarding_active_step')
      if (onboardingStep && ['5', '51', '8', '9'].includes(onboardingStep)) {
        if (to.path !== '/create-profile') {
          return next({ path: '/create-profile', replace: true })
        }
      }
    }
  }

  const requiresAuth = to.matched.some(r => r.meta.requiresAuth === true)
  const isOnboardingRoute = ONBOARDING_ROUTE_NAMES.has(to.name as string)
  if (isOnboardingRoute && hasToken) {
    const correctDestination = resolveOnboardingRedirect(auth)
    if (correctDestination && correctDestination !== to.fullPath) {
      // Use replace so we don't push another entry onto the history stack
      return next({ path: correctDestination, replace: true })
    }
  }

  // 3. ── STANDARD AUTH GATE ────────────────────────────────────────────────
  if (requiresAuth && !hasToken) {
    const redirected = redirectToLogin(undefined, to.fullPath)
    if (redirected) return
    return next({ name: 'Login' })
  }

  // 3.5 ── FORCE ONBOARDING FOR AUTHENTICATED PAGES ────────────────────────
  if (requiresAuth && hasToken) {
    const correctDestination = resolveOnboardingRedirect(auth)
    if (correctDestination === '/create-profile' && to.path !== '/create-profile') {
      return next({ path: '/create-profile', replace: true })
    }
  }

  // 4. ── ALREADY LOGGED IN → don't show login page ────────────────────────
  if (to.name === 'Login' && hasToken && !subdomain) {
    return next({ name: 'Home' })
  }

  next()
})

export default router
