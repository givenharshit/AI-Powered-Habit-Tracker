import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { HabitFormModal } from '../habits/HabitFormModal';

export const Layout = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleHabitSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenAddModal={() => setAddModalOpen(true)} />

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet context={{ refreshKey, triggerRefresh: handleHabitSaved, openAddModal: () => setAddModalOpen(true) }} />
        </main>
      </div>

      {/* Global Add Habit Modal */}
      <HabitFormModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onHabitSaved={handleHabitSaved}
      />
    </div>
  );
};
