# Schonell Reading Test Application

## Introduction
This application is designed to administer the Schonell Reading Test, providing a tool for individuals, particularly those with dyslexia, to assess their reading age. The application utilizes Microsoft Speech to Text services to transcribe audio recordings of the test.

## Features
- User Registration: Users can register their Unique ID along with their date of birth to access the test.
- Test Administration: Users can take the Schonell Reading Test, with each word being transcribed and evaluated for correctness.
- Test Results: Upon completion of the test, users receive their reading age based on their performance.
- Admin Panel: Administrators can manage tests, including creating and deleting them.

## Technologies Used
- Node.js: Backend runtime environment for JavaScript.
- Express.js: Web application framework for Node.js.
- MongoDB: NoSQL database used for storing user data and test details.
- Microsoft Cognitive Services: Utilized for Speech to Text functionality.
- HTML/CSS/JavaScript: Frontend development technologies.
- EJS: Templating language for rendering HTML pages dynamically.
- Multer: Middleware for handling file uploads.
- Socket.IO: Library for real-time, bidirectional communication between web clients and servers.
- Mongoose: MongoDB object modeling for Node.js.

## Setup Instructions
1. Clone the repository to your local machine.
2. Install Node.js and MongoDB if not already installed.
3. Run `npm install` to install the required dependencies.
4. Set up environment variables by creating a `.env` file in the root directory and adding the necessary configurations (e.g., MongoDB connection string, Microsoft Speech subscription key).
5. Ensure MongoDB is running locally or update the connection string to point to your MongoDB instance.
6. Run `npm start` to start the server.
7. Access the application via `http://localhost:<PORT>` in your web browser.

## Usage
- Navigate to the application homepage.
- Register or log in using your Unique ID.
- Complete the Schonell Reading Test by following the instructions provided.
- View your test results to determine your reading age.

## Contribution Guidelines
- Fork the repository.
- Make your changes and create a new branch for your feature or fix.
- Commit your changes and push them to your fork.
- Submit a pull request detailing the changes made and any relevant information.

## License
[MIT License](LICENSE)
