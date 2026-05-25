import { useLocation, useNavigation, useSearchParams } from "react-router";

import { Button, LinkButton } from "@components/Button";
import { GoogleIcon, PocketBaseIcon } from "@components/Icons";
import SimpleNavbar from "@components/SimpleNavbar";
import Container from "@components/Container";
import Fieldset from "@components/Fieldset";
import GridBackground from "@components/GridBackground";
import StepCounter from "@components/StepCounter";
import InputField from "@components/InputField";
import { CLOUD_API, CLOUD_AUTH_PROVIDERS } from "@/ui.config";

interface AuthLayoutProps {
  title: string;
  description: string;
  cta: string;
  ctaHref: string;
  showCounter?: boolean;
  mode?: "login" | "signup";
}

export default function AuthLayout({
  title,
  description,
  cta,
  ctaHref,
  showCounter,
  mode = "login",
}: AuthLayoutProps) {
  const [sq] = useSearchParams();
  const location = useLocation();

  const returnTo = sq.get("returnTo") || location.state?.returnTo;
  const deviceId = sq.get("deviceId") || location.state?.deviceId;
  const navigation = useNavigation();
  const showGoogle = CLOUD_AUTH_PROVIDERS.includes("google");
  const showPocketBase = CLOUD_AUTH_PROVIDERS.includes("pocketbase");

  return (
    <>
      <GridBackground />

      <div className="grid min-h-screen grid-rows-(--grid-layout)">
        <SimpleNavbar
          logoHref="/"
          actionElement={
            <div>
              <LinkButton to={ctaHref} text={cta} theme="light" size="MD" />
            </div>
          }
        />
        <Container>
          <div className="isolate flex h-full w-full items-center justify-center">
            <div className="-mt-16 max-w-2xl space-y-8">
              {showCounter ? (
                <div className="text-center">
                  <StepCounter currStepIdx={0} nSteps={2} />
                </div>
              ) : null}
              <div className="space-y-2 text-center">
                <h1 className="text-4xl font-semibold text-black dark:text-white">{title}</h1>
                <p className="text-slate-600 dark:text-slate-400">{description}</p>
              </div>

              <Fieldset className="space-y-12">
                <div className="mx-auto max-w-sm space-y-4">
                  {showGoogle ? (
                    <form action={`${CLOUD_API}/oidc/google`} method="POST">
                      {deviceId ? <input type="hidden" name="deviceId" value={deviceId} /> : null}
                      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                      <Button
                        size="LG"
                        theme="light"
                        fullWidth
                        text={mode === "signup" ? "Continue with Google" : "Sign in with Google"}
                        LeadingIcon={GoogleIcon}
                        textAlign="center"
                        type="submit"
                        loading={
                          (navigation.state === "submitting" || navigation.state === "loading") &&
                          navigation.formMethod?.toLowerCase() === "post" &&
                          navigation.formAction?.includes("/oidc/google")
                        }
                      />
                    </form>
                  ) : null}

                  {showGoogle && showPocketBase ? (
                    <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                      <span>or</span>
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    </div>
                  ) : null}

                  {showPocketBase ? (
                    <form action={`${CLOUD_API}/auth/pocketbase`} method="POST" className="space-y-4">
                      {deviceId ? <input type="hidden" name="deviceId" value={deviceId} /> : null}
                      {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
                      <InputField
                        size="LG"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Email"
                        required
                      />
                      <InputField
                        size="LG"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Password"
                        required
                      />
                      <Button
                        size="LG"
                        theme="light"
                        fullWidth
                        text="Sign in with PocketBase"
                        LeadingIcon={PocketBaseIcon}
                        textAlign="center"
                        type="submit"
                      />
                    </form>
                  ) : null}
                </div>
              </Fieldset>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
