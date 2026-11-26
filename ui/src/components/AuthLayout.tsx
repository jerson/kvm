import { useLocation, useNavigation, useSearchParams } from "react-router";

import { Button, LinkButton } from "@components/Button";
import { GoogleIcon } from "@components/Icons";
import SimpleNavbar from "@components/SimpleNavbar";
import Container from "@components/Container";
import Fieldset from "@components/Fieldset";
import GridBackground from "@components/GridBackground";
import StepCounter from "@components/StepCounter";
import { CLOUD_API } from "@/ui.config";
import { OIDCSignIn, useAuthProviders } from "@components/OIDCSignIn";

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
  const { config, error, retry } = useAuthProviders();
  const showGoogle = config?.providers.includes("google");

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
                  {!config && !error ? (
                    <p role="status" className="text-sm text-slate-500">
                      Loading sign-in options…
                    </p>
                  ) : null}
                  {error ? (
                    <div role="alert" className="space-y-2 text-sm text-red-600 dark:text-red-400">
                      <p>Could not load sign-in options.</p>
                      <Button
                        type="button"
                        theme="light"
                        size="SM"
                        text="Try again"
                        onClick={retry}
                        data-testid="auth-providers-retry"
                      />
                    </div>
                  ) : null}
                  <OIDCSignIn
                    providers={config?.oidc ?? []}
                    deviceId={deviceId}
                    returnTo={returnTo}
                    mode={mode}
                  />
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
                </div>
              </Fieldset>
            </div>
          </div>
        </Container>
      </div>
    </>
  );
}
