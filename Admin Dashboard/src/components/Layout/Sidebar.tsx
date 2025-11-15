import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Car,
  Users,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Live Map', path: '/map', icon: <Map size={20} /> },
  { name: 'Rides', path: '/rides', icon: <Car size={20} /> },
  { name: 'Users & Pullers', path: '/users', icon: <Users size={20} /> },
  { name: 'Reviews', path: '/reviews', icon: <AlertCircle size={20} /> },
  { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
  { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
];

export const Sidebar: React.FC = () => {
  const { logout, admin } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">AERAS</h1>
        <p className="text-sm text-gray-400">Admin Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold">
            {admin?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{admin?.name || 'Admin User'}</p>
            <p className="text-xs text-gray-400 truncate">{admin?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
};

