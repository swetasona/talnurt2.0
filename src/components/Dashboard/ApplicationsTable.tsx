import React, { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import ConfirmationModal from '../shared/ConfirmationModal';

interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company?: string;
  status: 'pending' | 'reviewed' | 'interviewed' | 'offered' | 'rejected';
  appliedDate: string;
}

interface ApplicationsTableProps {
  applications: Application[];
}

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({ applications }) => {
  const [appList, setAppList] = useState(applications);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    applicationId: string | null;
  }>({ isOpen: false, applicationId: null });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'interviewed':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const openWithdrawConfirmation = (id: string) => {
    setConfirmModal({
      isOpen: true,
      applicationId: id
    });
  };

  const closeWithdrawConfirmation = () => {
    setConfirmModal({
      isOpen: false,
      applicationId: null
    });
  };
  
  const handleWithdraw = async (id: string) => {
    closeWithdrawConfirmation();
    
    const toastId = toast.loading('Withdrawing application...');
    setWithdrawingId(id);
    
    try {
      const res = await fetch('/api/job-applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('This application no longer exists or has already been withdrawn');
        } else {
          throw new Error(data.error || 'Failed to withdraw application');
        }
      }
      
      setAppList(appList.filter(app => app.id !== id));
      toast.success('Application withdrawn successfully', { id: toastId });
    } catch (err) {
      console.error('Withdrawal error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to withdraw application', { id: toastId });
    } finally {
      setWithdrawingId(null);
    }
  };

  if (appList.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden p-6 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
        <p className="text-gray-500 mb-4">
          You haven't applied to any jobs yet. Start by browsing available positions.
        </p>
        <Link href="/jobs" className="btn btn-primary">
          Browse Jobs
        </Link>
      </div>
    );
  }
  
  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appList.map((application) => (
                <tr key={application.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {application.jobTitle}
                    </div>
                    {application.company && (
                      <div className="text-sm text-gray-500">{application.company}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistanceToNow(new Date(application.appliedDate), { addSuffix: true })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(application.status)}`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link href={`/jobs/${application.jobId}`} className="text-primary hover:text-primary-dark mr-4">
                      View Job
                    </Link>
                    <button
                      onClick={() => openWithdrawConfirmation(application.id)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      disabled={withdrawingId === application.id}
                    >
                      {withdrawingId === application.id ? 'Withdrawing...' : 'Withdraw'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title="Withdraw Application"
        message="Are you sure you want to withdraw this application? This action cannot be undone."
        confirmText="Withdraw"
        cancelText="Cancel"
        confirmButtonType="danger"
        onConfirm={() => confirmModal.applicationId && handleWithdraw(confirmModal.applicationId)}
        onCancel={closeWithdrawConfirmation}
      />
    </>
  );
};

export default ApplicationsTable; 