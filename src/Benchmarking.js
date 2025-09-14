import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Benchmarking = ({ benchmarkData }) => {
  if (!benchmarkData || benchmarkData.length === 0) {
    return <p>No benchmarking data available.</p>;
  }

  // Assuming benchmarkData is an array of objects like:
  // [{ name: 'Metric A', startup: 100, peerAverage: 80, topPeer: 120 }, ...]

  return (
    <div className="benchmarking-report">
      <h3>Benchmarking</h3>
      <p>Comparison against sector peers.</p>

      <div className="charts-section">
        <h4>Key Metrics Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={benchmarkData}
            margin={{
              top: 20, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="startup" fill="var(--primary-color)" name="Your Startup" />
            <Bar dataKey="peerAverage" fill="#6c757d" name="Peer Average" />
            <Bar dataKey="topPeer" fill="#adb5bd" name="Top Peer" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="table-section">
        <h4>Detailed Data</h4>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Your Startup</th>
              <th>Peer Average</th>
              <th>Top Peer</th>
            </tr>
          </thead>
          <tbody>
            {benchmarkData.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.startup}</td>
                <td>{item.peerAverage}</td>
                <td>{item.topPeer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Benchmarking;