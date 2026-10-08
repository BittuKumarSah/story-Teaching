import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChildren } from '../contexts/ChildContext';
import { Menu, X, User, BookOpen, BarChart2, LogOut, ChevronDown, Users } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../utils/helpers';

export default function Layout() {
const { user, logout } = useAuth();
const { selectedChild } = useChildren();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: BookOpen },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart2 },
    { path: '/history', label: 'History', icon: BookOpen },
    { path: '/children', label: 'Children', icon: Users },
  ];

  if (user?.role === 'teacher') {
    navItems.push({ path: '/teacher', label: 'Classroom', icon: User });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2" aria-label="StoryTeacher Home">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-display text-xl font-bold text-gray-900 hidden sm:block">StoryTeacher</span>
              </Link>
              
              <div className="hidden md:flex md:gap-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || 
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {selectedChild && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium">
                  <Users className="w-4 h-4" />
                  <span>{selectedChild.name}, {selectedChild.age}</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg border border-gray-200 py-1 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                    <Link
                      to="/children"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
<Users className="w-4 h-4" />
                      Manage Children
                    </Link>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 animate-slide-up">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
                <hr className="my-2" />
                <Link
                  to="/children"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-100"
                >
                  <Users className="w-5 h-5" />
                  Manage Children
                </Link>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-gray-100"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-gray-500">
          <p>StoryTeacher - Making learning an adventure through stories</p>
        </div>
      </footer>
    </div>
  );
}