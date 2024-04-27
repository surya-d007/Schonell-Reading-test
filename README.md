# Schonell Reading Test Application

## Description
The Schonell Reading Test Application is a server-side application designed to administer and process the Schonell Reading Test for dyslexic individuals. It utilizes Microsoft Speech to Text service for converting audio recordings of test responses into text for analysis. The application manages user registration, login, test administration, and scoring.

## Technologies Used
- **Node.js**: Backend runtime environment for JavaScript.
- **Express.js**: Web application framework for Node.js.
- **MongoDB**: NoSQL database used for storing user data and test details.
- **Microsoft Cognitive Services**: Utilized for Speech to Text functionality.
- **HTML/CSS/JavaScript**: Frontend development technologies.
- **EJS**: Templating language for rendering HTML pages dynamically.
- **Multer**: Middleware for handling file uploads.
- **Socket.IO**: Library for real-time, bidirectional communication between web clients and servers.
- **Mongoose**: MongoDB object modeling for Node.js.

  

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
1. **Registration:**
    - Navigate to `/student/registration` route.
    - Enter your Unique User ID and Date of Birth to register.
  
2. **Login:**
    - Once registered, navigate to `/login`.
    - Enter your Unique User ID to log in.
  
3. **Test Administration:**
    - After logging in, navigate to the test administration section `/student/home`.
    - Start the test by clicking on the respective test link.
  
4. **Test Scoring:**
    - Test results are calculated automatically after completion.
    - Scores are saved to the user's profile in the database.
  
5. **Admin Features:**
    - Admins can log in at `/admin/login` and access the admin dashboard at `/admin/home`.
    - Admins can create new tests, view existing tests, and delete tests from the dashboard.

## Contributing
Contributions are welcome! Please feel free to submit issues and pull requests.

## License
This project is licensed under the [MIT License](LICENSE).
