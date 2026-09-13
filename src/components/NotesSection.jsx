import React, { useState, useEffect } from 'react';
import { FileText, Pencil, Check, X, Plus } from 'lucide-react';

const NotesSection = ({ workItemId, currentNotes = '', onSaveNotes }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [noteText, setNoteText] = useState(currentNotes);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNoteText(currentNotes);
  }, [currentNotes]);

  const handleSave = async () => {
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

        {!isEditing && (
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

      {isEditing ? (
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
            <p className="notes-text-body" onClick={() => setIsEditing(true)} title="Click to edit">
              {currentNotes}
            </p>
          ) : (
            <div className="notes-empty-state" onClick={() => setIsEditing(true)}>
              <Plus size={14} />
              <span>No notes added yet. Tap here to write notes, delivery updates, or reminders.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesSection;
