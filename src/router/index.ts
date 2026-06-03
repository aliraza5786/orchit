import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore, getToken } from "../stores/auth";
import { redirectToLogin } from "../utilities/authRedirect";
import {
  clearOnboardingStorageKeys,
  isOnboardingComplete,
} from "../utilities/onboardingRedirect";
import Task from "../views/Workspaces/Task.vue";
import Users from "../views/Workspaces/Users.vue";
import api, { isPublicAuthRequest } from "../libs/api";
import type { AxiosError, AxiosResponse } from "axios";
import ReleaseNote from "../views/ReleaseNote.vue";

const Login = () => import("../views/Auth/Login.vue");
const Register = () => import("../views/Auth/Register.vue");
const OtpVerification = () => import("../views/Auth/OtpVerification.vue");
const CreateProfile = () => import("../views/Auth/CreateProfile.vue");
const CreateOrganization = () => import("../views/Auth/CreateOrganization.vue");
const AssociatedOrganization = () => import("../views/Auth/AssociatedOrganization.vue");
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
  'onboarding',
])

function resolveOnboardingRedirect(
  auth: ReturnType<typeof useAuthStore>,
  to: any,
): string | null {

  const hasToken = !!getToken()
  if (!hasToken) return '/login'
  if (!auth.user) return null

  const userData = auth.user?.data ?? auth.user
  const onboardingComplete = isOnboardingComplete(userData)

  const fromSettings =
    to?.query?.fromSettings === 'true' ||
    to?.query?.fromSettings === true ||
    to?.fullPath?.includes('fromSettings=true')

  // Settings "Create organization" — keep query (mode, fromSettings); do not strip URL
  if (fromSettings) {
    if (to.name === 'onboarding') return null
    return '/onboarding'
  }

  if (onboardingComplete) {
    clearOnboardingStorageKeys()
    return '/dashboard'
  }

  return '/onboarding'
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
  { path: "/onboarding",             name: "onboarding",     component: CreateProfile,    meta: { requiresAuth: false, onboarding: true } },
  { path: "/onboarding-organization", name: "onboarding-organization", component: CreateOrganization, meta: { requiresAuth: false, onboarding: true } },
  { path: "/create-organization", redirect: "/onboarding-organization" },
  { path: "/associated-organization", name: "associated-organization", component: AssociatedOrganization, meta: { requiresAuth: true } },
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
    const onWorkspaceInvite =
      typeof window !== 'undefined' &&
      window.location.pathname.startsWith('/workspace-invite/')
    if (
      error.response?.status === 401 &&
      !isPublicAuthRequest(error.config) &&
      !onWorkspaceInvite
    ) {
      const auth = useAuthStore()
      auth.logout()
      redirectToLogin(router, window.location.pathname)
    }
    return Promise.reject(error)
  }
)

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  // ─────────────────────────────────────────────
  // Logout handling
  // ─────────────────────────────────────────────
  if (to.name === 'Login' && to.query.logout === 'true') {
    auth.logout()
    return next()
  }

  // ─────────────────────────────────────────────
  // Bootstrap auth (MUST happen before decisions)
  // ─────────────────────────────────────────────
  if (!auth.initialized) {
    await auth.bootstrap()
  }

  const hasToken = !!getToken()

  // ─────────────────────────────────────────────
  // Subdomain logic (unchanged)
  // ─────────────────────────────────────────────
  const hostname = window.location.hostname
  let subdomain: string | null = null

  if (hostname.endsWith('.streamed.space') && hostname !== 'streamed.space') {
    subdomain = hostname.replace('.streamed.space', '')
    if (subdomain === 'www' || subdomain === 'stagging') subdomain = null
  } else if (hostname.endsWith('.orchit.ai') && hostname !== 'orchit.ai') {
    subdomain = hostname.replace('.orchit.ai', '')
    if (subdomain === 'www') subdomain = null
  } else if (hostname.endsWith('.localhost') && hostname !== 'localhost') {
    subdomain = hostname.replace('.localhost', '')
    if (subdomain === 'www') subdomain = null
  }

  if (subdomain && to.name === 'NotFound') {
    return next('/dashboard')
  }

  if (subdomain && to.name === 'Login') {
    const primary =
      import.meta.env.VITE_PRIMARY_DOMAIN || 'orchit.ai'

    window.location.href =
      `${window.location.protocol}//${primary}/login?logout=true`
    return
  }

  // ─────────────────────────────────────────────
  // Clean onboarding storage if completed
  // ─────────────────────────────────────────────
  if (hasToken && auth.user) {
    const userData = auth.user?.data ?? auth.user

    if (isOnboardingComplete(userData)) {
      clearOnboardingStorageKeys()
    }
  }

  // ─────────────────────────────────────────────
  // Onboarding route protection
  // ─────────────────────────────────────────────
  const requiresAuth = to.matched.some(r => r.meta.requiresAuth === true)
  const isOnboardingRoute = ONBOARDING_ROUTE_NAMES.has(to.name as string)

  if (hasToken && auth.user && isOnboardingRoute) {
    const redirect = resolveOnboardingRedirect(auth, to)

    if (redirect && redirect !== to.fullPath) {
      return next({ path: redirect, replace: true })
    }
  }

  // ─────────────────────────────────────────────
  // Auth gate
  // ─────────────────────────────────────────────
  if (requiresAuth && !hasToken) {
    redirectToLogin(undefined, to.fullPath)
    return
  }

  // ─────────────────────────────────────────────
  // Prevent logged-in users seeing login
  // ─────────────────────────────────────────────
  if (to.name === 'Login' && hasToken && !subdomain) {
    return next({ name: 'Home' })
  }

  next()
})

export default router
