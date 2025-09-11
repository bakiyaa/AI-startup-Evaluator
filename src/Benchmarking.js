import React, { useRef, useState } from 'react';
import './Benchmarking.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const static_data_target = [{ name: 'Achieved', value: 67 }, { name: 'Remaining', value: 33 }];
const static_data_account = [{ name: 'Very Active', value: 400 }, { name: 'Inactive', value: 300 }];
const static_data_countries = [{ name: 'USA', value: 200 }, { name: 'EU', value: 150 }, { name: 'Asia', value: 100 }];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Benchmarking = ({ benchmarkData }) => {
  const reportRef = useRef();
  const [showShareModal, setShowShareModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [shareStatus, setShareStatus] = useState(''); // e.g., 'sending', 'sent', 'error'
  const [showPeerData, setShowPeerData] = useState(false);

  // Use passed data if available, otherwise use static data
  const data_target = benchmarkData?.target || static_data_target;
  const data_account = benchmarkData?.account || static_data_account;
  const data_countries = benchmarkData?.countries || static_data_countries;

  const handleDownloadPdf = () => {
    const input = reportRef.current;
    html2canvas(input, { scale: 2 }) // Using scale for better quality
      .then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        // A4 size: 210mm x 297mm. We'll use landscape for wide charts.
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        const widthInPdf = pdfWidth - 20; // with some margin
        const heightInPdf = widthInPdf / ratio;

        pdf.addImage(imgData, 'PNG', 10, 10, widthInPdf, heightInPdf);
        pdf.save("startup-benchmark-report.pdf");
      });
  };

  const handleShare = async () => {
    setShareStatus('sending');
    // TODO: Replace with your actual Cloud Function URL
    const functionUrl = 'https://YOUR_CLOUD_FUNCTION_URL/share-report';

    // Mock startup data - replace with actual data prop
    const startupData = {
      name: 'Innovate Inc.',
      industry: 'SaaS',
      summary: 'This is a promising startup with high growth potential.'
    };

    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail,
          message: shareMessage,
          startupData,
        }),
      });

      if (response.ok) {
        setShareStatus('sent');
      } else {
        throw new Error('Failed to send email.');
      }
    } catch (error) {
      console.error('Error sharing report:', error);
      setShareStatus('error');
    }
  };

  const ShareModal = () => (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Share Report via Email</h3>
        <input
          type="email"
          placeholder="Recipient's Email"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
        />
        <textarea
          placeholder="Optional message"
          value={shareMessage}
          onChange={(e) => setShareMessage(e.target.value)}
        />
        <div className="modal-actions">
          <button onClick={() => setShowShareModal(false)} disabled={shareStatus === 'sending'}>Cancel</button>
          <button onClick={handleShare} disabled={shareStatus === 'sending'}>            {shareStatus === 'sending' ? 'Sending...' : 'Send Email'}
          </button>
        </div>
        {shareStatus === 'sent' && <p className="success-message">Report sent successfully!</p>}
        {shareStatus === 'error' && <p className="error-message">Failed to send report. Please try again.</p>}
      </div>
    </div>
  );


  return (
    <div>
      {showShareModal && <ShareModal />}
      <div className="benchmarking card" ref={reportRef}>
        <div className="report-header">
          <h3>Benchmarking</h3>
          <button className="link-button" onClick={() => setShowPeerData(!showPeerData)}>
            {showPeerData ? 'Hide Peer Data' : 'View Peer Data'}
          </button>
        </div>
        {showPeerData && (
          <div className="peer-data-table">
            <h4>Peer Group Data</h4>
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Metric 1</th>
                  <th>Metric 2</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Peer Co A</td><td>1.2M</td><td>25%</td></tr>
                <tr><td>Peer Co B</td><td>2.5M</td><td>35%</td></tr>
              </tbody>
            </table>
          </div>
        )}
        <div className="charts-container">
          <div className="chart">
            <h4>Target</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data_target} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8">
                  {data_target.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart">
            <h4>Most Active Account Types</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data_account} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} fill="#82ca9d">
                  {data_account.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="chart">
            <h4>Active Countries</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data_countries}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="report-actions">
        <button onClick={handleDownloadPdf} className="action-button">Download as PDF</button>
        <button onClick={() => { setShowShareModal(true); setShareStatus(''); }} className="action-button">Share via Email</button>
      </div>
    </div>
  );
};

export default Benchmarking;
