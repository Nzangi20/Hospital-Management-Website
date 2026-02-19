// src/pages/DoctorDashboard.jsx - WITH PRESCRIPTION FEATURE
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ArrowRightOnRectangleIcon,
  BeakerIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { appointmentsAPI, billingAPI } from '../services/api';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Billing, 2: Prescriptions

  const [billingData, setBillingData] = useState({
    consultationFee: 80,
    labCharges: 0,
    medicationCharges: 0,
    otherCharges: 0,
    taxAmount: 0,
    discount: 0
  });

  const [prescriptions, setPrescriptions] = useState([{
    id: 1,
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  }]);

  const [medicalRecordData, setMedicalRecordData] = useState({
    diagnosis: '',
    symptoms: '',
    treatment: '',
    vitalSigns: {
      temperature: '',
      bp: '',
      pulse: '',
      weight: ''
    },
    labResults: '',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await appointmentsAPI.getAll();
      setAppointments(response.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setCurrentStep(1);
    setBillingData({
      consultationFee: appointment.consultation_fee || 80,
      labCharges: 0,
      medicationCharges: 0,
      otherCharges: 0,
      taxAmount: 0,
      discount: 0
    });
    setPrescriptions([{
      id: 1,
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
    setMedicalRecordData({
      diagnosis: '',
      symptoms: appointment.symptoms || '',
      treatment: '',
      vitalSigns: {
        temperature: '',
        bp: '',
        pulse: '',
        weight: ''
      },
      labResults: '',
      notes: ''
    });
    setShowBillingModal(true);
  };

  const calculateTotal = () => {
    const { consultationFee, labCharges, medicationCharges, otherCharges, taxAmount, discount } = billingData;
    const subtotal = Number(consultationFee) + Number(labCharges) + Number(medicationCharges) + Number(otherCharges);
    return subtotal + Number(taxAmount) - Number(discount);
  };

  const handleProceedToPrescription = () => {
    if (!medicalRecordData.diagnosis || !medicalRecordData.treatment) {
      toast.error('Please fill diagnosis and treatment');
      return;
    }
    setCurrentStep(2);
  };

  const handleAddPrescription = () => {
    const newId = Math.max(...prescriptions.map(p => p.id), 0) + 1;
    setPrescriptions([...prescriptions, {
      id: newId,
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    }]);
  };

  const handleRemovePrescription = (id) => {
    if (prescriptions.length > 1) {
      setPrescriptions(prescriptions.filter(p => p.id !== id));
    }
  };

  const updatePrescription = (id, field, value) => {
    setPrescriptions(prescriptions.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  const handleCompleteAll = async () => {
    try {
      const token = localStorage.getItem('token');

      // Step 1: Create Medical Record
      const medicalRecordPayload = {
        patientId: selectedAppointment.patient_id,
        appointmentId: selectedAppointment.appointment_id,
        diagnosis: medicalRecordData.diagnosis,
        symptoms: medicalRecordData.symptoms,
        treatment: medicalRecordData.treatment,
        vitalSigns: medicalRecordData.vitalSigns,
        labResults: medicalRecordData.labResults,
        notes: medicalRecordData.notes,
        followUpRequired: false
      };

      const medicalRecordResponse = await axios.post(
        `${API_BASE_URL}/medical-records`,
        medicalRecordPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const recordId = medicalRecordResponse.data.data.record_id;

      // Step 2: Add Prescriptions (only if filled)
      const validPrescriptions = prescriptions.filter(p =>
        p.medicationName && p.dosage && p.frequency && p.duration
      );

      if (validPrescriptions.length > 0) {
        const prescriptionPayload = {
          medications: validPrescriptions.map(p => ({
            medicationName: p.medicationName,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
            instructions: p.instructions
          }))
        };

        await axios.post(
          `${API_BASE_URL}/medical-records/${recordId}/prescriptions`,
          prescriptionPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      // Step 3: Create Bill
      const billPayload = {
        patientId: selectedAppointment.patient_id,
        appointmentId: selectedAppointment.appointment_id,
        doctorId: selectedAppointment.doctor_id,
        consultationFee: Number(billingData.consultationFee),
        labCharges: Number(billingData.labCharges),
        medicationCharges: Number(billingData.medicationCharges),
        roomCharges: 0,
        otherCharges: Number(billingData.otherCharges),
        taxAmount: Number(billingData.taxAmount),
        discount: Number(billingData.discount)
      };

      await billingAPI.create(billPayload);

      // Step 4: Mark appointment as completed
      await appointmentsAPI.update(selectedAppointment.appointment_id, {
        status: 'Completed',
        notes: 'Consultation completed with medical record and prescriptions'
      });

      toast.success('Consultation completed successfully!');
      setShowBillingModal(false);
      setCurrentStep(1);
      fetchAppointments();
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast.error('Failed to complete consultation: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.appointment_date.split('T')[0] === today;
  });

  const scheduledAppointments = appointments.filter(apt => apt.status === 'Scheduled');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                Dr. {user?.firstName || user?.email}
              </h1>
              <p className="text-sm text-gray-600">Doctor Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-3xl font-bold text-primary-600">
                  {todayAppointments.length}
                </p>
              </div>
              <CalendarIcon className="h-10 w-10 text-primary-600 opacity-50" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Scheduled</p>
                <p className="text-3xl font-bold text-blue-600">
                  {scheduledAppointments.length}
                </p>
              </div>
              <ClockIcon className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-green-600">
                  {appointments.length}
                </p>
              </div>
              <UserIcon className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Appointments
          </h2>

          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="text-gray-600">No appointments scheduled</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symptoms</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment.appointment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(appointment.appointment_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.appointment_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {appointment.patient_first_name} {appointment.patient_last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.patient_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {appointment.reason_for_visit}
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate" title={appointment.symptoms}>
                          {appointment.symptoms || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${appointment.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.status === 'Scheduled' && (
                          <button
                            onClick={() => handleCompleteAppointment(appointment)}
                            className="text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Complete
                          </button>
                        )}
                        {appointment.status === 'Completed' && (
                          <span className="text-green-600 flex items-center gap-1">
                            <CheckCircleIcon className="h-5 w-5" />
                            Done
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Consultation Modal */}
      {showBillingModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-4xl w-full my-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                  1
                </div>
                <span className="ml-3 font-medium text-gray-900">Medical Record & Billing</span>
              </div>

              <div className={`w-24 h-1 mx-4 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>

              <div className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}>
                  2
                </div>
                <span className="ml-3 font-medium text-gray-900">Prescriptions</span>
              </div>
            </div>

            {currentStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <CurrencyDollarIcon className="h-8 w-8 text-primary-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Complete Consultation
                  </h2>
                </div>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Patient Information</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Name:</strong> {selectedAppointment.patient_first_name} {selectedAppointment.patient_last_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {new Date(selectedAppointment.appointment_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Reason:</strong> {selectedAppointment.reason_for_visit}
                  </p>
                  {selectedAppointment.symptoms && (
                    <p className="text-sm text-gray-600">
                      <strong>Symptoms:</strong> {selectedAppointment.symptoms}
                    </p>
                  )}
                </div>

                <div className="max-h-[60vh] overflow-y-auto space-y-4 mb-6">
                  {/* Medical Record Section */}
                  <div className="border-b border-gray-200 pb-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BeakerIcon className="h-5 w-5 text-primary-600" />
                      Medical Record
                    </h3>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Diagnosis *
                        </label>
                        <textarea
                          value={medicalRecordData.diagnosis}
                          onChange={(e) => setMedicalRecordData({ ...medicalRecordData, diagnosis: e.target.value })}
                          placeholder="Enter diagnosis..."
                          rows="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Treatment *
                        </label>
                        <textarea
                          value={medicalRecordData.treatment}
                          onChange={(e) => setMedicalRecordData({ ...medicalRecordData, treatment: e.target.value })}
                          placeholder="Enter treatment plan..."
                          rows="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      {/* Vital Signs */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperature (°F)
                        </label>
                        <input
                          type="text"
                          value={medicalRecordData.vitalSigns.temperature}
                          onChange={(e) => setMedicalRecordData({
                            ...medicalRecordData,
                            vitalSigns: { ...medicalRecordData.vitalSigns, temperature: e.target.value }
                          })}
                          placeholder="98.6"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Blood Pressure
                        </label>
                        <input
                          type="text"
                          value={medicalRecordData.vitalSigns.bp}
                          onChange={(e) => setMedicalRecordData({
                            ...medicalRecordData,
                            vitalSigns: { ...medicalRecordData.vitalSigns, bp: e.target.value }
                          })}
                          placeholder="120/80"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pulse (bpm)
                        </label>
                        <input
                          type="text"
                          value={medicalRecordData.vitalSigns.pulse}
                          onChange={(e) => setMedicalRecordData({
                            ...medicalRecordData,
                            vitalSigns: { ...medicalRecordData.vitalSigns, pulse: e.target.value }
                          })}
                          placeholder="72"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weight (lbs)
                        </label>
                        <input
                          type="text"
                          value={medicalRecordData.vitalSigns.weight}
                          onChange={(e) => setMedicalRecordData({
                            ...medicalRecordData,
                            vitalSigns: { ...medicalRecordData.vitalSigns, weight: e.target.value }
                          })}
                          placeholder="150"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          value={medicalRecordData.notes}
                          onChange={(e) => setMedicalRecordData({ ...medicalRecordData, notes: e.target.value })}
                          placeholder="Additional notes..."
                          rows="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Section */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Billing Details</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Consultation Fee (KES)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billingData.consultationFee}
                          onChange={(e) => setBillingData({ ...billingData, consultationFee: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Lab Charges (KES)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billingData.labCharges}
                          onChange={(e) => setBillingData({ ...billingData, labCharges: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medication Charges (KES)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billingData.medicationCharges}
                          onChange={(e) => setBillingData({ ...billingData, medicationCharges: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Other Charges (KES)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billingData.otherCharges}
                          onChange={(e) => setBillingData({ ...billingData, otherCharges: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tax (KES)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billingData.taxAmount}
                          onChange={(e) => setBillingData({ ...billingData, taxAmount: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discount (KES)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={billingData.discount}
                          onChange={(e) => setBillingData({ ...billingData, discount: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-3xl font-bold text-primary-600">
                          KES {calculateTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBillingModal(false);
                      setCurrentStep(1);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToPrescription}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Next: Add Prescriptions →
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <BeakerIcon className="h-8 w-8 text-primary-600" />
                  <h2 className="text-2xl font-bold text-gray-900">
                    Add Prescriptions
                  </h2>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  Add medications for the patient. You can skip this if no medications are needed.
                </p>

                <div className="max-h-[60vh] overflow-y-auto space-y-4 mb-6">
                  {prescriptions.map((prescription, index) => (
                    <div key={prescription.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">Medication {index + 1}</h4>
                        {prescriptions.length > 1 && (
                          <button
                            onClick={() => handleRemovePrescription(prescription.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Medication Name
                          </label>
                          <input
                            type="text"
                            value={prescription.medicationName}
                            onChange={(e) => updatePrescription(prescription.id, 'medicationName', e.target.value)}
                            placeholder="e.g., Paracetamol"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dosage
                          </label>
                          <input
                            type="text"
                            value={prescription.dosage}
                            onChange={(e) => updatePrescription(prescription.id, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Frequency
                          </label>
                          <select
                            value={prescription.frequency}
                            onChange={(e) => updatePrescription(prescription.id, 'frequency', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select frequency...</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Every 4 hours">Every 4 hours</option>
                            <option value="Every 6 hours">Every 6 hours</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="Before meals">Before meals</option>
                            <option value="After meals">After meals</option>
                            <option value="At bedtime">At bedtime</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration
                          </label>
                          <select
                            value={prescription.duration}
                            onChange={(e) => updatePrescription(prescription.id, 'duration', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select duration...</option>
                            <option value="3 days">3 days</option>
                            <option value="5 days">5 days</option>
                            <option value="7 days">7 days</option>
                            <option value="10 days">10 days</option>
                            <option value="14 days">14 days</option>
                            <option value="21 days">21 days</option>
                            <option value="30 days">30 days</option>
                            <option value="60 days">60 days</option>
                            <option value="90 days">90 days</option>
                            <option value="As needed">As needed</option>
                            <option value="Until finished">Until finished</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Instructions
                          </label>
                          <textarea
                            value={prescription.instructions}
                            onChange={(e) => updatePrescription(prescription.id, 'instructions', e.target.value)}
                            placeholder="e.g., Take with food, avoid alcohol"
                            rows="2"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={handleAddPrescription}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add Another Medication
                  </button>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleCompleteAll}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Complete Consultation
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
