import React, { useEffect } from 'react';
import { X, Download, Trash2, FileText, ExternalLink } from 'lucide-react';

const AttachmentModal = ({ attachment, onClose, onDelete }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!attachment) return null;

  const isPDF = attachment.type === 'application/pdf' || attachment.name?.toLowerCase().endsWith('.pdf');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = attachment.dataUrl;
    link.download = attachment.name || 'attachment';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    const win = window.open();
    if (win) {
      if (isPDF) {
        win.document.write(
          `<iframe src="${attachment.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
      } else {
        win.document.write(
          `<body style="margin:0; background:#111; display:flex; justify-content:center; align-items:center; min-height:100vh;"><img src="${attachment.dataUrl}" style="max-width:100%; max-height:100vh; object-fit:contain;" /></body>`
        );
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content attachment-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              {isPDF ? <FileText size={20} color="#ef4444" /> : <ExternalLink size={20} color="#3b82f6" />}
            </div>
            <div>
              <h3 className="modal-title">{attachment.name}</h3>
              <p className="modal-subtitle">
                {attachment.date ? new Date(attachment.date).toLocaleDateString('en-PK', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : 'Uploaded file'}
                {attachment.size ? ` • ${(attachment.size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>

          <div className="modal-header-actions">
            <button
              onClick={handleOpenNewTab}
              className="icon-btn-pill"
              title="Open in new window"
            >
              <ExternalLink size={17} />
              <span>Open</span>
            </button>
            <button
              onClick={handleDownload}
              className="icon-btn-pill"
              title="Download file"
            >
              <Download size={17} />
              <span>Download</span>
            </button>
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete "${attachment.name}"?`)) {
                    onDelete(attachment.id);
                    onClose();
                  }
                }}
                className="icon-btn-pill delete-pill"
                title="Delete attachment"
              >
                <Trash2 size={17} />
                <span>Delete</span>
              </button>
            )}
            <button onClick={onClose} className="modal-close-btn" title="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body Preview */}
        <div className="modal-body preview-body">
          {isPDF ? (
            <div className="pdf-preview-container">
              <object
                data={attachment.dataUrl}
                type="application/pdf"
                className="pdf-embed"
              >
                <div className="pdf-fallback">
                  <FileText size={48} color="#ef4444" />
                  <p>PDF preview is not supported directly by this browser viewer.</p>
                  <button onClick={handleDownload} className="secondary-btn" style={{ width: 'auto', marginTop: '1rem' }}>
                    <Download size={16} /> Download PDF to view
                  </button>
                </div>
              </object>
            </div>
          ) : (
            <div className="image-preview-container">
              <img
                src={attachment.dataUrl}
                alt={attachment.name}
                className="image-preview-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentModal;
