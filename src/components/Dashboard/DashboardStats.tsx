import React from 'react';
import { FaUser, FaMoneyBillWave, FaFileAlt, FaBriefcase } from 'react-icons/fa';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bgClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, bgClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center transition-transform hover:shadow-md">
    <div className={`p-4 rounded-full ${bgClass} ${color} mr-5 flex-shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

const DashboardStats: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Talent Database"
        value="500"
        icon={<FaUser size={24} />}
        color="text-blue-700"
        bgClass="bg-blue-100"
      />
      <StatCard
        title="Revenue"
        value="$80,000"
        icon={<FaMoneyBillWave size={24} />}
        color="text-green-700"
        bgClass="bg-green-100"
      />
      <StatCard
        title="Placements"
        value="24"
        icon={<FaFileAlt size={24} />}
        color="text-orange-700"
        bgClass="bg-orange-100"
      />
      <StatCard
        title="Active Jobs"
        value="12"
        icon={<FaBriefcase size={24} />}
        color="text-gray-700"
        bgClass="bg-gray-100"
      />
    </div>
  );
};

export default DashboardStats; 