import { TVButton, TVCard, TVInput } from '@/components/trainovations';

export function ChangePasswordForm({
  action,
}: {
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <TVCard className="w-full max-w-md space-y-6 p-8">
      <div className="space-y-2">
        <p className="text-label uppercase tracking-[0.2em] text-primary">
          Trainovations CRM
        </p>
        <h1 className="text-section text-foreground">Change your password</h1>
        <p className="text-body text-muted-foreground">
          Your account was invited with a temporary password. Set a new password to continue.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <div className="space-y-2">
          <label className="text-label text-foreground" htmlFor="password">
            New password
          </label>
          <TVInput id="password" name="password" type="password" autoComplete="new-password" />
        </div>

        <div className="space-y-2">
          <label className="text-label text-foreground" htmlFor="confirmPassword">
            Confirm password
          </label>
          <TVInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
          />
        </div>

        <TVButton className="w-full" size="lg" type="submit">
          Save new password
        </TVButton>
      </form>
    </TVCard>
  );
}
