import React, { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaUsers, FaUserTie, FaChartLine, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface KPIData {
  profileAllocationId: string;
  profileAllocationTitle: string;
  employeeId: string;
  employeeName: string;
  candidatesAdded: number;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
}

const KPITrackingPage = () => {
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  useEffect(() => {
    const fetchKPIData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/recruiter/manager/kpi-data');
        
        if (response.ok) {
          const data = await response.json();
          setKpiData(data.kpiData || []);
          setEmployees(data.employees || []);
        } else {
          toast.error('Failed to load KPI data');
        }
      } catch (error) {
        console.error('Error fetching KPI data:', error);
        toast.error('Error loading KPI data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchKPIData();
  }, []);

  // Filter KPI data based on selected employee and date range
  const filteredKPIData = kpiData.filter(item => {
    const employeeMatch = selectedEmployee === 'all' || item.employeeId === selectedEmployee;
    
    if (dateRange === 'all') return employeeMatch;
    
    const itemDate = new Date(item.createdAt);
    const now = new Date();
    
    if (dateRange === 'today') {
      return employeeMatch && 
        itemDate.getDate() === now.getDate() &&
        itemDate.getMonth() === now.getMonth() &&
        itemDate.getFullYear() === now.getFullYear();
    }
    
    if (dateRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return employeeMatch && itemDate >= weekAgo;
    }
    
    if (dateRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return employeeMatch && itemDate >= monthAgo;
    }
    
    return employeeMatch;
  });

  // Calculate summary statistics
  const totalCandidates = filteredKPIData.reduce((sum, item) => sum + item.candidatesAdded, 0);
  const averageCandidatesPerAllocation = totalCandidates / (filteredKPIData.length || 1);
  
  // Group by employee for employee performance
  const employeePerformance = filteredKPIData.reduce((acc, item) => {
    if (!acc[item.employeeId]) {
      acc[item.employeeId] = {
        name: item.employeeName,
        totalCandidates: 0,
        allocations: 0
      };
    }
    
    acc[item.employeeId].totalCandidates += item.candidatesAdded;
    acc[item.employeeId].allocations += 1;
    
    return acc;
  }, {} as Record<string, { name: string; totalCandidates: number; allocations: number }>);

  if (isLoading) {
    return (
      <RecruiterLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">KPI Tracking Dashboard</h1>
          
          <div className="flex space-x-4">
            <div className="relative">
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="bg-white border border-gray-300 rounded-md py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Employees</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
              <FaFilter className="absolute right-3 top-3 text-gray-400" />
            </div>
            
            <div className="relative">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-white border border-gray-300 rounded-md py-2 px-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              <FaFilter className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <h2 className="ml-4 text-lg font-semibold">Total Candidates</h2>
            </div>
            <p className="text-3xl font-bold">{totalCandidates}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <FaUserTie className="text-green-600 text-xl" />
              </div>
              <h2 className="ml-4 text-lg font-semibold">Active Allocations</h2>
            </div>
            <p className="text-3xl font-bold">{filteredKPIData.length}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
              <h2 className="ml-4 text-lg font-semibold">Avg. Candidates/Allocation</h2>
            </div>
            <p className="text-3xl font-bold">{averageCandidatesPerAllocation.toFixed(1)}</p>
          </div>
        </div>
        
        {/* Employee Performance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-lg font-semibold p-4 bg-gray-50 border-b">Employee Performance</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocations</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidates Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Candidates/Allocation</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(employeePerformance).map(([id, data]) => (
                  <tr key={id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{data.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{data.allocations}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{data.totalCandidates}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(data.totalCandidates / (data.allocations || 1)).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Detailed Allocations Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <h2 className="text-lg font-semibold p-4 bg-gray-50 border-b">Allocation Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidates Added</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKPIData.map((item, index) => (
                  <tr key={`${item.profileAllocationId}-${item.employeeId}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.profileAllocationTitle}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.employeeName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.candidatesAdded}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Only managers can access this page
  if (session.user?.role !== 'manager') {
    return {
      redirect: {
        destination: '/recruiter/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default KPITrackingPage; 