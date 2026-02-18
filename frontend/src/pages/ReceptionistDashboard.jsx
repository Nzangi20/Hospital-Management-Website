import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { appointmentsAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  UserIcon,
  UserGroupIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const ReceptionistDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, pending, walkin

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentsAPI.getAll();
      setAppointments(res.data.data || []);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load appointments');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await appointmentsAPI.update(id, { status });
      toast.success(`Appointment marked as ${status}`);
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return apt.appointment_date.split('T')[0] === today;
    }
    if (filter === 'pending') {
      return apt.status === 'Pending Payment';
    }
    if (filter === 'walkin') {
      // Assuming user.id is the current receptionist's ID
      // And apt.created_by stores the ID of the user who created it
      return apt.created_by === user.userId;
    }
    return true;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage appointments and walk-ins</p>
          </div>
          <button
            onClick={() => navigate('/book-appointment')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center shadow-sm"
          >
            <UserGroupIcon className="w-5 h-5 mr-2" />
            New Walk-in Booking
          </button>
        </header>

        {/* Status Filters (Tabs) */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${filter === 'all'
              ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              All Appointments
            </div>
          </button>
          <button
            onClick={() => setFilter('today')}
            className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-colors ${filter === 'today'
              ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4" />
              Today's Schedule
            </div>
          </button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/book-appointment')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">New Booking</p>
                <p className="text-sm text-gray-500">Schedule walk-in appointment</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/billing')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Billing & Payments</p>
                <p className="text-sm text-gray-500">Process payments & view bills</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/doctors')}>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Doctors</p>
                <p className="text-sm text-gray-500">View availability</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Total Appointments</p>
            <p className="text-3xl font-bold text-indigo-600">{appointments.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm">Scheduled Today</p>
            <p className="text-3xl font-bold text-green-600">
              {appointments.filter(a => a.appointment_date.split('T')[0] === new Date().toISOString().split('T')[0]).length}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Doctor</th>
                <th className="px-6 py-3">Date & Time</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <CalendarIcon className="h-12 w-12 text-gray-300 mb-2" />
                      <p className="text-lg font-medium text-gray-900">No appointments found</p>
                      <p className="text-sm text-gray-500">
                        {filter === 'today'
                          ? "There are no appointments scheduled for today."
                          : filter === 'pending'
                            ? "There are no appointments pending payment."
                            : filter === 'walkin'
                              ? "You have not made any walk-in appointments."
                              : "There are no appointments in the system."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(apt => (
                  <tr key={apt.appointment_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{apt.patient_first_name} {apt.patient_last_name}</div>
                      <div className="text-xs text-gray-500">{apt.patient_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">Dr. {apt.doctor_first_name} {apt.doctor_last_name}</div>
                      <div className="text-xs text-gray-500">{apt.specialization}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{apt.appointment_time}</div>
                      <div className="text-xs text-gray-500">{new Date(apt.appointment_date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${apt.status === 'Scheduled' ? 'bg-green-100 text-green-800' :
                        apt.status === 'Pending Payment' ? 'bg-orange-100 text-orange-800' :
                          apt.status === 'Completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      {apt.status === 'Scheduled' && (
                        <button
                          onClick={() => handleStatusUpdate(apt.appointment_id, 'Waiting')}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                          Check In
                        </button>
                      )}
                      {apt.status === 'Pending Payment' && (
                        <button
                          onClick={() => handleStatusUpdate(apt.appointment_id, 'Scheduled')} // Manual override
                          className="text-green-600 hover:text-green-800 font-medium text-sm"
                          title="Mark as Paid (Cash)"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusUpdate(apt.appointment_id, 'Cancelled')}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
