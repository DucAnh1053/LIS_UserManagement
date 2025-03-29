# User Management Module

This repository contains the code for the user management module of the Laboratory Information System. Below are the instructions to set up and run the project locally.

## Prerequisites

- Node.js (version 22.14.0)
- npm (version 11.2.0)
- MongoDB or your preferred database

## Setup Instructions

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/DucAnh1053/LIS_UserManagement.git
   cd LIS_UserManagement
   ```

2. **Environment Variables:**

   - Create a `.env` file in the root directory.
   - Use the `.env.example` file as a template:

     ```bash
     cp .env.example .env
     ```

   - Fill in the required environment variables in the `.env` file.

3. **Install Dependencies:**

   ```bash
   npm install
   ```

4. **Seed the Database:**

   - Run the following command to insert sample data into your database:

     ```bash
     npm run seed
     ```

5. **Run the Application:**

   - Start the development server:

     ```bash
     npm run dev
     ```

6. **Access the Application:**

   - Open your browser and go to `http://localhost:8080` (or the port specified in your `.env` file).
