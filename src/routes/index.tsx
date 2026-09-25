import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  GraduationCap,
  Heart,
  Mail,
  MapPin,
  Phone,
  School,
  Shield,
  Users,
} from "lucide-react";
import { useSchool } from "@/context/SchoolProvider";
import { Button } from "@/components/UI";

export const Route = createFileRoute("/")({ component: LandingPage });

function LandingPage() {
  const { db } = useSchool();
  const s = db.settings;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl gradient-hero text-primary-foreground">
              <School className="size-5" />
            </span>
            <span>
              <span className="block font-display text-base font-bold leading-tight">{s.schoolName}</span>
              <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">
                {s.motto}
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <a href="#about" className="text-muted-foreground hover:text-foreground">
              About
            </a>
            <a href="#programs" className="text-muted-foreground hover:text-foreground">
              Programs
            </a>
            <a href="#portals" className="text-muted-foreground hover:text-foreground">
              Portals
            </a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 text-primary-foreground lg:grid-cols-2 lg:py-28">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/80">
              Nairobi · Academic year {s.academicYear}
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">
              A place where every child learns, grows, and shines.
            </h1>
            <p className="mt-5 max-w-xl text-base text-primary-foreground/85">
              {s.about ||
                "KidRight Academy delivers quality primary education with strong values, caring teachers, and a safe learning environment."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#portals">
                <Button variant="accent" className="bg-card text-foreground hover:bg-card/90">
                  Access portals
                </Button>
              </a>
              <a href="#contact">
                <Button
                  variant="outline"
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  Contact the school
                </Button>
              </a>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: GraduationCap, label: "CBC-aligned curriculum" },
              { icon: Users, label: "Qualified, caring teachers" },
              { icon: Heart, label: "Safe, inclusive community" },
              { icon: BookOpen, label: "Holistic learner support" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 backdrop-blur"
              >
                <item.icon className="size-6" />
                <p className="mt-3 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">About us</p>
            <h2 className="mt-2 font-display text-3xl font-bold">{s.schoolName}</h2>
            <p className="mt-4 text-muted-foreground">{s.about}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card p-6">
              <h3 className="font-display text-lg font-bold">Vision</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.vision}</p>
            </div>
            <div className="surface-card p-6">
              <h3 className="font-display text-lg font-bold">Mission</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.mission}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="programs" className="border-y border-border bg-muted/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Programs</p>
          <h2 className="mt-2 font-display text-3xl font-bold">What we offer</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Lower Primary",
                body: "Foundational literacy, numeracy, and play-based learning for Grades 1–3.",
              },
              {
                title: "Upper Primary",
                body: "Strong academics across core subjects with continuous assessment and mentorship.",
              },
              {
                title: "Co-curricular",
                body: "Sports, clubs, music, and community service that build character and confidence.",
              },
            ].map((p) => (
              <div key={p.title} className="surface-card p-6">
                <h3 className="font-display text-lg font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="portals" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Portals</p>
        <h2 className="mt-2 font-display text-3xl font-bold">Sign in to your workspace</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Secure access for students, teaching staff, and school administrators. Use the account
          issued by the school office.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <PortalCard
            to="/login/student"
            icon={GraduationCap}
            title="Student portal"
            description="View grades, attendance, fee statements, and school notices."
          />
          <PortalCard
            to="/login/staff"
            icon={Users}
            title="Staff portal"
            description="Mark attendance, enter grades, manage classes, and request leave."
          />
          <PortalCard
            to="/login/admin"
            icon={Shield}
            title="Admin portal"
            description="Full school management: students, staff, fees, payroll, and settings."
          />
        </div>
      </section>

      <section id="contact" className="border-t border-border bg-sidebar py-14 text-sidebar-foreground">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-bold">Contact</h2>
            <ul className="mt-5 space-y-3 text-sm text-sidebar-foreground/80">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0" /> {s.address}
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 shrink-0" /> {s.phone}
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 shrink-0" /> {s.email}
              </li>
            </ul>
          </div>
          <div className="text-sm text-sidebar-foreground/70">
            <p>
              Office hours: Monday–Friday, 7:30am – 4:30pm. Admissions enquiries are welcome throughout
              the term.
            </p>
            <p className="mt-6 text-xs opacity-60">
              © {new Date().getFullYear()} {s.schoolName}. All rights reserved.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PortalCard({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: typeof GraduationCap;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="surface-card block p-6 transition hover:shadow-pop">
      <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <span className="mt-4 inline-block text-sm font-semibold text-primary">Sign in →</span>
    </Link>
  );
}
