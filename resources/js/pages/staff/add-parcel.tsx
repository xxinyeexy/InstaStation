import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, QrCode, Camera, X } from 'lucide-react';

const ParcelRegistrationForm = () => {
  const [formData, setFormData] = useState({
    trackingNumber: '',
    sender: '',
    size: '',
    location: 'Shelf A-15',
    studentName: '',
    matricId: ''
  });

  const [isScanning, setIsScanning] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleQRScan = () => {
    setIsScanning(true);
    // Simulate QR code scan
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        trackingNumber: 'TRK' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        sender: 'Express Delivery Co.',
        size: 'Medium'
      }));
      setIsScanning(false);
    }, 2000);
  };

  const handleSearch = () => {
    // Simulate student search
    if (formData.studentName.toLowerCase().includes('john')) {
      setFormData(prev => ({ ...prev, matricId: 'A20CE1234' }));
    }
  };

  const handleRegister = () => {
    console.log('Registering parcel:', formData);
    alert('Parcel registered successfully!');
  };

  const handleCancel = () => {
    setFormData({
      trackingNumber: '',
      sender: '',
      size: '',
      location: 'Shelf A-15',
      studentName: '',
      matricId: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100px); }
          100% { transform: translateY(100px); }
        }
      `}</style>
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="flex items-center gap-3 p-6 border-b">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>

        {/* Title */}
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">📦 Register New Parcel</h1>
          <p className="text-sm text-gray-600">Scan the parcel's QR code to auto-fill the details</p>
        </div>

        {/* QR Scanner Area */}
        <div className="px-6 mb-6">
          <div 
            className={`relative w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all ${
              isScanning ? 'border-pink-400 bg-pink-50' : 'border-pink-300 bg-pink-50'
            }`}
            onClick={handleQRScan}
          >
            {isScanning ? (
              <div className="text-center">
                <div className="animate-pulse">
                  <QrCode className="w-12 h-12 text-pink-500 mx-auto mb-2" />
                  <p className="text-pink-600 font-medium">Scanning...</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <QrCode className="w-12 h-12 text-pink-400 mx-auto mb-2" />
                <p className="text-pink-600 font-medium">Tap to scan QR code</p>
                <p className="text-sm text-pink-500">or manually enter details below</p>
              </div>
            )}
          </div>
        </div>

        {/* Parcel Information */}
        <div className="px-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Parcel Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
              <input
                type="text"
                placeholder="Enter tracking number"
                value={formData.trackingNumber}
                onChange={(e) => handleInputChange('trackingNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <select
                value={formData.size}
                onChange={(e) => handleInputChange('size', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">Select size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Extra Large">Extra Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender</label>
              <input
                type="text"
                placeholder="Sender name"
                value={formData.sender}
                onChange={(e) => handleInputChange('sender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="px-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Student Information</h2>
          <p className="text-sm text-gray-600 mb-3">Search for the recipient in the student database</p>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name *</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter recipient full name"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Matric ID</label>
            <input
              type="text"
              placeholder="ID number"
              value={formData.matricId}
              onChange={(e) => handleInputChange('matricId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRegister}
              disabled={!formData.trackingNumber || !formData.studentName}
              className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Register Parcel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParcelRegistrationForm;