# How to Run the AI-startup-Evaluator

This document provides instructions on how to run the AI-startup-Evaluator application.

## Prerequisites

- Node.js and npm installed
- Python and pip installed

## Running the Application

1.  **Install Frontend Dependencies:**
    Open a terminal in the `AI-startup-Evaluator` directory and run the following command:
    ```bash
    npm install
    ```

2.  **Install Backend Dependencies:**
    Open a terminal in the `AI-startup-Evaluator` directory and run the following command:
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Backend Server:**
    In the same terminal, run the following command:
    ```bash
    python app.py
    ```
    The backend server will start on `http://localhost:5000`.

4.  **Run the Frontend Development Server:**
    In a new terminal, navigate to the `AI-startup-Evaluator` directory and run the following command:
    ```bash
    npm start
    ```
    The frontend development server will start, and you can view the application in your browser at `http://localhost:3000`.
