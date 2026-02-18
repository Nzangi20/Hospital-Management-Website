// src/pages/BillingPage.jsx - ENHANCED WITH FILTERS
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  CreditCardIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { billingAPI, paymentAPI } from '../services/api';
import { toast } from 'react-toastify';

const BillingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'Card',
    transactionId: ''
  });
  const [mpesaStatus, setMpesaStatus] = useState('idle'); // idle, waiting, success, failed
  const [mpesaReceipt, setMpesaReceipt] = useState(null);

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [bills, filterStatus]);

  const fetchBills = async () => {
    try {
      const response = await billingAPI.getAll();
      setBills(response.data.data || []);
    } catch (error) {
      console.error('Failed to load bills', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBills = () => {
    if (filterStatus === 'All') {
      setFilteredBills(bills);
    } else {
      setFilteredBills(bills.filter(bill => bill.payment_status === filterStatus));
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (paymentData.paymentMethod === 'M-Pesa') {
      // Real M-Pesa STK Push
      try {
        setMpesaStatus('waiting');
        const initRes = await paymentAPI.initiate({
          appointmentId: selectedBill.appointment_id,
          amount: paymentData.amount,
          paymentMethod: 'M-Pesa',
          phoneNumber: paymentData.phoneNumber
        });

        const ref = initRes.data.data.transactionRef;
        toast.success('STK Push sent! Check your phone.');

        // Poll for payment status
        const interval = setInterval(async () => {
          try {
            const statusRes = await paymentAPI.checkStatus(ref);
            const data = statusRes.data.data;

            if (data.status === 'Success') {
              clearInterval(interval);
              setMpesaStatus('success');
              setMpesaReceipt(data);
              toast.success('Payment confirmed!');
              fetchBills();
            } else if (data.status === 'Failed') {
              clearInterval(interval);
              setMpesaStatus('failed');
              toast.error('Payment failed or cancelled.');
            }
          } catch (err) {
            console.error('Poll error:', err);
          }
        }, 3000);

        setTimeout(() => {
          clearInterval(interval);
          if (mpesaStatus === 'waiting') {
            setMpesaStatus('failed');
            toast.error('Payment timed out.');
          }
        }, 120000);

      } catch (error) {
        setMpesaStatus('failed');
        toast.error(error.response?.data?.message || 'M-Pesa payment failed.');
      }
    } else {
      // Non-M-Pesa: record payment directly
      try {
        await billingAPI.recordPayment(selectedBill.bill_id, paymentData);
        toast.success('Payment recorded successfully!');
        setShowPaymentModal(false);
        fetchBills();
      } catch (error) {
        toast.error('Payment failed: ' + error.message);
      }
    }
  };

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: bill.total_amount,
      paymentMethod: 'Card',
      transactionId: `TXN${Date.now()}`
    });
    setMpesaStatus('idle');
    setMpesaReceipt(null);
    setShowPaymentModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Paid': 'bg-green-100 text-green-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Partially Paid': 'bg-blue-100 text-blue-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    if (status === 'Paid') return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    if (status === 'Pending') return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    if (status === 'Cancelled') return <XCircleIcon className="h-5 w-5 text-red-500" />;
    return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
  };

  const totalPending = bills
    .filter(b => b.payment_status === 'Pending' || b.payment_status === 'Partially Paid')
    .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

  const totalPaid = bills
    .filter(b => b.payment_status === 'Paid')
    .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

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
            Billing & Payments
          </h1>
          <p className="text-gray-600">
            View your bills and payment history
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bills</p>
                <p className="text-3xl font-bold text-gray-900">{bills.length}</p>
              </div>
              <DocumentTextIcon className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-3xl font-bold text-green-600">Ksh {totalPaid.toFixed(2)}</p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-3xl font-bold text-red-600">Ksh {totalPending.toFixed(2)}</p>
              </div>
              <ClockIcon className="h-10 w-10 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
            <div className="flex gap-2">
              {['All', 'Pending', 'Paid', 'Partially Paid', 'Cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterStatus === status
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {status}
                  {status !== 'All' && (
                    <span className="ml-2 text-xs">
                      ({bills.filter(b => b.payment_status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <CreditCardIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filterStatus === 'All' ? 'No Bills Yet' : `No ${filterStatus} Bills`}
            </h3>
            <p className="text-gray-600">
              {filterStatus === 'All'
                ? 'Your bills will appear here after appointments'
                : `You don't have any ${filterStatus.toLowerCase()} bills`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBills.map((bill) => (
              <div key={bill.bill_id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(bill.payment_status)}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Bill #{bill.bill_id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(bill.bill_date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Doctor</p>
                        <p className="font-medium text-gray-900">
                          Dr. {bill.doctor_first_name} {bill.doctor_last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(bill.payment_status)}`}>
                          {bill.payment_status}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Consultation Fee:</span>
                          <span className="font-medium">Ksh {parseFloat(bill.consultation_fee || 0).toFixed(2)}</span>
                        </div>
                        {parseFloat(bill.lab_charges || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Lab Charges:</span>
                            <span className="font-medium">Ksh {parseFloat(bill.lab_charges).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(bill.medication_charges || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Medications:</span>
                            <span className="font-medium">Ksh {parseFloat(bill.medication_charges).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(bill.tax_amount || 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax:</span>
                            <span className="font-medium">Ksh {parseFloat(bill.tax_amount).toFixed(2)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                        <span className="text-2xl font-bold text-primary-600">
                          Ksh {parseFloat(bill.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6">
                    {bill.payment_status === 'Pending' && (
                      <button
                        onClick={() => openPaymentModal(bill)}
                        className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium"
                      >
                        Pay Now
                      </button>
                    )}
                    {bill.payment_status === 'Paid' && (
                      <div className="text-center">
                        <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          Download Receipt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedBill && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">

              {/* M-Pesa Success Receipt */}
              {mpesaStatus === 'success' && mpesaReceipt ? (
                <div>
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircleIcon className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Payment Confirmed!</h2>
                  </div>

                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 mb-4">
                    <div className="text-center mb-3">
                      <h3 className="font-bold text-gray-700">MedTouch HMS</h3>
                      <p className="text-xs text-gray-400">PAYMENT RECEIPT</p>
                    </div>
                    <div className="border-t border-gray-200 pt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Patient</span>
                        <span className="font-medium">{mpesaReceipt.patientName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Doctor</span>
                        <span className="font-medium">{mpesaReceipt.doctorName || 'N/A'}</span>
                      </div>
                      <div className="border-t border-gray-100 my-1"></div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount</span>
                        <span className="font-bold text-green-700">KES {mpesaReceipt.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Method</span>
                        <span className="font-medium">M-Pesa</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ref</span>
                        <span className="font-mono text-xs">{mpesaReceipt.transactionRef}</span>
                      </div>
                      {mpesaReceipt.mpesaReceipt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">M-Pesa Receipt</span>
                          <span className="font-mono text-xs font-bold text-green-700">{mpesaReceipt.mpesaReceipt}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-bold">PAID</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { setShowPaymentModal(false); setMpesaStatus('idle'); setMpesaReceipt(null); }}
                    className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-bold"
                  >
                    Done
                  </button>
                </div>

              ) : mpesaStatus === 'waiting' ? (
                /* Waiting for M-Pesa */
                <div className="text-center py-8">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-green-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Waiting for M-Pesa</h3>
                  <p className="text-green-700 mb-1">STK Push sent to <strong>{paymentData.phoneNumber}</strong></p>
                  <p className="text-sm text-gray-500">Enter your M-Pesa PIN on your phone.</p>
                  <p className="text-xs text-gray-400 mt-4 animate-pulse">Checking status...</p>
                  <button
                    onClick={() => { setShowPaymentModal(false); setMpesaStatus('idle'); }}
                    className="mt-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                </div>

              ) : (
                /* Normal payment form (idle or failed states) */
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Make Payment</h2>

                  {mpesaStatus === 'failed' && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4 text-center">
                      <p className="text-red-700 font-medium text-sm">Payment failed. Please try again.</p>
                    </div>
                  )}

                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Bill #</span>
                      <span className="font-medium">{selectedBill.bill_id}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium">{new Date(selectedBill.bill_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount</span>
                      <span className="text-2xl font-bold text-primary-600">KES {parseFloat(selectedBill.total_amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <form onSubmit={handlePayment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                      <select
                        value={paymentData.paymentMethod}
                        onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        required
                      >
                        <option value="Card">Credit/Debit Card</option>
                        <option value="M-Pesa">M-Pesa</option>
                        <option value="Cash">Cash</option>
                        <option value="Insurance">Insurance</option>
                      </select>
                    </div>

                    {paymentData.paymentMethod === 'M-Pesa' ? (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">M-Pesa Phone Number</label>
                        <input
                          type="tel"
                          value={paymentData.phoneNumber || ''}
                          onChange={(e) => setPaymentData({ ...paymentData, phoneNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="07XXXXXXXX"
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                        <input
                          type="text"
                          value={paymentData.transactionId}
                          onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          placeholder="Enter transaction ID"
                          required
                        />
                      </div>
                    )}

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowPaymentModal(false); setMpesaStatus('idle'); }}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                      >
                        {paymentData.paymentMethod === 'M-Pesa' ? 'Send STK Push' : 'Record Payment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingPage;
