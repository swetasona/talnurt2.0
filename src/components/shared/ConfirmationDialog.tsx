import React from 'react';
import { FaExclamationTriangle, FaCheck, FaTimes } from 'react-icons/fa';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  type = 'warning',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  // Define type-based styling
  const typeStyles = {
    danger: {
      icon: <FaExclamationTriangle className="h-10 w-10 text-white" />,
      bgGradient: 'from-red-600 to-red-700',
      confirmBg: 'bg-red-600 hover:bg-red-700',
      headerBg: 'bg-red-50',
      border: 'border-red-100'
    },
    warning: {
      icon: <FaExclamationTriangle className="h-10 w-10 text-white" />,
      bgGradient: 'from-amber-500 to-amber-600',
      confirmBg: 'bg-amber-500 hover:bg-amber-600',
      headerBg: 'bg-amber-50',
      border: 'border-amber-100'
    },
    info: {
      icon: <FaCheck className="h-10 w-10 text-white" />,
      bgGradient: 'from-blue-600 to-indigo-700',
      confirmBg: 'bg-blue-600 hover:bg-blue-700',
      headerBg: 'bg-blue-50',
      border: 'border-blue-100'
    },
    success: {
      icon: <FaCheck className="h-10 w-10 text-white" />,
      bgGradient: 'from-green-600 to-green-700',
      confirmBg: 'bg-green-600 hover:bg-green-700',
      headerBg: 'bg-green-50',
      border: 'border-green-100'
    }
  };

  const currentStyle = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={onCancel}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Icon header */}
          <div className={`rounded-t-lg bg-gradient-to-r ${currentStyle.bgGradient} p-4 sm:p-6 flex items-center justify-center`}>
            <div className="bg-white bg-opacity-20 rounded-full p-3">
              {currentStyle.icon}
            </div>
          </div>

          <div className={`border-x ${currentStyle.border}`}>
            {/* Title */}
            <div className="text-center pt-5 px-4 sm:px-6">
              <h3 className="text-2xl font-bold text-gray-800" id="modal-title">
                {title}
              </h3>
            </div>

            {/* Message */}
            <div className="px-4 sm:px-6 py-4">
              <p className="text-gray-600 text-lg text-center">
                {message}
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className={`flex justify-center gap-3 px-4 py-5 sm:px-6 border-t ${currentStyle.border} bg-gray-50 rounded-b-lg`}>
            <button
              type="button"
              className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`px-6 py-3 ${currentStyle.confirmBg} text-white rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-colors duration-200`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog; 