import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { useAuthStore, getToken } from "../stores/auth";
import { redirectToLogin } from "../utilities/authRedirect"; // ← new
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

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: LandingPageLayout,
    children: [
      {
        path: "",
        name: "new-homepage",
        component: NewHomepage,
        beforeEnter: (to, from, next) => {
          console.log(to, from);
          
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
  { path: "/login", name: "Login", component: Login, meta: { requiresAuth: false } },
  { path: "/register", name: "Register", component: Register, meta: { requiresAuth: false } },
  { path: "/otp-verification/:email", name: "Otp", component: OtpVerification, meta: { requiresAuth: false } },
  { path: "/forgot-password", name: "ForgotPassword", component: ForgotPassword, meta: { requiresAuth: false } },
  { path: "/reset-password", name: "ResetPassword", component: ResetPassword, meta: { requiresAuth: false } },
  { path: "/create-profile", name: "create-profile", component: CreateProfile, meta: { requiresAuth: false } },
  { path: "/finish-profile", name: "finishProfile", component: FinishProfile, meta: { requiresAuth: true } },
  { path: "/workspace-invite/:token", name: "workspaceInvite", component: WorkspaceInvite, meta: { requiresAuth: false } },
  { path: "/space-invite/:token", name: "spaceInvite", component: CompanyInvites, meta: { requiresAuth: false } },
  { path: "/company-invite/:token", name: "companyInvite", component: CompanyInvites, meta: { requiresAuth: false } },
  { path: "/company-join/:token", name: "companyjoin", component: companyJoin, meta: { requiresAuth: false } },
  { path: "/join-as-owner/:token/:action", name: "joinAsOwner", component: joinAsOwner, meta: { requiresAuth: false } },
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
      { path: "peak/:id", name: "peak", component: Peak },
      { path: "talent/:id", name: "people", component: People },
      { path: "pin/:id/:module_id", name: "pin", component: Pin },
      { path: "plan/:id", name: "plan", component: Plan },
      { path: "process/:id", name: "process", component: Process2 },
      { path: "more/:id", name: "more", component: More },
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

// ── GAP 2 FIX: Axios 401 interceptor ─────────────────────────────────────────
// Token expired mid-session. Previously did router.replace({ name: 'Login' })
// which renders company.streamed.space/login — a route that doesn't exist on subdomains.
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore()
      auth.logout()
      // redirectToLogin() checks hostname — issues hard redirect on subdomains,
      // uses Vue router on main domain. Never lands on subdomain /login.
      redirectToLogin(router, window.location.pathname)
    }
    return Promise.reject(error)
  }
)

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()

  if (!auth.initialized) {
    await auth.bootstrap()
  }

  const hostname = window.location.hostname
  let subdomain: string | null = null

  if (hostname.endsWith('.streamed.space') && hostname !== 'streamed.space') {
    subdomain = hostname.replace('.streamed.space', '')
    if (subdomain === 'www' || subdomain === 'stagging') subdomain = null
  } else if (hostname.endsWith('.localhost') && hostname !== 'localhost') {
    subdomain = hostname.replace('.localhost', '')
    if (subdomain === 'www') subdomain = null
  }

  // On subdomain: unknown routes → dashboard
  if (subdomain && to.name === 'NotFound') {
    return next('/dashboard')
  }

  // SAFETY NET: On a company subdomain, NEVER render /login locally.
  // If anything tries to push to Login while on a subdomain,
  // hard redirect to primary domain login instead.
  // This catches Opera's cookie blocking, token expiry, any edge case.
  if (subdomain && to.name === 'Login') {
    const primary = import.meta.env.VITE_PRIMARY_DOMAIN || 'stagging.streamed.space'
    window.location.href = `${window.location.protocol}//${primary}/login?logout=true`
    return // stop navigation
  }

  const requiresAuth = to.matched.some(r => r.meta.requiresAuth === true)
  const hasToken = !!getToken()

  if (requiresAuth && !hasToken) {
    const redirected = redirectToLogin(undefined, to.fullPath)
    if (redirected) return
    return next({ name: 'Login' })
  }

  if (to.name === 'Login' && hasToken && !subdomain) {
    return next({ name: 'Home' })
  }

  next()
})

export default router