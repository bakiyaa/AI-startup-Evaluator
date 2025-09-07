import React from 'react';
import './Benchmarking.css';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data_target = [{ name: 'Achieved', value: 67 }, { name: 'Remaining', value: 33 }];
const data_account = [{ name: 'Very Active', value: 400 }, { name: 'Inactive', value: 300 }];
const data_countries = [{ name: 'USA', value: 200 }, { name: 'EU', value: 150 }, { name: 'Asia', value: 100 }];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Benchmarking = () => {
  return (
    <div className="benchmarking card">
      <h3>Benchmarking</h3>
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
  );
};

export default Benchmarking;
