import React from 'react';
import './PeerGroup.css';

const PeerGroup = ({ peers }) => {
  if (!peers || peers.length === 0) {
    return null;
  }

  return (
    <div className="peer-group card">
      <h3>Peer Group</h3>
      <ul>
        {peers.map((peer, index) => (
          <li key={index}>
            <h4>{peer.name}</h4>
            <p>{peer.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PeerGroup;
