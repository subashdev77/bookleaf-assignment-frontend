"use client";

import { useForm } from "react-hook-form";
import { passwordRules } from "@/components/auth/SetPasswordForm";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button, Card, CardHeader, Field, Input, PageHeader } from "@/components/ui";
import { api, errorMessage, fieldErrors } from "@/lib/api";

interface ProfileValues {
  name: string;
  phone: string;
}

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirm: string;
}

export function AccountSettings() {
  const { user, setUser } = useAuth();
  const notify = useToast();

  const profile = useForm<ProfileValues>({ defaultValues: { name: user?.name ?? "", phone: user?.phone ?? "" } });
  const password = useForm<PasswordValues>();

  const saveProfile = async (values: ProfileValues) => {
    try {
      const res = await api.patch("/auth/me", { name: values.name.trim(), phone: values.phone.trim() || null });
      setUser(res.data.data.user);
      notify("Profile updated.");
    } catch (err) {
      const fields = fieldErrors(err);
      (["name", "phone"] as const).forEach((f) => fields[f] && profile.setError(f, { message: fields[f] }));
      if (!Object.keys(fields).length) notify(errorMessage(err), "error");
    }
  };

  const changePassword = async (values: PasswordValues) => {
    try {
      await api.post("/auth/change-password", { currentPassword: values.currentPassword, newPassword: values.newPassword });
      password.reset();
      notify("Password changed. You've been signed out on other devices.");
    } catch (err) {
      const fields = fieldErrors(err);
      (["currentPassword", "newPassword"] as const).forEach((f) => fields[f] && password.setError(f, { message: fields[f] }));
      if (!Object.keys(fields).length) notify(errorMessage(err), "error");
    }
  };

  return (
    <>
      <PageHeader title="Account settings" description="Manage your profile and password." />
      <div className="grid max-w-4xl grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Profile" />
          <form onSubmit={profile.handleSubmit(saveProfile)} noValidate className="space-y-4 p-5">
            <Field label="Email" htmlFor="acc-email" hint="Contact BookLeaf support to change the email you sign in with.">
              <Input id="acc-email" value={user?.email ?? ""} readOnly disabled />
            </Field>
            <Field label="Role" htmlFor="acc-role">
              <Input id="acc-role" value={user?.role === "admin" ? "BookLeaf team (admin)" : "Author"} readOnly disabled />
            </Field>
            <Field label="Full name" htmlFor="acc-name" error={profile.formState.errors.name?.message}>
              <Input
                id="acc-name"
                invalid={!!profile.formState.errors.name}
                {...profile.register("name", { required: "Full name is required", validate: (v) => v.trim().length >= 2 || "Full name must be at least 2 characters" })}
              />
            </Field>
            <Field label="Phone number" htmlFor="acc-phone" error={profile.formState.errors.phone?.message}>
              <Input
                id="acc-phone"
                type="tel"
                invalid={!!profile.formState.errors.phone}
                {...profile.register("phone", { pattern: { value: /^[+()\-\s\d]*$/, message: "Enter a valid phone number" } })}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={profile.formState.isSubmitting}>
                Save profile
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeader title="Change password" description="Other devices will be signed out." />
          <form onSubmit={password.handleSubmit(changePassword)} noValidate className="space-y-4 p-5">
            <Field label="Current password" htmlFor="acc-current" error={password.formState.errors.currentPassword?.message}>
              <Input
                id="acc-current"
                type="password"
                autoComplete="current-password"
                invalid={!!password.formState.errors.currentPassword}
                {...password.register("currentPassword", { required: "Current password is required" })}
              />
            </Field>
            <Field label="New password" htmlFor="acc-new" error={password.formState.errors.newPassword?.message} hint="At least 8 characters, with a letter and a number.">
              <Input id="acc-new" type="password" autoComplete="new-password" invalid={!!password.formState.errors.newPassword} {...password.register("newPassword", passwordRules)} />
            </Field>
            <Field label="Confirm new password" htmlFor="acc-confirm" error={password.formState.errors.confirm?.message}>
              <Input
                id="acc-confirm"
                type="password"
                autoComplete="new-password"
                invalid={!!password.formState.errors.confirm}
                {...password.register("confirm", {
                  required: "Please confirm your new password",
                  validate: (v) => v === password.getValues("newPassword") || "Passwords don't match",
                })}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" loading={password.formState.isSubmitting}>
                Change password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
