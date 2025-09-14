import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Forecasting = ({ forecastingData }) => {
  if (!forecastingData || forecastingData.length === 0) {
    return <p>No forecasting data available.</p>;
  }

  // Assuming forecastingData is an array of objects like:
  // [{ name: 'Jan', revenue: 4000, expenses: 2400 }, { name: 'Feb', revenue: 3000, expenses: 1398 }, ...]

  return (
    <div className="forecasting-panel">
      <h3>Forecasting</h3>
      <p>Projected financial and operational metrics.</p>

      <div className="charts-section">
        <h4>Revenue & Expenses Projection</h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={forecastingData}
            margin={{
              top: 5, right: 30, left: 20, bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="expenses" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="table-section">
        <h4>Detailed Projections</h4>
        <table>
          <thead>
            <tr>
              <th>Period</th>
              <th>Revenue</th>
              <th>Expenses</th>
              <th>Profit</th>
            </tr>
          </thead>
          <tbody>
            {forecastingData.map((item, index) => (
              <tr key={index}>
                <td>{item.name}</td>
                <td>{item.revenue}</td>
                <td>{item.expenses}</td>
                <td>{item.revenue - item.expenses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Forecasting;
