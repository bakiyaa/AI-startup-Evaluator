import React from 'react';

export default function DataRoom({ events = [] }) {
  if (!events.length) {
    return (
      <div style={styles.empty}>
        <p>No interactions yet. Ask the analyst or trigger an action to see the timeline here.</p>
      </div>
    );
  }

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending':
        return { ...styles.statusBadge, background: '#FEF3C7', color: '#92400E' };
      case 'completed':
        return { ...styles.statusBadge, background: '#D1FAE5', color: '#065F46' };
      default:
        return styles.statusBadge;
    }
  };

  return (
    <div style={styles.wrap}>
      <ul style={styles.list}>
        {events.map(ev => (
          <li key={ev.id} style={styles.item}>
            {ev.type === 'agent_actions' && (
              <>
                <div style={styles.row}>
                  <span style={styles.badge}>{ev.type}</span>
                  <span style={styles.time}>{new Date(ev.ts).toLocaleString()}</span>
                </div>
                {ev.context?.query && (
                  <div style={styles.line}>
                    <strong>Query:</strong> {ev.context.query}
                  </div>
                )}
                {Array.isArray(ev.actions) && ev.actions.length > 0 && (
                  <div style={styles.actions}>
                    <strong>Actions:</strong>
                    <ul>
                      {ev.actions.map((a, idx) => (
                        <li key={idx}>
                          <span>{a.label || a.type}</span>
                          {a.url && (
                            <>
                              {' '}— <a href={a.url} target="_blank" rel="noreferrer">open</a>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {ev.type === 'data_request' && (
              <>
                <div style={styles.row}>
                  <span style={styles.badge}>{ev.type}</span>
                  <span style={styles.time}>{new Date(ev.ts).toLocaleString()}</span>
                </div>
                <div style={styles.line}>
                  {ev.content}
                </div>
                <div style={styles.line}>
                  <strong>Status:</strong> <span style={getStatusBadgeStyle(ev.status)}>{ev.status}</span>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  wrap: { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 12 },
  list: { margin: 0, padding: 0, listStyle: 'none' },
  item: { padding: '10px 8px', borderBottom: '1px solid #F3F4F6' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  badge: { background: '#EEF2FF', color: '#3730A3', padding: '2px 8px', borderRadius: 6, fontSize: 12 },
  time: { color: '#6B7280', fontSize: 12 },
  line: { margin: '4px 0', whiteSpace: 'pre-wrap' },
  actions: { marginTop: 4 },
  empty: { padding: 16, border: '1px dashed #D1D5DB', borderRadius: 8, color: '#6B7280' },
  statusBadge: { padding: '2px 8px', borderRadius: 6, fontSize: 12, textTransform: 'capitalize' },
};