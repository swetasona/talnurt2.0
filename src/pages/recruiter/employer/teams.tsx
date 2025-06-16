import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import RecruiterLayout from '@/components/Layout/RecruiterLayout';
import { FaUserFriends, FaPlus, FaUserTie, FaUsers, FaEdit, FaTrash, FaSave, FaTimes, FaBuilding, FaUserPlus, FaUserMinus, FaExclamationTriangle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  manager?: {
    id: string;
    name: string;
  };
}

interface Team {
  id: string;
  name: string;
  manager_id?: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  members: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
}

interface TeamsPageProps {
  user: User;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (!session || !session.user?.id) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }

  // Check if user has employer access
  if (session.user.role !== 'employer') {
    return {
      redirect: {
        destination: '/recruiter/dashboard',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name || session.user.email?.split('@')[0] || 'User',
        email: session.user.email || '',
        role: session.user.role || 'employer',
      },
    },
  };
};

const TeamsPage: React.FC<TeamsPageProps> = ({ user }) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [managers, setManagers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [availableEmployees, setAvailableEmployees] = useState<User[]>([]);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<{ id: string, name: string } | null>(null);

  // Form state
  const [teamForm, setTeamForm] = useState({
    name: '',
    manager_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch teams
      const teamsResponse = await fetch('/api/recruiter/employer/teams');
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData.teams || []);
      }

      // Fetch available managers
      const managersResponse = await fetch('/api/recruiter/employer/managers');
      if (managersResponse.ok) {
        const managersData = await managersResponse.json();
        setManagers(managersData.managers || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`/api/recruiter/employer/teams/${teamId}/members`);
      if (response.ok) {
        const data = await response.json();
        setAvailableEmployees(data.availableEmployees || []);
        setTeamMembers(data.teamMembers || []);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to load team members');
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Error loading team members');
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/recruiter/employer/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamForm),
      });

      if (response.ok) {
        const data = await response.json();
        setTeams([data.team, ...teams]);
        setTeamForm({ name: '', manager_id: '' });
        setShowCreateForm(false);
        toast.success('Team created successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Error creating team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setTeamForm({
      name: team.name,
      manager_id: team.manager_id || '',
    });
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !teamForm.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/recruiter/employer/teams/${editingTeam.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamForm),
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(teams.map(team => team.id === editingTeam.id ? data.team : team));
        setEditingTeam(null);
        setTeamForm({ name: '', manager_id: '' });
        toast.success('Team updated successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update team');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Error updating team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/recruiter/employer/teams/${teamId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTeams(teams.filter(team => team.id !== teamId));
        toast.success('Team deleted successfully');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Error deleting team');
    }
  };

  const openMemberModal = (team: Team) => {
    setSelectedTeam(team);
    setShowMemberModal(true);
    fetchTeamMembers(team.id);
  };

  const handleAddMember = async (employeeId: string) => {
    if (!selectedTeam) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/recruiter/employer/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: employeeId }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update available employees and team members lists
        setAvailableEmployees(availableEmployees.filter(emp => emp.id !== employeeId));
        setTeamMembers([...teamMembers, data.employee]);
        
        // Update the team in the teams list
        setTeams(teams.map(team => {
          if (team.id === selectedTeam.id) {
            return {
              ...team,
              members: [...team.members, data.employee]
            };
          }
          return team;
        }));
        
        toast.success(data.message);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to add team member');
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      toast.error('Error adding team member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (employeeId: string, employeeName: string) => {
    if (!selectedTeam) return;
    
    // Show confirmation modal instead of browser confirm
    setMemberToRemove({ id: employeeId, name: employeeName });
    setShowConfirmModal(true);
  };

  const confirmMemberRemoval = async () => {
    if (!selectedTeam || !memberToRemove) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/recruiter/employer/teams/${selectedTeam.id}/members`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employee_id: memberToRemove.id }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Find the removed employee from team members
        const removedEmployee = teamMembers.find(emp => emp.id === memberToRemove.id);
        
        // Update team members list
        setTeamMembers(teamMembers.filter(emp => emp.id !== memberToRemove.id));
        
        // Add employee back to available employees if they exist
        if (removedEmployee) {
          setAvailableEmployees([...availableEmployees, removedEmployee]);
        }
        
        // Update the team in the teams list
        setTeams(teams.map(team => {
          if (team.id === selectedTeam.id) {
            return {
              ...team,
              members: team.members.filter(member => member.id !== memberToRemove.id)
            };
          }
          return team;
        }));
        
        toast.success(data.message);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to remove team member');
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      toast.error('Error removing team member');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setMemberToRemove(null);
    }
  };

  const resetForm = () => {
    setTeamForm({ name: '', manager_id: '' });
    setShowCreateForm(false);
    setEditingTeam(null);
  };

  if (isLoading) {
    return (
      <RecruiterLayout>
        <Head>
          <title>Manage Teams | Talnurt Recruitment Portal</title>
        </Head>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout>
      <Head>
        <title>Manage Teams | Talnurt Recruitment Portal</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mr-4">
                <FaUserFriends className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Manage Teams</h1>
                <p className="text-blue-100 mt-1">
                  Create and manage your company teams
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <FaPlus className="h-4 w-4" />
              Create Team
            </button>
          </div>
        </div>

        {/* Create/Edit Team Form */}
        {(showCreateForm || editingTeam) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingTeam ? 'Edit Team' : 'Create New Team'}
            </h2>
            <form onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter team name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Manager (Optional)
                  </label>
                  <select
                    value={teamForm.manager_id}
                    onChange={(e) => setTeamForm({ ...teamForm, manager_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a manager</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaSave className="h-4 w-4" />
                  {isSubmitting ? (editingTeam ? 'Updating...' : 'Creating...') : (editingTeam ? 'Update Team' : 'Create Team')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaTimes className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Teams List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Your Teams ({teams.length})</h2>
          </div>

          {teams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {teams.map((team) => (
                <div key={team.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">{team.name}</h3>
                      {team.manager ? (
                        <div className="text-sm text-gray-600 flex items-center">
                          <FaUserTie className="mr-2" />
                          Manager: {team.manager.name}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 flex items-center">
                          <FaUserTie className="mr-2 text-gray-400" />
                          No manager assigned
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit team"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete team"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Team Members</h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {team.members.length} members
                      </span>
                    </div>
                    
                    {team.members.length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {team.members.map((member) => (
                          <div key={member.id} className="text-sm text-gray-600 flex items-center bg-gray-50 rounded p-2">
                            <FaUsers className="mr-2 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{member.name}</div>
                              <div className="text-xs text-gray-500 truncate">{member.email}</div>
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <FaUsers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 italic">No members assigned yet</p>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <button
                        onClick={() => openMemberModal(team)}
                        className="w-full text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-500 px-3 py-2 rounded-md text-sm flex items-center justify-center gap-2"
                      >
                        <FaUserPlus className="h-4 w-4" />
                        Manage Team Members
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="bg-gray-100 p-10 rounded-xl inline-block mb-4">
                <FaUserFriends className="h-16 w-16 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Created Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                Create your first team to start organizing your employees efficiently. Teams help you manage projects and responsibilities more effectively.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
              >
                <FaPlus className="h-4 w-4" />
                Create Your First Team
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Team Members Modal */}
      {showMemberModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  Manage Members - {selectedTeam.name}
                </h3>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {selectedTeam.manager && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="flex items-start">
                    <FaUserTie className="mt-1 mr-2 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-800">Team Manager: {selectedTeam.manager.name}</div>
                      <p className="text-sm text-blue-700 mt-1">
                        When an employee is added to this team, they will automatically be assigned to this manager. 
                        If an employee is removed from the team, their manager assignment will be reset.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Available Employees */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FaUserPlus className="mr-2 text-green-600" />
                    Available Employees
                  </h4>
                  
                  {availableEmployees.length > 0 ? (
                    <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                      {availableEmployees.map(employee => (
                        <div key={employee.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-xs text-gray-500">{employee.email}</div>
                          </div>
                          <button
                            onClick={() => handleAddMember(employee.id)}
                            disabled={isSubmitting}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Add to team"
                          >
                            <FaUserPlus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-lg bg-gray-50">
                      <FaUsers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No available employees found</p>
                      <p className="text-xs text-gray-400 mt-1">All employees are already assigned to teams</p>
                    </div>
                  )}
                </div>
                
                {/* Current Team Members */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <FaUsers className="mr-2 text-blue-600" />
                    Current Team Members
                  </h4>
                  
                  {teamMembers.length > 0 ? (
                    <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                      {teamMembers.map(member => (
                        <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-xs text-gray-500">{member.email}</div>
                            {member.manager && (
                              <div className="text-xs text-blue-600 flex items-center mt-1">
                                <FaUserTie className="mr-1 text-blue-500" size={10} />
                                Manager: {member.manager.name}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            disabled={isSubmitting}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove from team"
                          >
                            <FaUserMinus className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 border rounded-lg bg-gray-50">
                      <FaUsers className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No team members yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add employees from the available list</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowMemberModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        title="Remove Team Member"
        message={`Are you sure you want to remove ${memberToRemove?.name} from this team?`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmButtonType="danger"
        onConfirm={confirmMemberRemoval}
        onCancel={() => {
          setShowConfirmModal(false);
          setMemberToRemove(null);
        }}
      />
    </RecruiterLayout>
  );
};

export default TeamsPage; 