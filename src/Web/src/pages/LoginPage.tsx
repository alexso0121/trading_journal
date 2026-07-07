import { useEffect, useState } from 'react';
import heroImage from '../assets/hero.png';
import { useAuth } from '../providers/AuthProvider';
import { useToast } from '../components/ToastProvider';

export const LoginPage = () => {
  const { signInWithGoogle } = useAuth();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(error, 'Login failed');
    setError(null);
  }, [error, toast]);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.22),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_48%,_#111827_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-25" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/6 p-8 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-md sm:p-10 lg:min-h-[720px] lg:p-12">
            <div className="absolute inset-0">
              <img
                src={heroImage}
                alt="Decorative trading journal illustration"
                className="absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 object-cover opacity-35 saturate-150 mix-blend-screen"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.22)_0%,rgba(2,6,23,0.74)_62%,rgba(2,6,23,0.92)_100%)]" />
              <div className="absolute -left-20 top-16 h-56 w-56 rounded-full bg-violet-500/30 blur-3xl" />
              <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
            </div>

            <div className="relative flex h-full flex-col justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white/75">
                  Trading Journal
                </div>

                <h1 className="mt-8 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Keep your trading notes, ideas, and results in one place.
                </h1>

                <p className="mt-5 max-w-lg text-base leading-7 text-white/78 sm:text-lg">
                  A simple workspace for reviewing performance, writing quick reflections, and
                  saving the details that matter after each session.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-white">Review your progress</p>
                    <p className="mt-1 text-sm leading-6 text-white/68">
                      Look back at trades by day, week, or month without extra effort.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-white">Capture the context</p>
                    <p className="mt-1 text-sm leading-6 text-white/68">
                      Keep short notes, screenshots, and strategy ideas together.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                  <div className="text-2xl font-semibold text-white">1</div>
                  <div className="mt-1 text-sm text-white/70">Login fast</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                  <div className="text-2xl font-semibold text-white">2</div>
                  <div className="mt-1 text-sm text-white/70">Review daily</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur-sm">
                  <div className="text-2xl font-semibold text-white">3</div>
                  <div className="mt-1 text-sm text-white/70">Improve steadily</div>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl border border-slate-200/70 bg-white p-8 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:p-10">
              <div className="text-center">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Continue with Google to access your journal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  void onSubmit();
                }}
                disabled={submitting}
                className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-slate-900 shadow-sm">
                      G
                    </span>
                    Continue with Google
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-slate-500">
                Your Firebase UID must map to a backend GUID.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
