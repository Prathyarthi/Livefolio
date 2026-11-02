import { AuthAwareCtas } from "@/features/landing/components/auth-aware-ctas";

export function RecruiterCTA() {
  return (
    <section className="border-t border-border-default px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1120px] text-center">
        <h2 className="bg-gradient-to-b from-text-primary to-text-secondary bg-clip-text text-balance text-4xl font-semibold tracking-tight text-transparent md:text-6xl">
          Hire on proof. Starting today.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-body text-text-secondary">
          Your first open job is free.
        </p>
        <AuthAwareCtas
          variant="recruiter"
          size="default"
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        />
      </div>
    </section>
  );
}
