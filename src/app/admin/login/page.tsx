import PasswordGate from "@/components/PasswordGate";

export default function AdminLoginPage() {
  return (
    <PasswordGate
      endpoint="/api/auth/admin-login"
      redirectTo="/admin"
      title="Admin"
      subtitle="Owner access — manage booking requests."
      accent="slate"
    />
  );
}
