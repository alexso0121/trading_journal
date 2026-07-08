import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';

export const AppShell = () => {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.08),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.08),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
      <header className="border-b border-white/10 bg-slate-950/95 text-white backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Trading Journal
            </div>
            <nav className="flex gap-2">
              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition ${isActive ? 'bg-cyan-300 text-slate-950' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
                }
              >
                Calendar
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition ${isActive ? 'bg-cyan-300 text-slate-950' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
                }
              >
                Analytics
              </NavLink>
              <NavLink
                to="/strategies"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition ${isActive ? 'bg-cyan-300 text-slate-950' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
                }
              >
                Strategies
              </NavLink>
              <NavLink
                to="/trades"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition ${isActive ? 'bg-cyan-300 text-slate-950' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
                }
              >
                Trades
              </NavLink>
              <NavLink
                to="/audit-trail"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition ${isActive ? 'bg-cyan-300 text-slate-950' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
                }
              >
                Audit Trail
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm transition ${isActive ? 'bg-cyan-300 text-slate-950' : 'text-white/75 hover:bg-white/10 hover:text-white'}`
                }
              >
                Settings
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-white/60 md:inline">
              {user?.email ?? user?.uid}
            </span>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-white transition hover:bg-white/15"
              onClick={() => {
                void signOut();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};
