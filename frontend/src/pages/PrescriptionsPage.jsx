// src/pages/PrescriptionsPage.jsx - WITH REAL DATABASE DATA
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { patientsAPI } from '../services/api';
import { toast } from 'react-toastify';

const PrescriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('date'); // 'date' or 'doctor'

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      if (!user) return;

      let patientId = user.patientId;

      // Fallback if patientId is missing in context
      if (!patientId) {
        // In a real scenario we might fetch profile here or rely on the backend to handle userId from token
        // For now, let's assume if it's not there, we can't fetch strictly by patientId unless the endpoint supports 'me'
        // But let's try to use the user.userId if the API is flexible, or just fail gracefully.
      }

      // Use the service
      const response = await patientsAPI.getPrescriptions(patientId || user.userId);
      setPrescriptions(response.data.data || []);

    } catch (error) {
      console.error('Failed to load prescriptions:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load prescriptions');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupPrescriptions = () => {
    if (prescriptions.length === 0) return [];

    if (groupBy === 'date') {
      const grouped = {};
      prescriptions.forEach(prescription => {
        const date = prescription.prescription_date.split('T')[0];
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(prescription);
      });
      return Object.entries(grouped).sort((a, b) => new Date(b[0]) - new Date(a[0]));
    } else {
      const grouped = {};
      prescriptions.forEach(prescription => {
        const doctor = `Dr. ${prescription.doctor_first_name} ${prescription.doctor_last_name}`;
        if (!grouped[doctor]) {
          grouped[doctor] = {
            prescriptions: [],
            specialization: prescription.specialization
          };
        }
        grouped[doctor].prescriptions.push(prescription);
      });
      return Object.entries(grouped);
    }
  };

  const isActivePrescription = (prescription) => {
    const prescDate = new Date(prescription.prescription_date);
    const durationMatch = prescription.duration.match(/(\d+)/);
    const durationDays = durationMatch ? parseInt(durationMatch[1]) : 0;
    const endDate = new Date(prescDate);
    endDate.setDate(endDate.getDate() + durationDays);
    return endDate > new Date();
  };

  const activePrescriptionsCount = prescriptions.filter(isActivePrescription).length;
  const uniqueDoctors = new Set(
    prescriptions.map(p => `${p.doctor_first_name} ${p.doctor_last_name}`)
  ).size;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  const groupedPrescriptions = groupPrescriptions();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">


          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                My Prescriptions
              </h1>
              <p className="text-gray-600">
                View all your prescribed medications
              </p>
            </div>

            {prescriptions.length > 0 && (
              <button className="btn-outline flex items-center gap-2">
                <DocumentArrowDownIcon className="h-5 w-5" />
                Download All
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        {prescriptions.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Prescriptions</p>
                  <p className="text-3xl font-bold text-primary-600">{prescriptions.length}</p>
                </div>
                <ClipboardDocumentListIcon className="h-10 w-10 text-primary-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Medications</p>
                  <p className="text-3xl font-bold text-green-600">
                    {activePrescriptionsCount}
                  </p>
                </div>
                <ClockIcon className="h-10 w-10 text-green-400" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Doctors</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {uniqueDoctors}
                  </p>
                </div>
                <UserIcon className="h-10 w-10 text-blue-400" />
              </div>
            </div>
          </div>
        )}

        {/* Group By Toggle */}
        {prescriptions.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Group by:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setGroupBy('date')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${groupBy === 'date'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <CalendarIcon className="h-4 w-4 inline mr-2" />
                  Date
                </button>
                <button
                  onClick={() => setGroupBy('doctor')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${groupBy === 'doctor'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <UserIcon className="h-4 w-4 inline mr-2" />
                  Doctor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Prescriptions List */}
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ClipboardDocumentListIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Prescriptions Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Your prescriptions will appear here after doctor consultations when doctors prescribe medications for you.
            </p>
            <button
              onClick={() => navigate('/book-appointment')}
              className="btn-primary"
            >
              Book Appointment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedPrescriptions.map(([groupKey, groupData]) => {
              const groupPrescriptions = groupBy === 'doctor' ? groupData.prescriptions : groupData;
              const specialization = groupBy === 'doctor' ? groupData.specialization : '';

              return (
                <div key={groupKey} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                    {groupBy === 'date' ? (
                      <>
                        <CalendarIcon className="h-6 w-6 text-primary-600" />
                        <h3 className="text-xl font-semibold text-gray-900">
                          {formatDate(groupKey)}
                        </h3>
                      </>
                    ) : (
                      <>
                        <UserIcon className="h-6 w-6 text-primary-600" />
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{groupKey}</h3>
                          <p className="text-sm text-gray-600">{specialization}</p>
                        </div>
                      </>
                    )}
                    <span className="ml-auto bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
                      {groupPrescriptions.length} prescription{groupPrescriptions.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {groupPrescriptions.map((prescription) => {
                      const isActive = isActivePrescription(prescription);

                      return (
                        <div
                          key={prescription.prescription_id}
                          className={`border rounded-lg p-4 ${isActive
                            ? 'bg-green-50 border-green-200'
                            : 'bg-gray-50 border-gray-200'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  {prescription.medication_name}
                                </h4>
                                {isActive && (
                                  <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                    Active
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700">
                                <strong>Dosage:</strong> {prescription.dosage}
                              </p>
                            </div>
                            <span className="bg-white border border-gray-300 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
                              {prescription.duration}
                            </span>
                          </div>

                          <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                            <div>
                              <strong>Frequency:</strong> {prescription.frequency}
                            </div>
                            {groupBy === 'doctor' && (
                              <div>
                                <strong>Date:</strong> {formatDate(prescription.prescription_date)}
                              </div>
                            )}
                            {groupBy === 'date' && (
                              <div>
                                <strong>Prescribed by:</strong> Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
                              </div>
                            )}
                          </div>

                          {prescription.instructions && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm text-gray-700">
                                <strong>Instructions:</strong> {prescription.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionsPage;
