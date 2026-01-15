import React, { useState, useEffect } from 'react';
import { Search, Shield, User as UserIcon, Loader2 } from 'lucide-react';
import { User, UserRole } from '../../types';
import { getAllUsers, updateUserRole } from '../../lib/firebase/firestore';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const result = await getAllUsers();
      setUsers(result);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(uid);
      await updateUserRole(uid, newRole);
      setUsers(prev =>
        prev.map(u => u.uid === uid ? { ...u, role: newRole } : u)
      );
    } catch (error) {
      console.error('Error updating role:', error);
      alert('역할 변경 중 오류가 발생했습니다.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-500/20 text-red-400';
      case 'admin':
        return 'bg-indigo-500/20 text-indigo-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">사용자 관리</h1>
        <p className="text-gray-400 mt-1">총 {users.length}명의 사용자</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="사용자 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#151515] border border-gray-800 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : filteredUsers.length > 0 ? (
        <div className="bg-[#151515] border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="text-left text-gray-400 font-medium px-6 py-4">사용자</th>
                <th className="text-left text-gray-400 font-medium px-6 py-4">이메일</th>
                <th className="text-left text-gray-400 font-medium px-6 py-4">역할</th>
                <th className="text-left text-gray-400 font-medium px-6 py-4">가입일</th>
                <th className="text-left text-gray-400 font-medium px-6 py-4">최근 접속</th>
                <th className="text-right text-gray-400 font-medium px-6 py-4">역할 변경</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-white/5">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <span className="text-white font-medium">{user.displayName || '이름 없음'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(user.role)}`}>
                      {user.role === 'superadmin' && <Shield className="w-3 h-3 inline mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400">{formatDate(user.createdAt)}</td>
                  <td className="px-6 py-4 text-gray-400">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {updatingUserId === user.uid ? (
                        <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      ) : (
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as UserRole)}
                          className="bg-[#1a1a1a] border border-gray-700 text-white rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-indigo-500"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20">
          <UserIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {searchQuery ? '검색 결과가 없습니다' : '등록된 사용자가 없습니다'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
