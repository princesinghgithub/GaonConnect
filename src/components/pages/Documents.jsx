import React, { useState } from 'react'
import { Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const DriverDocuments = () => {
  const [documents, setDocuments] = useState({
    aadhaar: null,
    license: null,
    vehiclePhoto: null,
    vehicleNumber: ''
  })

  const [status, setStatus] = useState('pending') 
  // pending | under_review | approved | rejected

  const handleFileChange = (e) => {
    const { name, files } = e.target
    setDocuments(prev => ({
      ...prev,
      [name]: files[0]
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!documents.aadhaar || !documents.license || !documents.vehiclePhoto) {
      alert('Please upload all required documents')
      return
    }

    // UI only – backend baad me
    alert('Documents submitted for review')
    setStatus('under_review')
  }

  const StatusBadge = () => {
    if (status === 'approved') {
      return (
        <div className="flex items-center gap-2 text-green-600 font-semibold">
          <CheckCircle /> Approved
        </div>
      )
    }
    if (status === 'rejected') {
      return (
        <div className="flex items-center gap-2 text-red-600 font-semibold">
          <AlertCircle /> Rejected
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 text-yellow-600 font-semibold">
        <Clock /> Under Review
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-50 p-4 flex justify-center items-center">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6">

        <h2 className="text-2xl font-bold text-center mb-2">
          Driver Documents
        </h2>
        <p className="text-center text-gray-600 mb-4">
          Upload documents for verification
        </p>

        <div className="flex justify-center mb-4">
          <StatusBadge />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Aadhaar */}
          <UploadField
            label="Aadhaar Card Photo *"
            name="aadhaar"
            onChange={handleFileChange}
          />

          {/* License */}
          <UploadField
            label="Driving License Photo *"
            name="license"
            onChange={handleFileChange}
          />

          {/* Vehicle Photo */}
          <UploadField
            label="Vehicle Photo (with number plate) *"
            name="vehiclePhoto"
            onChange={handleFileChange}
          />

          {/* Vehicle Number */}
          <div>
            <label className="block font-semibold mb-1">
              Vehicle Number *
            </label>
            <input
              type="text"
              value={documents.vehicleNumber}
              onChange={(e) =>
                setDocuments({ ...documents, vehicleNumber: e.target.value })
              }
              placeholder="MP09 AB 1234"
              className="w-full border-2 rounded-lg px-3 py-2 focus:border-orange-500 outline-none"
              required
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={status === 'under_review' || status === 'approved'}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-bold disabled:opacity-50"
          >
            Submit for Verification
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          Documents are required for safety and verification purpose.
        </p>
      </div>
    </div>
  )
}

const UploadField = ({ label, name, onChange }) => (
  <div>
    <label className="block font-semibold mb-1">{label}</label>
    <label className="flex items-center justify-center border-2 border-dashed rounded-lg py-6 cursor-pointer hover:border-orange-500">
      <Upload className="mr-2 text-orange-500" />
      <span>Upload Photo</span>
      <input
        type="file"
        accept="image/*"
        name={name}
        onChange={onChange}
        className="hidden"
      />
    </label>
  </div>
)

export default DriverDocuments
