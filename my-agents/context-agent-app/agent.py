import os
import textwrap
from google.adk.agents import Agent
from google.adk.tools import Tool
from google.cloud import firestore

class ContextManagementTool(Tool):
    name = "context_management_tool"
    description = "A tool to handle requests for missing data."

    def __init__(self):
        self.db = firestore.Client()

    def run(self, company_id: str, fields: list[str], priority: str, due_in_hours: int, notes: str) -> str:
        project_id = company_id # Assuming company_id is the project_id
        questions = "\n".join([f"- {field}" for field in fields])
        request_text = f"""
        Hello! I need some more information about this startup.
        Could you please provide the following details:
        {questions}

        Priority: {priority}
        Due in: {due_in_hours} hours
        Notes: {notes}
        """

        doc_ref = self.db.collection("projects", project_id, "data_requests").document()
        doc_ref.set({
            "request_text": request_text,
            "status": "pending",
            "timestamp": firestore.SERVER_TIMESTAMP,
        })

        return "I have created a new data request. You can track its status in the Data Room."

context_tool = ContextManagementTool()

root_agent = Agent(
    model='gemini-2.5-flash',
    name='context_management_agent',
    description='An agent that helps with collecting missing information for startup evaluations.',
    instruction='You are a helpful assistant. Your role is to collect missing information for startup evaluations. When you are asked to collect information, you should ask clear and concise questions to the user. You can also suggest creating a Google Form or scheduling a call for more detailed information gathering.',
    tools=[context_tool],
)
