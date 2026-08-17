import { LandingHeader } from "@/components/landing/header";
import { LandingFooter } from "@/components/landing/footer";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <LandingHeader user={null} />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  );
}
