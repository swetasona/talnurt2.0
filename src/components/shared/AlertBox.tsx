import React, { useEffect } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertBoxProps {
  isOpen?: boolean;
  type: AlertType;
  title?: string;
  message: string;
  buttonText?: string;
  confirmText?: string;
  cancelText?: string;
  autoClose?: boolean;
  autoCloseTime?: number;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirm?: boolean;
}

const AlertBox: React.FC<AlertBoxProps> = ({
  isOpen = true,
  type = 'info',
  title,
  message,
  buttonText = 'OK',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  autoClose = false,
  autoCloseTime = 5000,
  onClose,
  onConfirm,
  showConfirm = false,
}) => {
  useEffect(() => {
    if (isOpen && autoClose && !showConfirm) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseTime, onClose, showConfirm]);
  
  if (!isOpen) return null;
  
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <FaExclamationCircle className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <FaExclamationTriangle className="h-6 w-6 text-yellow-500" />;
      case 'info':
      default:
        return <FaInfoCircle className="h-6 w-6 text-blue-500" />;
    }
  };
  
  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
      default:
        return 'bg-blue-50';
    }
  };
  
  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-yellow-200';
      case 'info':
      default:
        return 'border-blue-200';
    }
  };
  
  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm transition-opacity" 
        onClick={showConfirm ? undefined : onClose}
      />
      
      {/* Alert Modal */}
      <div className={`relative border ${getBorderColor()} rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all ${getBgColor()}`}>
        <div className="p-6">
          <div className="flex items-start mb-4">
            <div className="flex-shrink-0 mr-3">
              {getIcon()}
            </div>
            <div className="flex-1">
              {title && <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>}
              <p className="text-gray-600">{message}</p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            {showConfirm ? (
              <>
                <button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                  onClick={onClose}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${getButtonColor()}`}
                  onClick={onConfirm}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={`inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${getButtonColor()}`}
                onClick={onClose}
              >
                {buttonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertBox; 