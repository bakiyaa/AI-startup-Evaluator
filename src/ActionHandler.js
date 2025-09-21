
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

/**
 * Handles the submission of a form action.
 * @param {object} action - The action object from the agent.
 */
async function openForm(action) {
  console.log('Handling open_form action:', action);
  // In a real implementation, this would open a modal with the form defined in action.form_spec.
  alert(`A form titled "${action.form_spec.title}" will be opened to collect more information.`);

  // The UI should now reflect that this action is pending user input.
  return { status: 'PENDING', message: 'Waiting for user to submit form.' };

  // The actual form submission would happen in a separate step, triggered by the user.
  // For example, in the form's onSubmit handler, you would call another function:
  /*
  async function submitFormData(formId, formData) {
    const response = await fetch(`${API_BASE_URL}/forms/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId, formData }),
    });
    if (!response.ok) {
      throw new Error('Form submission failed');
    }
    const result = await response.json();
    // Now the status is 'COMPLETED'. The UI should be updated to reflect this.
    // You would likely need to update the DataRoomEvent with the new status.
    return { ...result, status: 'COMPLETED' };
  }
  */
}

/**
 * Handles the scheduling of a voice call.
 * @param {object} action - The action object from the agent.
 */
async function scheduleCall(action) {
  console.log('Handling schedule_call action:', action);
  // In a real implementation, this would open a scheduling modal.
  alert(`Simulating scheduling a call for: ${action.voice_spec.purpose}`);

  // The UI should now reflect that this action is pending.
  return { status: 'PENDING', message: 'Waiting for call to be scheduled.' };
}

/**
 * Handles sending data to the RAG ingestion endpoint.
 * @param {object} action - The action object from the agent.
 */
async function sendToRag(action) {
  console.log('Handling send_to_rag action:', action);
  alert(`Simulating sending data to RAG: ${action.rag_spec.title}`);

  // The UI should now reflect that this action is pending.
  return { status: 'PENDING', message: 'Sending data to RAG.' };

  // The backend would process this and the UI would be updated later.
}

/**
 * Main handler function that delegates to the appropriate action handler.
 * @param {object} action - The action object from the agent.
 */
export async function handleAction(action) {
  switch (action.type) {
    case 'open_form':
      return await openForm(action);
    case 'schedule_call':
      return await scheduleCall(action);
    case 'send_to_rag':
      return await sendToRag(action);
    case 'clarify':
      // For now, we'll just log this. A real implementation might show a clarification message.
      console.log('Handling clarify action:', action);
      return { status: 'COMPLETED', message: 'Clarification handled.' };
    default:
      console.warn(`Unknown action type: ${action.type}`);
      return { status: 'FAILED', message: `Unknown action type: ${action.type}` };
  }
}
