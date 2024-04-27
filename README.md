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
1. **Clone the repository:**
    ```bash
    git clone https://github.com/surya-d007/Schonell-Reading-test.git
    ```

2. **Install dependencies:**
    ```bash
    cd Schonell-Reading-test
    cd server
    npm install
    ```

3. **Configure environment variables:**
    - Create a `.env` file in the server directory.
    - Add the following variables:
        ```plaintext
        PORT=3000
        MONGO_KEY=<your-mongodb-uri>
        SPEECH=<microsoft-speechto-text-Key>
        ```

4. **Start the server:**
    ```bash
    npm start
    ```

5. **Access the application:**
    - Open your web browser and navigate to `http://localhost:3000`.
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
