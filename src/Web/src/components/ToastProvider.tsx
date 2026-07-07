import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastTone = 'info' | 'success' | 'warning' | 'error';

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastEntry = {
  id: string;
  title?: string;
  message: string;
  tone: ToastTone;
  actions?: ToastAction[];
};

type ToastConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ToastContextValue = {
  show: (options: {
    title?: string;
    message: string;
    tone?: ToastTone;
    actions?: ToastAction[];
    persist?: boolean;
  }) => string;
  info: (message: string, title?: string) => string;
  success: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  confirm: (options: ToastConfirmOptions) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, { ring: string; accent: string; badge: string }> = {
  info: {
    ring: 'border-cyan-300/80',
    accent: 'bg-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700',
  },
  success: {
    ring: 'border-emerald-300/80',
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700',
  },
  warning: {
    ring: 'border-amber-300/80',
    accent: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700',
  },
  error: {
    ring: 'border-rose-300/80',
    accent: 'bg-rose-500',
    badge: 'bg-rose-50 text-rose-700',
  },
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timersRef = useRef(new Map<string, number>());
  const confirmResolversRef = useRef(new Map<string, (value: boolean) => void>());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));

    const resolver = confirmResolversRef.current.get(id);
    if (resolver) {
      confirmResolversRef.current.delete(id);
      resolver(false);
    }
  }, []);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
      timersRef.current.clear();
      confirmResolversRef.current.clear();
    },
    []
  );

  const show = useCallback(
    ({
      title,
      message,
      tone = 'info',
      actions,
      persist = false,
    }: {
      title?: string;
      message: string;
      tone?: ToastTone;
      actions?: ToastAction[];
      persist?: boolean;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((current) => [...current, { id, title, message, tone, actions }]);

      if (!persist) {
        const timer = window.setTimeout(() => {
          dismiss(id);
        }, 4500);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const confirm = useCallback(
    ({ title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel' }: ToastConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

        confirmResolversRef.current.set(id, resolve);
        setToasts((current) => [
          ...current,
          {
            id,
            title,
            message,
            tone: 'warning',
            actions: [
              {
                label: confirmLabel,
                onClick: () => {
                  confirmResolversRef.current.delete(id);
                  dismiss(id);
                  resolve(true);
                },
              },
              {
                label: cancelLabel,
                onClick: () => {
                  dismiss(id);
                },
              },
            ],
          },
        ]);
      }),
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      info: (message, title = 'Info') => show({ message, title, tone: 'info' }),
      success: (message, title = 'Success') => show({ message, title, tone: 'success' }),
      warning: (message, title = 'Warning') => show({ message, title, tone: 'warning' }),
      error: (message, title = 'Something went wrong') => show({ message, title, tone: 'error' }),
      confirm,
    }),
    [confirm, show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-end px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => {
            const classes = toneClasses[toast.tone];
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto overflow-hidden rounded-2xl border bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.22)] backdrop-blur ${classes.ring}`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${classes.accent}`} />
                  <div className="min-w-0 flex-1">
                    {toast.title ? (
                      <div
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${classes.badge}`}
                      >
                        {toast.title}
                      </div>
                    ) : null}
                    <p className="mt-1 text-sm leading-6 text-slate-700">{toast.message}</p>

                    {toast.actions ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {toast.actions.map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                              action.label === 'Cancel'
                                ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                : 'bg-slate-950 text-white hover:bg-slate-800'
                            }`}
                            onClick={action.onClick}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="rounded-full px-2 py-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    onClick={() => dismiss(toast.id)}
                    aria-label="Dismiss notification"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
};
