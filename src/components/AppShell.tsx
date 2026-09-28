/**
 * Authenticated layout for student / staff / admin / parent portals.
 */
import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BadgeDollarSign,
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PenLine,
  Plane,
  School,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthProvider";
import { useSchool, type Permission } from "@/context/SchoolProvider";
import type { Role } from "@/lib/types";
import { Avatar, Button, Spinner } from "@/components/UI";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
};

const NAV_BY_PORTAL: Record<string, { group: string; items: NavItem[] }[]> = {
  student: [
    {
      group: "My learning",
      items: [{ to: "/student", label: "Dashboard", icon: LayoutDashboard }],
    },
  ],
  parent: [
    {
      group: "Family",
      items: [{ to: "/parent", label: "Children", icon: LayoutDashboard }],
    },
  ],
  staff: [
    {
      group: "Overview",
      items: [{ to: "/staff", label: "Dashboard", icon: LayoutDashboard }],
    },
    {
      group: "Teaching",
      items: [
        { to: "/staff/students", label: "Students", icon: GraduationCap, permission: "students.view" },
        { to: "/staff/classes", label: "Classes", icon: School, permission: "students.view" },
        {
          to: "/staff/attendance",
          label: "Attendance",
          icon: CalendarCheck,
          permission: "attendance.mark",
        },
        { to: "/staff/marks", label: "Enter marks", icon: PenLine, permission: "grades.edit" },
        { to: "/staff/grades", label: "Grades list", icon: ClipboardList, permission: "grades.edit" },
      ],
    },
    {
      group: "My work",
      items: [{ to: "/staff/leave", label: "Leave", icon: Plane, permission: "leave.apply" }],
    },
  ],
  admin: [
    {
      group: "Overview",
      items: [
        { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { to: "/admin/register", label: "Registration", icon: UserPlus, permission: "register.manage" },
      ],
    },
    {
      group: "Students",
      items: [
        { to: "/admin/students", label: "Students", icon: GraduationCap, permission: "students.view" },
        { to: "/admin/classes", label: "Classes", icon: School, permission: "students.view" },
        {
          to: "/admin/attendance",
          label: "Attendance",
          icon: CalendarCheck,
          permission: "attendance.mark",
        },
        { to: "/admin/grades", label: "Grades", icon: ClipboardList, permission: "grades.edit" },
        { to: "/admin/fees", label: "Fees", icon: BadgeDollarSign, permission: "fees.manage" },
      ],
    },
    {
      group: "Staff",
      items: [
        { to: "/admin/staff", label: "Staff", icon: Users, permission: "staff.view" },
        {
          to: "/admin/staff-roles",
          label: "Roles & duty",
          icon: ShieldCheck,
          permission: "staff.edit",
        },
        { to: "/admin/leave", label: "Leave", icon: Plane, permission: "leave.approve" },
        { to: "/admin/duties", label: "Duties & teaching", icon: ClipboardList, permission: "classes.manage" },
        { to: "/admin/payroll", label: "Payroll", icon: Wallet, permission: "payroll.view" },
      ],
    },
    {
      group: "School",
      items: [
        { to: "/admin/settings", label: "Settings", icon: SettingsIcon, permission: "settings.manage" },
      ],
    },
  ],
};
