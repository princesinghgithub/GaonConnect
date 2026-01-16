import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const DocumentUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [selectedDoc, setSelectedDoc] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const documentTypes = [
    { value: 'license', label: 'Driving License' },
    { value: 'rc', label: 'Vehicle RC (Registration)' },
    { value: 'insurance', label: 'Insurance Certificate' },
    { value: 'aadhaar', label: 'Aadhaar Card' }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload only JPG, PNG, or PDF files');
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('📄 ' + selectedFile.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedDoc) {
      alert('Please select document type');
      return;
    }

    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('documentType', selectedDoc);
      formData.append('document', file);

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/provider/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        alert('Document uploaded successfully! Waiting for admin verification.');
        onUploadSuccess();
        handleClose();
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedDoc('');
    setFile(null);
    setPreview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Upload Document</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          
          {/* Info Alert */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0" size={20} />
              <div className="text-sm text-blue-800">
                <strong>Important:</strong> Please upload clear, readable documents. 
                Max size: 5MB. Formats: JPG, PNG, PDF.
              </div>
            </div>
          </div>

          {/* Select Document Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
            >
              <option value="">-- Choose Document --</option>
              {documentTypes.map((doc) => (
                <option key={doc.value} value={doc.value}>
                  {doc.label}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload File <span className="text-red-500">*</span>
            </label>
            
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-orange-400 cursor-pointer transition">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="text-center">
                {preview ? (
                  <div className="space-y-3">
                    {typeof preview === 'string' && preview.startsWith('data:image') ? (
                      <img 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-40 object-contain rounded"
                      />
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <FileText size={24} />
                        <span className="text-sm">{preview}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setFile(null);
                        setPreview(null);
                      }}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Remove File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="mx-auto text-gray-400" size={40} />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG or PDF (max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Upload Guidelines */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              📋 Upload Guidelines:
            </h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Document should be clear and readable</li>
              <li>• All text should be visible</li>
              <li>• No cuts or torn edges</li>
              <li>• Original documents preferred</li>
              <li>• Valid and not expired</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedDoc || !file || uploading}
            className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload Document
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DocumentUploadModal;
