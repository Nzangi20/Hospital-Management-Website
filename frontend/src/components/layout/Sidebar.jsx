import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { navigation } from '../../utils/navigation';
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const role = user?.role || 'Patient';
    const links = navigation[role] || [];

    return (
        <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen">
            <div className="flex items-center justify-center h-16 border-b border-gray-200">
                <span className="text-xl font-bold text-primary-600">MedTouch HMS</span>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {links.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`
                            }
                        >
                            <item.icon
                                className="mr-3 h-6 w-6 flex-shrink-0"
                                aria-hidden="true"
                            />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center mb-4">
                    <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                            {user?.firstName?.charAt(0) || 'U'}
                        </div>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500">{role}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                >
                    <ArrowRightOnRectangleIcon className="mr-2 h-4 w-4" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
