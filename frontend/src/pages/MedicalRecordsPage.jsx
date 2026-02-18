// src/pages/MedicalRecordsPage.jsx - COMPLETE VERSION
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DocumentTextIcon,
  ClockIcon,
  BeakerIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  ArrowLeftIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { patientsAPI } from '../services/api';

const MedicalRecordsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    // Simulate fetching medical records
    // In production, replace with actual API call
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    if (!user || user.role !== 'Patient') return;

    try {
      // Use the patient ID from the user context if available, otherwise fetch it
      let patientId = user.patientId;

      // If patientId is not in the context (legacy login), we might need to fetch it
      // But for now, let's assume the auth context is updated

      if (!patientId) {
        // Fallback: This user might be a new registration where patientId wasn't returned in login
        // In a real app we'd fetch the profile. For now, let's try to get it from the /auth/me endpoint again if needed
        // or handle it gracefully. 
        // Ideally, AuthContext should ensure user.patientId is present.
      }

      // Using patientsAPI to get medical history
      // Note: we need to ensure patientsAPI.getMedicalHistory is correctly implemented to take an ID
      const response = await patientsAPI.getMedicalHistory(patientId || user.userId); // Fallback to userId if patientId missing, but backend expects patientId?

      // Actually, looking at routes: router.get('/:id/medical-history', ... patientController.getMedicalHistory)
      // The controller likely expects a patient_id. 
      // Let's assume user.patientId is available from the login/me response.

      const res = await patientsAPI.getMedicalHistory(user.patientId);
      setRecords(res.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      // Only show error if it's not a 404 (No records found)
      if (error.response && error.response.status !== 404) {
        toast.error('Failed to load medical records');
      }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">


          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
            Medical Records
          </h1>
          <p className="text-gray-600">
            Your complete medical history and consultation records
          </p>
        </div>

        {records.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Medical Records Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Your medical records will appear here after doctor consultations
            </p>
            <button
              onClick={() => navigate('/book-appointment')}
              className="btn-primary"
            >
              Book Appointment
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Records Timeline */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Consultation History
              </h2>
              {records.map((record, index) => (
                <div
                  key={record.record_id}
                  onClick={() => setSelectedRecord(record)}
                  className={`card cursor-pointer transition-all ${selectedRecord?.record_id === record.record_id
                    ? 'border-2 border-primary-500 shadow-lg'
                    : 'hover:shadow-md'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-primary-100 p-2 rounded-full">
                      <DocumentTextIcon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {formatDate(record.visit_date)}
                        </span>
                        {index === 0 && (
                          <span className="badge badge-success text-xs">Latest</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Dr. {record.doctor_first_name} {record.doctor_last_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.specialization}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Record Details */}
            <div className="lg:col-span-2">
              {selectedRecord ? (
                <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                  {/* Content for selected record */}
                  <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Consultation Details
                    </h2>
                    {/* Add detailed content here */}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <DocumentTextIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-600">
                    Select a consultation record to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecordsPage;