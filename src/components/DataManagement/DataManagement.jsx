import React, { useRef } from 'react';
import CollapsibleSection from '../ui/CollapsibleSection.jsx';
import { useAppState } from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { downloadFile } from '../../utils/helpers.js';
import { saveProgressDB, saveNoteDB, saveActivityDB } from '../../services/storage.js';

export default function DataManagement({ allQuestions, onToast, onResetAll }) {
  const { state, dispatch } = useAppState();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);

  const handleExportJSON = () => {
    const data = {
      progress: state.progress,
      notes: state.notesStore,
      settings: state.settings,
      activity: state.activity,
      dailyGoal: state.dailyGoal,
      exportedAt: new Date().toISOString(),
    };
    downloadFile('dsa-progress.json', JSON.stringify(data, null, 2), 'application/json');
    if (onToast) onToast('Progress exported (JSON)');
  };

  const handleExportCSV = () => {
    const rows = [
      [
        'Title',
        'Platform',
        'Topic',
        'Pattern',
        'Difficulty(Stars)',
        'Status',
        'Confidence',
        'Attempts',
        'TimeTaken',
        'LastSolved',
        'Favorite',
      ],
    ];
    allQuestions.forEach((q) => {
      rows.push([
        q.title,
        q.platform,
        q.topic,
        q.pattern,
        q.stars,
        q.status,
        q.confidence,
        q.attempts,
        q.timeTaken,
        q.lastSolved,
        q.favorite,
      ]);
    });
    const csv = rows
      .map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    downloadFile('dsa-progress.csv', csv, 'text/csv');
    if (onToast) onToast('CSV exported');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        dispatch({ type: 'IMPORT_DATA', data });

        if (isAuthenticated) {
          if (data.progress) {
            Object.keys(data.progress).forEach((id) => {
              saveProgressDB(id, data.progress[id]);
            });
          }
          if (data.notes) {
            Object.keys(data.notes).forEach((id) => {
              if (data.notes[id]) saveNoteDB(id, data.notes[id]);
            });
          }
          if (data.activity) {
            Object.keys(data.activity).forEach((date) => {
              if (data.activity[date]) saveActivityDB(date, data.activity[date]);
            });
          }
        }

        if (onToast) onToast('Progress imported successfully');
      } catch (err) {
        if (onToast) onToast('Import failed: invalid file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <CollapsibleSection
      id="dataMgmtSection"
      sectionKey="dataMgmtOpen"
      title="💾 Data Management"
    >
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn"
          id="exportJsonBtn"
          onClick={handleExportJSON}
        >
          ⬇ Export Progress (JSON)
        </button>
        <button
          type="button"
          className="btn"
          id="exportCsvBtn"
          onClick={handleExportCSV}
        >
          ⬇ Export CSV
        </button>
        <button
          type="button"
          className="btn"
          id="importBtn"
          onClick={() => fileInputRef.current?.click()}
        >
          ⬆ Import Progress
        </button>
        <input
          ref={fileInputRef}
          type="file"
          id="importFile"
          accept=".json"
          className="visually-hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="btn danger"
          id="resetAllBtn"
          onClick={onResetAll}
        >
          🗑 Reset All Progress
        </button>
      </div>
    </CollapsibleSection>
  );
}
