import React, { useState, useRef } from 'react';
import './DocumentViewer.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const mockData = {
  documents: [
    { name: 'Pitch_Deck_v3.pdf', type: 'pdf', size: '5.2 MB' },
    { name: 'Financials.xlsx', type: 'excel', size: '1.1 MB' },
  ],
  communications: [
    { type: 'email', from: 'founder@startup.com', subject: 'Intro and Pitch Deck', date: '2025-09-10' },
    { type: 'call', with: 'Founder & CEO', duration: '30 mins', date: '2025-09-11' },
  ],
  publicFootprint: [
    { type: 'news', source: 'TechCrunch', title: 'Startup raises $2M seed round', date: '2025-09-01' },
    { type: 'social', source: 'Twitter', content: 'Excited to announce our new product launch!', date: '2025-08-20' },
  ],
  timeline: [
    { date: '2025-08-20', event: 'Product launch' },
    { date: '2025-09-01', event: 'Seed round announcement' },
    { date: '2025-09-10', event: 'Initial contact' },
  ],
  processedNotes: {
    summary: 'The startup is a B2B SaaS company in the fintech space. They have a strong founding team and some early traction.',
    keywords: ['fintech', 'B2B', 'SaaS', 'seed stage'],
  },
};

const DataRoom = ({ dataRoomData }) => {
  const [activeTab, setActiveTab] = useState('documents');
  const [viewingDocument, setViewingDocument] = useState(null); // State to hold the document being viewed
  const dataRoomRef = useRef(null);

  // Use dataRoomData if provided, otherwise fall back to mockData for development
  const dataToDisplay = dataRoomData || mockData;

  const handleDownloadPdf = async () => {
    const input = dataRoomRef.current;
    if (input) {
      const canvas = await html2canvas(input, {
        scale: 2, // Increase scale for better resolution
        useCORS: true, // Important if you have images from other domains
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('data-room-report.pdf');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'documents':
        return (
          <div>
            {viewingDocument ? (
              <div className="document-viewer-modal">
                <button onClick={() => setViewingDocument(null)} className="close-viewer-button">Close Viewer</button>
                <h4>Viewing: {viewingDocument.name}</h4>
                {viewingDocument.type === 'pdf' && viewingDocument.url ? (
                  <iframe src={viewingDocument.url} width="100%" height="600px" title={viewingDocument.name}></iframe>
                ) : viewingDocument.type === 'video' && viewingDocument.url ? (
                  <video controls src={viewingDocument.url} width="100%" height="400px"></video>
                ) : viewingDocument.type === 'audio' && viewingDocument.url ? (
                  <audio controls src={viewingDocument.url}></audio>
                ) : (
                  <p>Preview not available for this document type. <a href={viewingDocument.url} target="_blank" rel="noopener noreferrer">Download</a></p>
                )}
              </div>
            ) : (
              <ul>
                {dataToDisplay.documents.map((doc, index) => (
                  <li key={index}>
                    {doc.name} ({doc.size})
                    {doc.url && (
                      <>
                        <button onClick={() => setViewingDocument(doc)} className="view-button">View</button>
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="download-link">Download</a>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      case 'communications':
        return (
          <ul>
            {dataToDisplay.communications.map((comm, index) => (
              <li key={index}>{comm.type} from {comm.from || comm.with}: {comm.subject || comm.duration}</li>
            ))}
          </ul>
        );
      case 'publicFootprint':
        return (
          <ul>
            {dataToDisplay.publicFootprint.map((item, index) => (
              <li key={index}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer">{item.source}: {item.title || item.content}</a>
                ) : (
                  `${item.source}: ${item.title || item.content}`
                )}
              </li>
            ))}
          </ul>
        );
      case 'timeline':
        return (
          <ul>
            {dataToDisplay.timeline.map((item, index) => (
              <li key={index}>{item.date}: {item.event}</li>
            ))}
          </ul>
        );
      case 'processedNotes':
        return (
          <div>
            <p>{dataToDisplay.processedNotes.summary}</p>
            <div>
              {dataToDisplay.processedNotes.keywords.map((keyword, index) => (
                <span key={index} className="keyword-tag">{keyword}</span>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="data-room" ref={dataRoomRef}>
      <h3>Data Room</h3>
      <div className="tabs">
        <button onClick={() => setActiveTab('documents')} className={activeTab === 'documents' ? 'active' : ''}>Documents</button>
        <button onClick={() => setActiveTab('communications')} className={activeTab === 'communications' ? 'active' : ''}>Communications</button>
        <button onClick={() => setActiveTab('publicFootprint')} className={activeTab === 'publicFootprint' ? 'active' : ''}>Public Footprint</button>
        <button onClick={() => setActiveTab('timeline')} className={activeTab === 'timeline' ? 'active' : ''}>Timeline View</button>
        <button onClick={() => setActiveTab('processedNotes')} className={activeTab === 'processedNotes' ? 'active' : ''}>Processed Notes</button>
      </div>
      <div className="tab-content">
        {renderTabContent()}
      </div>
      <button onClick={handleDownloadPdf} className="download-pdf-button">Download as PDF</button>
    </div>
  );
};

export default DataRoom;

