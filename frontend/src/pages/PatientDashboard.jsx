// src/pages/PatientDashboard.jsx - COMPLETE UPDATED VERSION
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CreditCardIcon,
  ArrowRightOnRectangleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { appointmentsAPI, billingAPI } from '../services/api';
import { toast } from 'react-toastify';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('PatientDashboard: Fetching data... User userId:', user?.userId, 'patientId:', user?.patientId);

        const userIdToUse = user?.patientId || user?.userId;

        if (!userIdToUse) {
          console.error('PatientDashboard: No valid user ID found for fetching data');
          // toast.error('User identity missing');
          setLoading(false);
          return;
        }

        // Fetch using Promise.allSettled to prevent one failure from crashing everything
        const [appointmentsRes, billingRes] = await Promise.allSettled([
          appointmentsAPI.getAll({ role: 'Patient' }),
          billingAPI.getAll({ role: 'Patient' })
        ]);

        if (appointmentsRes.status === 'fulfilled') {
          console.log('appointments fetched:', appointmentsRes.value.data.data ? appointmentsRes.value.data.data.length : 0);
          setAppointments(appointmentsRes.value.data.data || []);
        } else {
          console.error('Failed to fetch appointments:', appointmentsRes.reason);
        }

        if (billingRes.status === 'fulfilled') {
          console.log('bills fetched:', billingRes.value.data.data ? billingRes.value.data.data.length : 0);
          setBills(billingRes.value.data.data || []);
        } else {
          console.error('Failed to fetch bills:', billingRes.reason);
        }

      } catch (error) {
        console.error('PatientDashboard: Critical Error fetching dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Header and Logout now handled by DashboardLayout

  // Calculate statistics
  const upcomingAppointments = appointments.filter(
    apt => apt.status === 'Scheduled' || apt.status === 'Pending Payment'
  );

  const pendingAppointments = appointments.filter(
    apt => apt.status === 'Pending Payment'
  );

  const completedAppointments = appointments.filter(
    apt => apt.status === 'Completed'
  );

  const pendingBills = bills.filter(bill =>
    bill.payment_status === 'Pending' || bill.payment_status === 'Partially Paid'
  );

  const totalPendingAmount = pendingBills.reduce(
    (sum, bill) => sum + parseFloat(bill.total_amount || 0), 0
  );

  const paidBills = bills.filter(bill => bill.payment_status === 'Paid');

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">
            Welcome, {user?.firstName || user?.email}
          </h1>
          <p className="text-sm text-gray-600">Patient Dashboard</p>
        </div>
      </div>
      {/* Pending Bills Alert */}
      {pendingBills.length > 0 && (
        <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-amber-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-amber-800">
                You have {pendingBills.length} unpaid bill{pendingBills.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                Total pending: <strong>Ksh {totalPendingAmount.toFixed(2)}</strong>
              </p>
            </div>
            <button
              onClick={() => navigate('/billing')}
              className="ml-4 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 text-sm font-medium transition-colors"
            >
              Pay Now
            </button>
          </div>
        </div>
      )}

      {/* Pending Appointments Alert */}
      {pendingAppointments.length > 0 && (
        <div className="mb-6 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-lg animate-fade-in">
          <div className="flex items-center">
            <ExclamationCircleIcon className="h-6 w-6 text-orange-600 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                You have {pendingAppointments.length} appointment(s) pending payment
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Your appointment is reserved but not confirmed until payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="stat-card bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Upcoming</p>
              <p className="text-3xl font-bold text-primary-600">
                {upcomingAppointments.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Appointments</p>
            </div>
            <div className="bg-primary-100 p-3 rounded-full">
              <CalendarIcon className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-secondary-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bills</p>
              <p className="text-3xl font-bold text-secondary-600">{bills.length}</p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="bg-secondary-100 p-3 rounded-full">
              <DocumentTextIcon className="h-8 w-8 text-secondary-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Paid Bills</p>
              <p className="text-3xl font-bold text-green-600">{paidBills.length}</p>
              <p className="text-xs text-gray-500 mt-1">Completed</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Pending</p>
              <p className="text-3xl font-bold text-red-600">
                Ksh {totalPendingAmount.toFixed(0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">To pay</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <CreditCardIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <button
          onClick={() => navigate('/book-appointment')}
          className="card-hover text-left group"
        >
          <div className="bg-primary-100 p-3 rounded-full w-fit mb-3 group-hover:bg-primary-200 transition-colors">
            <CalendarIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Book Appointment</h3>
          <p className="text-sm text-gray-600">Schedule with a doctor</p>
        </button>

        <button
          onClick={() => navigate('/medical-records')}
          className="card-hover text-left group"
        >
          <div className="bg-secondary-100 p-3 rounded-full w-fit mb-3 group-hover:bg-secondary-200 transition-colors">
            <DocumentTextIcon className="h-8 w-8 text-secondary-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Medical Records</h3>
          <p className="text-sm text-gray-600">View your history</p>
        </button>

        <button
          onClick={() => navigate('/prescriptions')}
          className="card-hover text-left group"
        >
          <div className="bg-accent-100 p-3 rounded-full w-fit mb-3 group-hover:bg-accent-200 transition-colors">
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-accent-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Prescriptions</h3>
          <p className="text-sm text-gray-600">View prescriptions</p>
        </button>

        <button
          onClick={() => navigate('/billing')}
          className="card-hover text-left group relative"
        >
          <div className="bg-green-100 p-3 rounded-full w-fit mb-3 group-hover:bg-green-200 transition-colors">
            <CreditCardIcon className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Billing & Payments</h3>
          <p className="text-sm text-gray-600">View bills & pay</p>
          {pendingBills.length > 0 && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
              {pendingBills.length}
            </span>
          )}
        </button>
      </div>

      {/* Unpaid Bills Section */}
      {pendingBills.length > 0 && (
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
              Unpaid Bills ({pendingBills.length})
            </h2>
            <button
              onClick={() => navigate('/billing')}
              className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {pendingBills.slice(0, 3).map((bill) => (
              <div
                key={bill.bill_id}
                className="flex items-center justify-between p-4 bg-red-50 border-l-4 border-red-500 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">Bill #{bill.bill_id}</h3>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                      {bill.payment_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Dr. {bill.doctor_first_name} {bill.doctor_last_name} •
                    {' '}{new Date(bill.bill_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-red-600">Ksh {parseFloat(bill.total_amount).toFixed(2)}</p>
                  <button
                    onClick={() => navigate('/billing')}
                    className="mt-2 text-sm bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Appointments */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Appointments
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="spinner mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No appointments found
            </h3>
            <p className="text-gray-600 mb-6">
              Book your first appointment to get started with your healthcare journey
            </p>
            <button
              onClick={() => navigate('/book-appointment')}
              className="btn-primary"
            >
              <CalendarIcon className="h-5 w-5 inline mr-2" />
              Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment.appointment_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {appointment.appointment_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {appointment.specialization}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                        appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {appointment.reason_for_visit}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {appointments.length > 0 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/book-appointment')}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
          >
            Book Another Appointment →
          </button>
        </div>
      )}
    </div>
  );
};
export default PatientDashboard;
