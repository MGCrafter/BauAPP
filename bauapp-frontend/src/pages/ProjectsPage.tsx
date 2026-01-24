import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';
import { Input, Button, ProjectCard, Spinner } from '../components/ui';
import { useAuthStore, useProjectStore } from '../store';
import type { ProjectStatus } from '../types';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, loadProjects, isLoading } = useProjectStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');

  useEffect(() => {
    loadProjects(user?.id, user?.role, user?.assignedProjects);
  }, [user]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(search.toLowerCase()) ||
      project.customerName.toLowerCase().includes(search.toLowerCase()) ||
      project.address.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    paused: projects.filter((p) => p.status === 'paused').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-6xl mx-auto pb-24 md:pb-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Projekte</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">
            {projects.length} Projekte insgesamt
          </p>
        </div>
        {user?.role === 'admin' && (
          <Button
            onClick={() => navigate('/admin')}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Neues Projekt</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Projekte suchen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {(['all', 'active', 'paused', 'completed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[44px] ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {status === 'all' && 'Alle'}
            {status === 'active' && 'Aktiv'}
            {status === 'paused' && 'Pausiert'}
            {status === 'completed' && 'Abgeschlossen'}
            <span className="ml-2 opacity-70">({statusCounts[status]})</span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="py-20">
          <Spinner size="lg" />
        </div>
      ) : filteredProjects.length > 0 ? (
        <motion.div
          key={statusFilter}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredProjects.map((project) => (
            <motion.div key={project.id} variants={item}>
              <ProjectCard
                title={project.name}
                subtitle={project.customerName}
                address={project.address}
                status={project.status}
                imageUrl={project.imageUrl}
                reportsCount={project.reportsCount}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      ) : null}

      {/* Empty State */}
      {!isLoading && filteredProjects.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400">Keine Projekte gefunden</p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-primary-600 dark:text-primary-400 text-sm mt-2 hover:underline"
            >
              Suche zurücksetzen
            </button>
          )}
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-primary-600 dark:text-primary-400 text-sm mt-2 ml-4 hover:underline"
            >
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
