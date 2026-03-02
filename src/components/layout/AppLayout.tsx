import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, BookOpen, Calculator, PlayCircle, Settings, PenTool } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AppLayout: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">

            {/* SIDEBAR */}
            <aside className="w-20 md:w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between hidden sm:flex shrink-0 z-20 shadow-sm transition-colors duration-200">
                <div>
                    {/* Logo Area */}
                    <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xl shrink-0">
                            IM
                        </div>
                        <span className="ml-3 font-semibold text-lg hidden md:block tracking-tight">
                            IncoMaster
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <nav className="p-3 space-y-2 mt-4">
                        <NavItem to="/" icon={<Home size={20} />} label={t('nav.dashboard')} exact />
                        <NavItem to="/course" icon={<BookOpen size={20} />} label={t('nav.course')} />
                        <NavItem to="/calculator" icon={<Calculator size={20} />} label={t('nav.calculator')} />
                        <NavItem to="/practice" icon={<PenTool size={20} />} label={t('nav.practice')} />
                        <NavItem to="/quiz" icon={<PlayCircle size={20} />} label={t('nav.quiz')} />
                    </nav>
                </div>

                {/* Bottom Actions */}
                <div className="p-3 mb-4">
                    <NavItem to="/settings" icon={<Settings size={20} />} label={t('nav.settings')} />
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV (visible only on small screens) */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-around p-3 z-50 pb-safe transition-colors duration-200">
                <MobileNavItem to="/" icon={<Home size={22} />} label={t('nav.dashboard')} exact />
                <MobileNavItem to="/course" icon={<BookOpen size={22} />} label={t('nav.course')} />
                <MobileNavItem to="/calculator" icon={<Calculator size={22} />} label={t('nav.calculator')} />
                <MobileNavItem to="/practice" icon={<PenTool size={22} />} label={t('nav.practice')} />
                <MobileNavItem to="/quiz" icon={<PlayCircle size={22} />} label={t('nav.quiz')} />
            </nav>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden">
                <div className="w-full h-full pb-20 sm:pb-0">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

// --- Composants Locaux ---

const NavItem = ({ to, icon, label, exact = false }: { to: string, icon: React.ReactNode, label: string, exact?: boolean }) => {
    const location = useLocation();
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

    return (
        <NavLink
            to={to}
            end={exact}
            aria-current={isActive ? 'page' : undefined}
            className={() =>
                `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`
            }
        >
            <div className="flex items-center justify-center w-6 h-6 shrink-0">
                {icon}
            </div>
            <span className="ml-3 hidden md:block truncate">{label}</span>
        </NavLink>
    );
};

const MobileNavItem = ({ to, icon, label, exact = false }: { to: string, icon: React.ReactNode, label: string, exact?: boolean }) => {
    const location = useLocation();
    const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

    return (
        <NavLink
            to={to}
            end={exact}
            aria-current={isActive ? 'page' : undefined}
            className={() =>
                `flex flex-col items-center justify-center w-16 transition-colors ${isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
            }
        >
            <div className="mb-1">{icon}</div>
            <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
    );
};
