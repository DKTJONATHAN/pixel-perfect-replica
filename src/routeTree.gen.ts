/* eslint-disable */
// @ts-nocheck
// Regenerated route tree for KidRight Academy portals.
import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as LoginRouteImport } from './routes/login'
import { Route as LoginStudentRouteImport } from './routes/login.student'
import { Route as LoginStaffRouteImport } from './routes/login.staff'
import { Route as LoginAdminRouteImport } from './routes/login.admin'
import { Route as SignupRouteImport } from './routes/signup'
import { Route as StudentIndexRouteImport } from './routes/student/index'
import { Route as StaffIndexRouteImport } from './routes/staff/index'
import { Route as StaffSectionRouteImport } from './routes/staff/$section'
import { Route as AdminIndexRouteImport } from './routes/admin/index'
import { Route as AdminSectionRouteImport } from './routes/admin/$section'

const IndexRoute = IndexRouteImport.update({ id: '/', path: '/', getParentRoute: () => rootRouteImport } as any)
const LoginRoute = LoginRouteImport.update({ id: '/login', path: '/login', getParentRoute: () => rootRouteImport } as any)
const LoginStudentRoute = LoginStudentRouteImport.update({ id: '/login/student', path: '/login/student', getParentRoute: () => rootRouteImport } as any)
const LoginStaffRoute = LoginStaffRouteImport.update({ id: '/login/staff', path: '/login/staff', getParentRoute: () => rootRouteImport } as any)
const LoginAdminRoute = LoginAdminRouteImport.update({ id: '/login/admin', path: '/login/admin', getParentRoute: () => rootRouteImport } as any)
const SignupRoute = SignupRouteImport.update({ id: '/signup', path: '/signup', getParentRoute: () => rootRouteImport } as any)
const StudentIndexRoute = StudentIndexRouteImport.update({ id: '/student/', path: '/student/', getParentRoute: () => rootRouteImport } as any)
const StaffIndexRoute = StaffIndexRouteImport.update({ id: '/staff/', path: '/staff/', getParentRoute: () => rootRouteImport } as any)
const StaffSectionRoute = StaffSectionRouteImport.update({ id: '/staff/$section', path: '/staff/$section', getParentRoute: () => rootRouteImport } as any)
const AdminIndexRoute = AdminIndexRouteImport.update({ id: '/admin/', path: '/admin/', getParentRoute: () => rootRouteImport } as any)
const AdminSectionRoute = AdminSectionRouteImport.update({ id: '/admin/$section', path: '/admin/$section', getParentRoute: () => rootRouteImport } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/login/student': typeof LoginStudentRoute
  '/login/staff': typeof LoginStaffRoute
  '/login/admin': typeof LoginAdminRoute
  '/signup': typeof SignupRoute
  '/signup': typeof SignupRoute
  '/student/': typeof StudentIndexRoute
  '/staff/': typeof StaffIndexRoute
  '/staff/$section': typeof StaffSectionRoute
  '/admin/': typeof AdminIndexRoute
  '/admin/$section': typeof AdminSectionRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/login/student': typeof LoginStudentRoute
  '/login/staff': typeof LoginStaffRoute
  '/login/admin': typeof LoginAdminRoute
  '/student': typeof StudentIndexRoute
  '/staff': typeof StaffIndexRoute
  '/staff/$section': typeof StaffSectionRoute
  '/admin': typeof AdminIndexRoute
  '/admin/$section': typeof AdminSectionRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/login': typeof LoginRoute
  '/login/student': typeof LoginStudentRoute
  '/login/staff': typeof LoginStaffRoute
  '/login/admin': typeof LoginAdminRoute
  '/signup': typeof SignupRoute
  '/student/': typeof StudentIndexRoute
  '/staff/': typeof StaffIndexRoute
  '/staff/$section': typeof StaffSectionRoute
  '/admin/': typeof AdminIndexRoute
  '/admin/$section': typeof AdminSectionRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/login' | '/login/student' | '/login/staff' | '/login/admin' | '/signup' | '/student/' | '/staff/' | '/staff/$section' | '/admin/' | '/admin/$section'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/login' | '/login/student' | '/login/staff' | '/login/admin' | '/signup' | '/student' | '/staff' | '/staff/$section' | '/admin' | '/admin/$section'
  id: '__root__' | '/' | '/login' | '/login/student' | '/login/staff' | '/login/admin' | '/student/' | '/staff/' | '/staff/$section' | '/admin/' | '/admin/$section'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  LoginRoute: typeof LoginRoute
  LoginStudentRoute: typeof LoginStudentRoute
  LoginStaffRoute: typeof LoginStaffRoute
  LoginAdminRoute: typeof LoginAdminRoute
  StudentIndexRoute: typeof StudentIndexRoute
  StaffIndexRoute: typeof StaffIndexRoute
  StaffSectionRoute: typeof StaffSectionRoute
  AdminIndexRoute: typeof AdminIndexRoute
  AdminSectionRoute: typeof AdminSectionRoute
}
declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': { id: '/'; path: '/'; fullPath: '/'; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport }
    '/login': { id: '/login'; path: '/login'; fullPath: '/login'; preLoaderRoute: typeof LoginRouteImport; parentRoute: typeof rootRouteImport }
    '/login/student': { id: '/login/student'; path: '/login/student'; fullPath: '/login/student'; preLoaderRoute: typeof LoginStudentRouteImport; parentRoute: typeof rootRouteImport }
    '/login/staff': { id: '/login/staff'; path: '/login/staff'; fullPath: '/login/staff'; preLoaderRoute: typeof LoginStaffRouteImport; parentRoute: typeof rootRouteImport }
    '/login/admin': { id: '/login/admin'; path: '/login/admin'; fullPath: '/login/admin'; preLoaderRoute: typeof LoginAdminRouteImport; parentRoute: typeof rootRouteImport }
    '/signup': { id: '/signup'; path: '/signup'; fullPath: '/signup'; preLoaderRoute: typeof SignupRouteImport; parentRoute: typeof rootRouteImport }
    '/student/': { id: '/student/'; path: '/student'; fullPath: '/student/'; preLoaderRoute: typeof StudentIndexRouteImport; parentRoute: typeof rootRouteImport }
    '/staff/': { id: '/staff/'; path: '/staff'; fullPath: '/staff/'; preLoaderRoute: typeof StaffIndexRouteImport; parentRoute: typeof rootRouteImport }
    '/staff/$section': { id: '/staff/$section'; path: '/staff/$section'; fullPath: '/staff/$section'; preLoaderRoute: typeof StaffSectionRouteImport; parentRoute: typeof rootRouteImport }
    '/admin/': { id: '/admin/'; path: '/admin'; fullPath: '/admin/'; preLoaderRoute: typeof AdminIndexRouteImport; parentRoute: typeof rootRouteImport }
    '/admin/$section': { id: '/admin/$section'; path: '/admin/$section'; fullPath: '/admin/$section'; preLoaderRoute: typeof AdminSectionRouteImport; parentRoute: typeof rootRouteImport }
  }
}
const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  LoginRoute,
  LoginStudentRoute,
  LoginStaffRoute,
  LoginAdminRoute,
  SignupRoute,
  StudentIndexRoute,
  StaffIndexRoute,
  StaffSectionRoute,
  AdminIndexRoute,
  AdminSectionRoute,
}
export const routeTree = rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>()
import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
