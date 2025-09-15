import React, { useState, useEffect } from 'react';
import './DealNotes.css';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import firebaseConfig from './firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DealNotes = () => {
  const [dealNotes, setDealNotes] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "deal-notes"), (snapshot) => {
      const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDealNotes(notes);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="deal-notes card">
      <h3>Processed Notes</h3>
      {dealNotes.map(note => (
        <div key={note.id} className="deal-note">
          <h4>{note.analysis.companyName}</h4>
          <p><strong>Problem:</strong> {note.analysis.problem}</p>
          <p><strong>Solution:</strong> {note.analysis.solution}</p>
          <p><strong>Market:</strong> {note.analysis.market}</p>
          <p><strong>Team:</strong> {note.analysis.team}</p>
          <p><strong>Financials:</strong> {note.analysis.financials}</p>
          <p><strong>Risks:</strong> {note.analysis.risks}</p>
        </div>
      ))}
    </div>
  );
};

export default DealNotes;