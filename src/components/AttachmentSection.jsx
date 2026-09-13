import React, { useState, useRef } from 'react';
import { Paperclip, Upload, FileText, Eye, Trash2, Plus, Loader2 } from 'lucide-react';
import AttachmentModal from './AttachmentModal';

// Helper to compress images client-side before storing
const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          dataUrl,
          size: Math.round((dataUrl.length * 3) / 4)
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const AttachmentSection = ({ workItemId, attachments = [], onUpload, onDelete }) => {
  const [uploading, setUploading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const itemAttachments = attachments.filter(a => a.workItemId === workItemId);

  const handleFileProcess = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith('image/');
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

        if (!isImage && !isPdf) {
          alert(`"${file.name}" is not supported. Please upload an image or PDF file.`);
          continue;
        }

        let dataUrl = '';
        let finalSize = file.size;

        if (isImage) {
          const compressed = await compressImage(file);
          dataUrl = compressed.dataUrl;
          finalSize = compressed.size;
        } else if (isPdf) {
          if (file.size > 850 * 1024) {
            alert(`"${file.name}" is larger than 850 KB. Please upload a smaller PDF or compress it first.`);
            continue;
          }
          dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        const newAttachment = {
          id: crypto.randomUUID(),
          workItemId,
          name: file.name,
          type: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
          size: finalSize,
          date: new Date().toISOString(),
          dataUrl
        };

        await onUpload(newAttachment);
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFileProcess(e.dataTransfer.files);
    }
  };

  return (
    <div className="attachments-section">
      <div className="attachments-header">
        <div className="section-title-wrap">
          <Paperclip size={16} className="text-accent" />
          <strong>Proofs & Attachments</strong>
          <span className="count-pill">{itemAttachments.length}</span>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="upload-trigger-btn"
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Plus size={14} />
              <span>Add Proof / Receipt</span>
            </>
          )}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFileProcess(e.target.files)}
          accept="image/*,application/pdf"
          multiple
          style={{ display: 'none' }}
        />
      </div>

      {/* Drag & Drop Zone (if empty) */}
      {itemAttachments.length === 0 && !uploading && (
        <div
          className={`attachment-dropzone ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} className="dropzone-icon" />
          <p className="dropzone-title">Click or drag & drop check photos, receipts, or PDF invoices</p>
          <p className="dropzone-sub">Supports JPG, PNG, WEBP and PDF documents</p>
        </div>
      )}

      {/* Attachment Grid */}
      {itemAttachments.length > 0 && (
        <div className="attachments-grid">
          {itemAttachments.map((att) => {
            const isPdf = att.type === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf');
            return (
              <div key={att.id} className="attachment-card" onClick={() => setSelectedAttachment(att)}>
                <div className="attachment-thumb-wrap">
                  {isPdf ? (
                    <div className="pdf-thumb">
                      <FileText size={32} color="#ef4444" />
                      <span className="pdf-badge">PDF</span>
                    </div>
                  ) : (
                    <img src={att.dataUrl} alt={att.name} className="img-thumb" />
                  )}
                  <div className="thumb-overlay">
                    <Eye size={18} />
                    <span>View</span>
                  </div>
                </div>

                <div className="attachment-info">
                  <span className="attachment-name" title={att.name}>{att.name}</span>
                  <div className="attachment-meta">
                    <span>{att.size ? `${(att.size / 1024).toFixed(0)} KB` : ''}</span>
                    <span>•</span>
                    <span>{new Date(att.date).toLocaleDateString('en-PK')}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="attachment-delete-btn"
                  title="Delete file"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Delete "${att.name}"?`)) {
                      onDelete(att.id);
                    }
                  }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedAttachment && (
        <AttachmentModal
          attachment={selectedAttachment}
          onClose={() => setSelectedAttachment(null)}
          onDelete={onDelete}
        />
      )}
    </div>
  );
};

export default AttachmentSection;
