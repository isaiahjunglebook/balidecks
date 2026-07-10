import PasswordGate from "@/components/PasswordGate";

export default function ClientLoginPage() {
  return (
    <PasswordGate
      endpoint="/api/auth/client-login"
      redirectTo="/"
      title="BaliDecks"
      subtitle="Private booking portal — enter your access password."
      accent="gold"
    />
  );
}
