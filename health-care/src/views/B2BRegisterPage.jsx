'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FaBuilding, FaEnvelope, FaPhone, FaLock, FaUser, 
  FaIdCard, FaFileAlt, FaCheckCircle, FaArrowRight 
} from 'react-icons/fa';
import { API } from '@/constants';

export default function B2BRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Business Details, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    // Personal Info
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Business Info
    companyName: '',
    institutionType: '',
    tradeLicense: '',
    taxId: '',
    bkashPhone: '',
    
    // Address
    address: {
      street: '',
      thana: '',
      district: '',
      postcode: ''
    }
  });

  const institutionTypes = [
    'Hospital',
    'Clinic',
    'Diagnostic Center',
    'Laboratory',
    'Pharmacy',
    'Medical Store',
    'Nursing Home',
    'Veterinary Clinic',
    'Research Institute',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateStep1 = () => {
    if (!formData.name || formData.name.length < 3) {
      setError('Name must be at least 3 characters');
      return false;
    }
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!formData.phone || !/^01[3-9]\d{8}$/.test(formData.phone)) {
      setError('Please enter a valid Bangladesh phone number (01XXXXXXXXX)');
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(formData.password)) {
      setError('Password must contain uppercase, lowercase, number, and special character');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.companyName || formData.companyName.length < 3) {
      setError('Company name must be at least 3 characters');
      return false;
    }
    if (!formData.institutionType) {
      setError('Please select institution type');
      return false;
    }
    if (!formData.address.district) {
      setError('District is required');
      return false;
    }
    // Trade license and Tax ID are optional but recommended
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep2()) return;

    try {
      setLoading(true);

      // Prepare registration data
      const registrationData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        companyName: formData.companyName,
        company: formData.companyName, // Alias
        institutionType: formData.institutionType,
        tradeLicense: formData.tradeLicense || undefined,
        taxId: formData.taxId || undefined,
        bkashPhone: formData.bkashPhone || formData.phone,
        b2bAccount: true,
        accountType: 'B2B',
        addresses: [{
          label: 'Business Address',
          street: formData.address.street,
          thana: formData.address.thana,
          district: formData.address.district,
          postcode: formData.address.postcode,
          isDefault: true
        }]
      };

      const res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await res.json();

      if (data.success) {
        setStep(3); // Show success message
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E8A6E] to-[#0c7a5f] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaCheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted!
          </h1>
          
          <p className="text-gray-600 mb-2">
            Thank you for registering, <strong>{formData.name}</strong>!
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your B2B application is under review</li>
              <li>• We&apos;ll verify your business details</li>
              <li>• You&apos;ll receive approval within 24-48 hours</li>
              <li>• Check your email for updates</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-[#0E8A6E] text-white py-3 rounded-lg hover:bg-[#0c7a5f] font-medium transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            B2B Registration
          </h1>
          <p className="text-gray-600">
            Join our wholesale program for exclusive discounts and benefits
          </p>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-[#0E8A6E] to-[#0c7a5f] rounded-xl p-6 mb-8 text-white">
          <h3 className="text-xl font-semibold mb-4">B2B Benefits:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-bold">8-30%</div>
              <div className="text-white/90 text-sm">Category Discounts</div>
            </div>
            <div>
              <div className="text-2xl font-bold">Bulk</div>
              <div className="text-white/90 text-sm">Order Support</div>
            </div>
            <div>
              <div className="text-2xl font-bold">Free</div>
              <div className="text-white/90 text-sm">Installation & Training</div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className={`flex items-center ${step >= 1 ? 'text-[#0E8A6E]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-[#0E8A6E] text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 hidden sm:inline">Personal Info</span>
            </div>
            <div className={`w-16 h-1 mx-2 ${step >= 2 ? 'bg-[#0E8A6E]' : 'bg-gray-300'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-[#0E8A6E]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-[#0E8A6E] text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 hidden sm:inline">Business Details</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaUser className="inline mr-2" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaEnvelope className="inline mr-2" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaPhone className="inline mr-2" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                    placeholder="01XXXXXXXXX"
                  />
                  <p className="text-sm text-gray-500 mt-1">Format: 01XXXXXXXXX</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaLock className="inline mr-2" />
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                    placeholder="Min 8 characters"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Must contain uppercase, lowercase, number, and special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaLock className="inline mr-2" />
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                    placeholder="Re-enter password"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-[#0E8A6E] text-white py-3 rounded-lg hover:bg-[#0c7a5f] font-medium transition-colors flex items-center justify-center gap-2"
                >
                  Next: Business Details <FaArrowRight />
                </button>
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaBuilding className="inline mr-2" />
                    Company/Institution Name *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                    placeholder="ABC Hospital"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Institution Type *
                  </label>
                  <select
                    name="institutionType"
                    value={formData.institutionType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    {institutionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaIdCard className="inline mr-2" />
                      Trade License Number
                    </label>
                    <input
                      type="text"
                      name="tradeLicense"
                      value={formData.tradeLicense}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaFileAlt className="inline mr-2" />
                      Tax ID / TIN
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    bKash Number (for payments)
                  </label>
                  <input
                    type="tel"
                    name="bkashPhone"
                    value={formData.bkashPhone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                    placeholder="01XXXXXXXXX (optional)"
                  />
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Business Address</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                      <input
                        type="text"
                        name="address.street"
                        value={formData.address.street}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                        placeholder="123 Main Street"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Thana/Upazila</label>
                        <input
                          type="text"
                          name="address.thana"
                          value={formData.address.thana}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                          placeholder="e.g., Dhanmondi"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                        <input
                          type="text"
                          name="address.district"
                          value={formData.address.district}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                          placeholder="e.g., Dhaka"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        name="address.postcode"
                        value={formData.address.postcode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E8A6E] focus:border-transparent"
                        placeholder="e.g., 1205"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#0E8A6E] text-white py-3 rounded-lg hover:bg-[#0c7a5f] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Footer Links */}
          <div className="mt-6 pt-6 border-t text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#0E8A6E] hover:underline font-medium">
              Login here
            </Link>
            <br />
            <Link href="/register" className="text-gray-500 hover:underline">
              Register as Retail Customer
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
