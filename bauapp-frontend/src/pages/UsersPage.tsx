import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  MoreVertical,
  FolderKanban,
  Edit,
  UserPlus,
  Trash2,
  Check,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { Card, Button, Input, Badge, Modal } from '../components/ui';
import { useUIStore, useProjectStore } from '../store';
import { mockUsers } from '../mock';
import { cn } from '../utils/cn';
import type { User } from '../types';

const UsersPage: React.FC = () => {
  const { addToast } = useUIStore();
  const { projects, loadProjects } = useProjectStore();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [users, setUsers] = useState(mockUsers);

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    role: 'worker' as 'admin' | 'worker',
    email: '',
    password: '',
  });
  const [editPassword, setEditPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const workers = users.filter((u) => u.role === 'worker');
  const admins = users.filter((u) => u.role === 'admin');

  const filteredUsers = [...admins, ...workers].filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddUser = () => {
    if (!newUser.name || !newUser.username || !newUser.password) {
      addToast({ message: 'Bitte Name, Benutzername und Passwort ausfüllen', type: 'warning' });
      return;
    }

    if (newUser.password.length < 6) {
      addToast({ message: 'Passwort muss mindestens 6 Zeichen lang sein', type: 'warning' });
      return;
    }

    const newId = `user-${Date.now()}`;
    const createdUser: User = {
      id: newId,
      name: newUser.name,
      username: newUser.username,
      role: newUser.role,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newUser.username}`,
      assignedProjects: [],
    };

    setUsers([...users, createdUser]);
    addToast({ message: 'Benutzer hinzugefügt!', type: 'success' });
    setShowAddModal(false);
    setNewUser({ name: '', username: '', role: 'worker', email: '', password: '' });
    setShowNewPassword(false);
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    if (editPassword && editPassword.length < 6) {
      addToast({ message: 'Passwort muss mindestens 6 Zeichen lang sein', type: 'warning' });
      return;
    }

    // In real app, password would be sent to backend
    if (editPassword) {
      addToast({ message: 'Passwort wurde aktualisiert', type: 'info' });
    }

    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    addToast({ message: 'Benutzer aktualisiert!', type: 'success' });
    setShowEditModal(false);
    setEditingUser(null);
    setEditPassword('');
    setShowEditPassword(false);
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId));
    addToast({ message: 'Benutzer gelöscht', type: 'success' });
    setSelectedUser(null);
  };

  const handleToggleProject = (projectId: string) => {
    if (!editingUser) return;

    const currentProjects = editingUser.assignedProjects || [];
    const newProjects = currentProjects.includes(projectId)
      ? currentProjects.filter(id => id !== projectId)
      : [...currentProjects, projectId];

    setEditingUser({ ...editingUser, assignedProjects: newProjects });
  };

  const handleSaveProjectAssignments = () => {
    if (!editingUser) return;

    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    addToast({ message: 'Projekte zugewiesen!', type: 'success' });
    setShowAssignModal(false);
    setEditingUser(null);
  };

  const openEditModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const openAssignModal = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingUser({ ...user });
    setShowAssignModal(true);
  };

  const getProjectsForUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user?.assignedProjects) return [];
    return projects.filter((p) => user.assignedProjects?.includes(p.id));
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Benutzer verwalten</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {filteredUsers.length} Benutzer insgesamt
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Neuer Benutzer
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          placeholder="Benutzer suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
        />
      </div>

      {/* Admins */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Administratoren ({admins.length})
        </h2>
        <div className="space-y-3">
          {admins
            .filter((u) => filteredUsers.includes(u))
            .map((user) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <div className="flex items-center gap-4">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      loading="lazy"
                      className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <Badge variant="info" size="sm">
                          Admin
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                    </div>
                    <button
                      onClick={(e) => openEditModal(user, e)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Benutzer bearbeiten"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Workers */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Mitarbeiter ({workers.length})
        </h2>
        <div className="space-y-3">
          {workers
            .filter((u) => filteredUsers.includes(u))
            .map((user) => {
              const projects = getProjectsForUser(user.id);
              const isExpanded = selectedUser === user.id;

              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card
                    className={cn(
                      'cursor-pointer transition-all',
                      isExpanded && 'ring-2 ring-primary-500'
                    )}
                    onClick={() => setSelectedUser(isExpanded ? null : user.id)}
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={user.avatar}
                        alt={user.name}
                        loading="lazy"
                        className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="success" size="sm">
                          Aktiv
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {projects.length} Projekte
                        </p>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700"
                      >
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Zugewiesene Projekte
                        </h4>
                        {projects.length > 0 ? (
                          <div className="space-y-2">
                            {projects.map((project) => (
                              <div
                                key={project.id}
                                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                              >
                                <FolderKanban className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                                  {project.name}
                                </span>
                                <Badge
                                  variant={
                                    project.status === 'active' ? 'success' : 'default'
                                  }
                                  size="sm"
                                >
                                  {project.status === 'active' ? 'Aktiv' : 'Fertig'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500">
                            Keine Projekte zugewiesen
                          </p>
                        )}

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => openEditModal(user, e)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Bearbeiten
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => openAssignModal(user, e)}
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Projekt zuweisen
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
        </div>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Neuen Benutzer anlegen"
      >
        <div className="space-y-4">
          <Input
            label="Name *"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            placeholder="z.B. Max Mustermann"
          />
          <Input
            label="Benutzername *"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            placeholder="z.B. max.mustermann"
          />
          <Input
            label="E-Mail"
            type="email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            placeholder="z.B. max@firma.at"
          />
          <div className="relative">
            <Input
              label="Passwort *"
              type={showNewPassword ? 'text' : 'password'}
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="Mindestens 6 Zeichen"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="focus:outline-none"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rolle
            </label>
            <div className="flex gap-2">
              {(['worker', 'admin'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setNewUser({ ...newUser, role })}
                  className={cn(
                    'flex-1 py-3 rounded-xl border text-sm font-medium transition-all min-h-[44px]',
                    newUser.role === role
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                  )}
                >
                  {role === 'worker' ? 'Mitarbeiter' : 'Administrator'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setShowAddModal(false)}
            >
              Abbrechen
            </Button>
            <Button className="flex-1" onClick={handleAddUser}>
              Anlegen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingUser(null);
          setEditPassword('');
          setShowEditPassword(false);
        }}
        title="Benutzer bearbeiten"
      >
        {editingUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={editingUser.avatar}
                alt={editingUser.name}
                className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{editingUser.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{editingUser.username}</p>
              </div>
            </div>

            <Input
              label="Name"
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
            />
            <Input
              label="Benutzername"
              value={editingUser.username}
              onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rolle
              </label>
              <div className="flex gap-2">
                {(['worker', 'admin'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setEditingUser({ ...editingUser, role })}
                    className={cn(
                      'flex-1 py-3 rounded-xl border text-sm font-medium transition-all min-h-[44px]',
                      editingUser.role === role
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    )}
                  >
                    {role === 'worker' ? 'Mitarbeiter' : 'Administrator'}
                  </button>
                ))}
              </div>
            </div>

            {/* Password Change Section */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="w-4 h-4 text-gray-400" />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Passwort ändern (optional)
                </label>
              </div>
              <div className="relative">
                <Input
                  type={showEditPassword ? 'text' : 'password'}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Neues Passwort eingeben"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="focus:outline-none"
                    >
                      {showEditPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  }
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Leer lassen, um Passwort nicht zu ändern
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  handleDeleteUser(editingUser.id);
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Löschen
              </Button>
              <Button className="flex-1" onClick={handleEditUser}>
                Speichern
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Projects Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setEditingUser(null);
        }}
        title="Projekte zuweisen"
        size="md"
      >
        {editingUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
              <img
                src={editingUser.avatar}
                alt={editingUser.name}
                className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{editingUser.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {editingUser.assignedProjects?.length || 0} Projekte zugewiesen
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Wähle die Projekte aus, die diesem Benutzer zugewiesen werden sollen:
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {projects.map((project) => {
                const isAssigned = editingUser.assignedProjects?.includes(project.id);

                return (
                  <div
                    key={project.id}
                    onClick={() => handleToggleProject(project.id)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all min-h-[44px]',
                      isAssigned
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    )}
                  >
                    <div
                      className={cn(
                        'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0',
                        isAssigned
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                      )}
                    >
                      {isAssigned ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <FolderKanban className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{project.customerName}</p>
                    </div>
                    <Badge
                      variant={project.status === 'active' ? 'success' : 'default'}
                      size="sm"
                    >
                      {project.status === 'active' ? 'Aktiv' : 'Fertig'}
                    </Badge>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-6">
                  Keine Projekte vorhanden
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowAssignModal(false);
                  setEditingUser(null);
                }}
              >
                Abbrechen
              </Button>
              <Button className="flex-1" onClick={handleSaveProjectAssignments}>
                Speichern
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UsersPage;
