import React, { useState, useEffect } from 'react';
import { FileText, Pencil, Check, X, Plus } from 'lucide-react';

const NotesSection = ({ workItemId, currentNotes = '', onSaveNotes, isAdmin = true }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(currentNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNoteText(currentNotes);
  }, [currentNotes]);

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      await onSaveNotes(workItemId, noteText);
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNoteText(currentNotes);
    setIsEditing(false);
  };

  return (
    <div className="notes-box-card">
      <div className="notes-box-header">
        <div className="notes-box-title">
          <FileText size={16} className="text-accent" />
          <strong>Notes & Remarks</strong>
        </div>

        {!isEditing && isAdmin && (
          <button
            type="button"
            className="notes-action-trigger"
            onClick={() => setIsEditing(true)}
            title="Change or add notes"
          >
            {currentNotes ? (
              <>
                <Pencil size={13} />
                <span>Edit Note</span>
              </>
            ) : (
              <>
                <Plus size={13} />
                <span>Add Note</span>
              </>
            )}
          </button>
        )}
      </div>

      {isEditing && isAdmin ? (
        <div className="notes-editor-wrap">
          <textarea
            className="notes-textarea-input"
            rows="3"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write reminders, broken items on delivery, vendor updates, or payment remarks here..."
            autoFocus
          />
          <div className="notes-editor-footer">
            <span className="notes-hint">Anyone can update or add details here anytime.</span>
            <div className="notes-editor-btns">
              <button
                type="button"
                className="save-note-btn"
                onClick={handleSave}
                disabled={saving}
              >
                <Check size={14} />
                <span>{saving ? 'Saving...' : 'Save Notes'}</span>
              </button>
              <button
                type="button"
                className="cancel-note-btn"
                onClick={handleCancel}
                disabled={saving}
              >
                <X size={14} />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="notes-display-wrap">
          {currentNotes ? (
            <p
              className={`notes-text-body ${!isAdmin ? 'notes-read-only' : ''}`}
              onClick={isAdmin ? () => setIsEditing(true) : undefined}
              title={isAdmin ? "Click to edit" : undefined}
            >
              {currentNotes}
            </p>
          ) : (
            <div
              className={`notes-empty-state ${!isAdmin ? 'notes-read-only' : ''}`}
              onClick={isAdmin ? () => setIsEditing(true) : undefined}
            >
              {isAdmin ? (
                <>
                  <Plus size={14} />
                  <span>No notes added yet. Tap here to write notes, delivery updates, or reminders.</span>
                </>
              ) : (
                <>
                  <FileText size={14} />
                  <span>No notes or remarks recorded for this item.</span>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesSection;
