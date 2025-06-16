import React, { ReactNode } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  confirmButtonType?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonType = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <div className={`flex-shrink-0 mr-3 ${confirmButtonType === 'danger' ? 'text-red-500' : 'text-primary'}`}>
              <FaExclamationTriangle size={24} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-6 py-4">
          {typeof message === 'string' ? (
            <p className="text-gray-600">{message}</p>
          ) : (
            message
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`px-4 py-2 rounded-md font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-sm ${
              confirmButtonType === 'danger'
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-primary hover:bg-primary-dark focus:ring-primary'
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 