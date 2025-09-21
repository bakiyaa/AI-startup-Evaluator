import React, { useState, useEffect, useRef } from 'react';
import './DocumentViewer.css';
import { db } from './firebaseConfig';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const DataRoom = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState('communications');
  const [communications, setCommunications] = useState([]);
  const dataRoomRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      const q = query(collection(db, "projects", projectId, "data_requests"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const requests = [];
        querySnapshot.forEach((doc) => {
          requests.push({ id: doc.id, ...doc.data() });
        });
        setCommunications(requests);
      });
      return () => unsubscribe();
    }
  }, [projectId]);

  const handleDownloadPdf = async () => {
    const input = dataRoomRef.current;
    if (input) {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('data-room-report.pdf');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'communications':
        return (
          <ul>
            {communications.map((comm) => (
              <li key={comm.id}>
                <p><strong>Status:</strong> {comm.status}</p>
                <p><strong>Request:</strong></p>
                <pre>{comm.request_text}</pre>
              </li>
            ))}
          </ul>
        );
      default:
        return null;
    }
  };

  return (
    <div className="data-room" ref={dataRoomRef}>
      <h3>Data Room</h3>
      <div className="tabs">
        <button onClick={() => setActiveTab('communications')} className={activeTab === 'communications' ? 'active' : ''}>Communications</button>
      </div>
      <div className="tab-content">
        {renderTabContent()}
      </div>
      <button onClick={handleDownloadPdf} className="download-pdf-button">Download as PDF</button>
    </div>
  );
};

export default DataRoom;