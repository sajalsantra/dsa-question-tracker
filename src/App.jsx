import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppProvider, useAppState } from './context/AppContext.jsx';

import Header from './components/Header/Header.jsx';
import KpiGrid from './components/ui/KpiGrid.jsx';
import DashboardGroup from './components/Dashboard/DashboardGroup.jsx';
import FiltersPanel from './components/Filters/FiltersPanel.jsx';
import QuestionGrid from './components/Questions/QuestionGrid.jsx';
import RevisionQueue from './components/Revision/RevisionQueue.jsx';
import DataManagement from './components/DataManagement/DataManagement.jsx';

import QuestionModal from './components/Modals/QuestionModal.jsx';
import AuthModal from './components/Modals/AuthModal.jsx';
import ForgotPasswordModal from './components/Modals/ForgotPasswordModal.jsx';
import ChangePasswordModal from './components/Modals/ChangePasswordModal.jsx';
import AppModal from './components/Modals/AppModal.jsx';
import Toast from './components/ui/Toast.jsx';

import { useQuestions } from './hooks/useQuestions.js';
import { useStreak } from './hooks/useStreak.js';
import { useKPIs } from './hooks/useKPIs.js';
import { useInsights } from './hooks/useInsights.js';
import { useToast } from './hooks/useToast.js';
import { useAppModal } from './hooks/useAppModal.js';

function MainApp() {
  const { state, dispatch } = useAppState();
  const { message: toastMessage, isVisible: isToastVisible, showToast } = useToast();
  const { modalState, showConfirm, handleConfirm, handleCancel } = useAppModal();

  const {
    allQuestions,
    paginatedQuestions,
    totalPages,
    currentPage,
    resultCount,
  } = useQuestions();

  const streakData = useStreak();
  const kpis = useKPIs(allQuestions);
  const insights = useInsights(allQuestions);

  // Modals state
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'login' });
  const [forgotPassword, setForgotPassword] = useState({ isOpen: false, email: '' });
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Load questions on mount
  useEffect(() => {
    fetch('/data/questions.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        dispatch({ type: 'SET_QUESTIONS', payload: data });
      })
      .catch((err) => {
        console.error('Failed to load questions data:', err);
        showToast('Failed to load questions dataset');
      });
  }, [dispatch, showToast]);

  const handleOpenQuestion = (id) => {
    dispatch({ type: 'SET_ACTIVE_QUESTION', id });
  };

  const handleCloseQuestion = () => {
    dispatch({ type: 'SET_ACTIVE_QUESTION', id: null });
  };

  const handleToggleFavorite = (id) => {
    dispatch({ type: 'TOGGLE_FAVORITE', id });
    const isFav = state.progress[id]?.favorite;
    showToast(isFav ? 'Removed from favorites' : 'Added to favorites ⭐');
  };

  const handleRevise = (id) => {
    dispatch({ type: 'SET_STATUS', id, status: 'Needs Revision' });
    showToast('Marked for revision');
  };

  const handleMarkMastered = (id) => {
    dispatch({ type: 'SET_STATUS', id, status: 'Mastered' });
    showToast('Marked as mastered ⭐');
  };

  const handleResetAll = async () => {
    const confirmed = await showConfirm({
      title: 'Reset All Progress',
      subtitle: 'Confirmation',
      message:
        'This will erase saved progress, notes, favorites, streaks and goals. Are you sure you want to continue?',
      confirmText: 'Reset Everything',
      cancelText: 'Cancel',
      isDanger: true,
    });
    if (confirmed) {
      dispatch({ type: 'RESET_ALL' });
      showToast('All progress has been reset');
    }
  };

  return (
    <div className="wrap">
      <Header
        kpis={kpis}
        streak={streakData.current}
        onOpenAuth={(mode) => setAuthModal({ isOpen: true, mode })}
        onChangePassword={() => setChangePasswordOpen(true)}
        onResetProgress={handleResetAll}
      />

      <KpiGrid kpis={kpis} />

      <DashboardGroup
        insights={insights}
        streakData={streakData}
        allQuestions={allQuestions}
        onOpenQuestion={handleOpenQuestion}
      />

      <FiltersPanel resultCount={resultCount} />

      <QuestionGrid
        questions={paginatedQuestions}
        totalFilteredCount={resultCount}
        totalPages={totalPages}
        currentPage={currentPage}
        onOpenQuestion={handleOpenQuestion}
        onToggleFavorite={handleToggleFavorite}
        onRevise={handleRevise}
      />

      <RevisionQueue
        allQuestions={allQuestions}
        onOpenQuestion={handleOpenQuestion}
        onMarkMastered={handleMarkMastered}
      />

      <DataManagement
        allQuestions={allQuestions}
        onToast={showToast}
        onResetAll={handleResetAll}
      />

      {/* Modals */}
      <QuestionModal
        questionId={state.activeQuestionId}
        onClose={handleCloseQuestion}
        onToast={showToast}
      />

      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={() => setAuthModal((prev) => ({ ...prev, isOpen: false }))}
        onForgotPassword={(email) => {
          setAuthModal((prev) => ({ ...prev, isOpen: false }));
          setForgotPassword({ isOpen: true, email });
        }}
        onToast={showToast}
      />

      <ForgotPasswordModal
        isOpen={forgotPassword.isOpen}
        initialEmail={forgotPassword.email}
        onClose={() => setForgotPassword({ isOpen: false, email: '' })}
        onToast={showToast}
      />

      <ChangePasswordModal
        isOpen={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        onToast={showToast}
      />

      <AppModal
        modalState={modalState}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <Toast message={toastMessage} isVisible={isToastVisible} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}
