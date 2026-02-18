import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PharmacistDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState([]); // In real app, fetch from API

    // Mock data for UI development
    const mockPrescriptions = [
        { id: 1, patient: "Jane Doe", medicine: "Amoxicillin", dosage: "500mg", status: "Pending" },
        { id: 2, patient: "John Smith", medicine: "Paracetamol", dosage: "500mg", status: "Dispensed" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-teal-800 text-white flex flex-col">
                <div className="p-6 text-2xl font-bold bg-teal-900 text-center">
                    🏥 HMS Pharmacy
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-teal-700 rounded-lg">
                        <span>💊 Prescriptions</span>
                    </a>
                    <a href="#" className="flex items-center space-x-3 px-4 py-3 hover:bg-teal-700 rounded-lg transition">
                        <span>📦 Inventory</span>
                    </a>
                </nav>
                <div className="p-4 bg-teal-900">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-lg font-bold">
                            {user?.firstName?.charAt(0)}
                        </div>
                        <div>
                            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                            <p className="text-xs text-teal-300">Pharmacist</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full py-2 bg-red-600 hover:bg-red-700 rounded text-center text-sm font-medium transition"
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Pharmacy Dashboard</h1>
                    <div className="text-gray-500">
                        {new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Pending Prescriptions</h3>
                        <p className="text-3xl font-bold text-orange-600 mt-2">12</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Dispensed Today</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">45</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Low Stock Items</h3>
                        <p className="text-3xl font-bold text-red-600 mt-2">3</p>
                    </div>
                </div>

                {/* Prescriptions Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-800">Recent Prescriptions</h2>
                        <input
                            type="text"
                            placeholder="Search patient..."
                            className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-3 font-medium">Patient</th>
                                <th className="px-6 py-3 font-medium">Medication</th>
                                <th className="px-6 py-3 font-medium">Dosage</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {mockPrescriptions.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900">{p.patient}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.medicine}</td>
                                    <td className="px-6 py-4 text-gray-600">{p.dosage}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${p.status === 'Pending' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-teal-600 hover:text-teal-800 font-medium text-sm">
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
};

export default PharmacistDashboard;
