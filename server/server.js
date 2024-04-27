const express = require('express');
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const session = require('express-session');
const cookieParser = require('cookie-parser');


const http = require('http');
const socketIO = require('socket.io');
const multer = require('multer');


const fs = require('fs');
const path = require('path');
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const { Console } = require('console');


require('dotenv').config();
const speechSubscriptionKey = process.env.SPEECH;

if (!speechSubscriptionKey) {
    console.error('Speech subscription key is missing.');
    process.exit(1); // Exit the process if the subscription key is missing
}

const speechConfig = sdk.SpeechConfig.fromSubscription( process.env.SPEECH , "eastus");
speechConfig.speechRecognitionLanguage = "en-US";

function makestringnormal(inputString) {
    // Convert all characters to lowercase
    let processedString = inputString.toLowerCase();

    // Remove trailing whitespace and periods
    processedString = processedString.trim();

    // Remove trailing period if exists
    if (processedString.endsWith('.')) {
        processedString = processedString.slice(0, -1);
    }

    // Remove all trailing spaces
    processedString = processedString.replace(/\s+$/, '');

    return processedString;
}



const audioDirectory = path.join(__dirname, 'audio');

// Create the directory if it doesn't exist
if (!fs.existsSync(audioDirectory)) {
    fs.mkdirSync(audioDirectory);
}


const userDataModel = require(__dirname + '/models/userData');
const adminDataModel = require(__dirname + '/models/adminData');
const testDataModel = require(__dirname + '/models/testData');



const app = express();
const server = http.createServer(app);
const io = socketIO(server);
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(cookieParser());
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.static('public'));

mongoose.connect(process.env.MONGO_KEY, { useNewUrlParser: true});

const db = mongoose.connection;
db.on("connected", () => {
  console.log("MongoDB is connected to the 'polling-app' database");
});
db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});


app.use(bodyParser.urlencoded({ extended: true }))

// parse application/json
app.use(bodyParser.json())

app.use(express.static(__dirname + '/public'));
//app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views/styles/'));
app.use(express.static(__dirname + '/views/js/'));
app.use(express.static(__dirname + '/views/images/'));

app.use(session({
  secret :'secret-key',
  resave: false,
  saveUninitia1ized: false,
}));


app.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        // Check if a file is uploaded
        if (!req.file) {
            return res.status(400).send('No audio file uploaded');
        }

        const wordNo = req.session.wordNo;
        const fileName = `audio${wordNo}.wav`;
        console.log(req.session.audioFolder + "ethjd");
        const filePath = path.join(req.session.audioFolder, fileName);
        fs.writeFileSync(filePath, req.file.buffer);

        console.log('Audio saved successfully:', filePath);

        // Call the fromFile function with the correct file path and session data
        await processAudio(filePath, req, res);


        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error occurred while deleting file:', err);
                return;
            }
            console.log('File deleted successfully.');
        });



    } catch (error) {
        console.error('Error saving audio to the server:', error);
        res.status(500).send('Internal Server Error');
    }
});

async function processAudio(filePath, req, res) {
    try {
        // Call the fromFile function with the correct file path and session data
        await fromFile(filePath, req.session, req);

        // Update session data for the next word
    
        // Redirect to the next word or test-results page
    } catch (error) {
        console.error('Error processing audio:', error);
        res.status(500).send('Internal Server Error');
    }
}


async function fromFile(filePath, sessionData, req) {
    return new Promise((resolve, reject) => {
        let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(filePath));
        let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

        speechRecognizer.recognizeOnceAsync(result => {
            switch (result.reason) {
                case sdk.ResultReason.RecognizedSpeech:
                    console.log(`RECOGNIZED: Text=${result.text}`);


                    if (makestringnormal(result.text) === makestringnormal(sessionData.correctarray[sessionData.wordNo])) {

                        console.log("correct");


                        const filePath = path.join(req.session.audioFolder,'userdata.json' );
                    

                        fs.readFile(filePath, 'utf8', (err, fileData) => {
                            if (err) {
                                console.error('Error reading file:', err);
                                return;
                            }
                        
                            try {
                                // Parse the JSON data into an array
                                let dataArray = JSON.parse(fileData);
                        
                                // Update the desired element to 1
                                 // Change this to the index you want to update
                                dataArray[req.session.wordNo] = 1;
                        
                                // Convert array back to JSON string
                                const updatedJsonData = JSON.stringify(dataArray);
                        
                                // Write updated JSON data back to the file
                                fs.writeFile(filePath, updatedJsonData, (err) => {
                                    if (err) {
                                        console.error('Error writing file:', err);
                                    } else {
                                        console.log('Data updated successfully.');
                                    }
                                });
                            } catch (parseError) {
                                console.error('Error parsing JSON:', parseError);
                            }
                        });


                        ///////



                        //console.log(req.session.userarray);
                        
                    } 
                    
                    
                    
                    else {



                        console.log(sessionData.correctarray[sessionData.wordNo]);
                    }
                    break;
                case sdk.ResultReason.NoMatch:
                    console.log("NOMATCH: Speech could not be recognized.");
                    break;
                case sdk.ResultReason.Canceled:
                    const cancellation = sdk.CancellationDetails.fromResult(result);
                    console.log(`CANCELED: Reason=${cancellation.reason}`);

                    if (cancellation.reason === sdk.CancellationReason.Error) {
                        console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
                        console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
                        console.log("CANCELED: Did you set the speech resource key and region values?");
                    }
                    break;
            }
            speechRecognizer.close();
            resolve(); // Resolve the promise when speech recognition is done
        });
    });
}




io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('audio', (audioData) => {
        // Handle audio data (e.g., broadcast to other clients, etc.)
        socket.broadcast.emit('audio', audioData);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});









app.get('/', (req, res) => {
    res.redirect("/login");
});


app.get('/login' , (req , res)=>{
   res.render('login');
})

app.get('/student/registration', (req, res) => {
    res.render('student-register',{ error : null});
});

app.post('/student/registration', async (req, res) => {
    try {
        
        req.session.studentuser = "register"
        const Unique_ID = req.body.Unique_ID;
        const userDOB = req.body.userDOB;
        
        
        const userExists =await userDataModel.findOne({ Unique_ID });
        if (userExists) {
            res.send('user already exist please choose another Unique User ID');
    }else{

        req.session.Unique_ID = req.body.Unique_ID;
        
        // Assuming the request body has the necessary data
        const { Unique_ID, testScores  } = req.body;
        const userDOB = req.body.userDOB;
        

        // Create a new instance of the UserData model
        const userData = new userDataModel({
            Unique_ID,
            userDOB,
            testScores,
        });

        // Save the data to the database
        const savedUserData =  userData.save();
        // Fetch all tests from the database
        res.redirect('/student/form');


        // const AllTests = await testDataModel.find();

        // // Render the 'student-home' view and pass the existing tests
        // res.render('student-home', { AllTests });

    }
        // // Optionally, you can also send a JSON response if needed
        // // res.status(201).json(savedUserData);
    } catch (error) {
        console.error('Error saving user data:', error);
        res.status(500).send('Internal Server Error');
    }
});



app.post('/student/login' ,async (req , res)=>{
    try {
        const { Unique_ID } = req.body;

        // Check if the Unique_ID exists in the user database
        const userExists =await userDataModel.findOne({ Unique_ID });

        if (userExists) {
            req.session.Unique_ID = Unique_ID;
            // User exists, perform authentication logic if needed
            // For now, let's just redirect to a hypothetical dashboard
        // Render the 'student-home' view and pass the existing tests
           // res.render('student-consent-form');
           req.session.studentuser = "login";
           res.redirect("/student/form");
        } else {
            // User does not exist, you can handle this case accordingly
            res.render('student-register', { error: 'User not found . Please register your Unique ID' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }


})

app.get('/student/form', (req, res) => {
    res.render('student-consent-form');
});




app.get('/student/home', async(req, res) => {
    try {
        const Unique_ID = req.session.Unique_ID ;
        // Check if the Unique_ID exists in the user database
        const userExists =await userDataModel.findOne({ Unique_ID });
        if (userExists) {
            // User exists, perform authentication logic if needed
            // For now, let's just redirect to a hypothetical dashboard
            const AllTests = await testDataModel.find();
        // Render the 'student-home' view and pass the existing tests
            
            res.render('student-home', { AllTests });
        } else {
            // User does not exist, you can handle this case accordingly
            res.render('student-register', { error: 'User not found . Please register your Unique ID' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.get('/user/dashboard', async (req, res) => {
    try {
        // Fetch the user's test details and scores from the database based on the Unique_ID
        const userData = await userDataModel.findOne({ Unique_ID: req.session.Unique_ID });

        // Render the 'user-dashboard' view and pass the fetched data
        res.render('user-dashboard', { userData });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
    }
});




app.get('/test/:testNo/:wordNo', async (req, res) => {
    const testNo = parseInt(req.params.testNo);
    const wordNo = parseInt(req.params.wordNo);
    
    // Check if testNo and wordNo are valid numbers
    if (isNaN(testNo) || isNaN(wordNo) || testNo < 0 || wordNo < 0) {
        return res.status(400).send('Invalid parameters');
    }

    // Log the Unique_ID stored in the session
    console.log(req.session.Unique_ID);

    // Store testNo and wordNo in the session data
    req.session.wordNo = wordNo;
    req.session.testNo = testNo;

    // Construct the folder path for storing audio files based on the Unique_ID stored in the session
    const audioDirectory = path.join(__dirname, 'audio');
    const folderPath = path.join(audioDirectory, req.session.Unique_ID);

    try {
        if (wordNo === 0) {
            // Fetch test data from the database based on testNo
            const testData = await testDataModel.findOne({ testno: testNo });

            // Initialize session data related to the test
            req.session[`test${testNo}`] = testData.words;
            req.session.audioFolder = folderPath;
            console.log(req.session.audioFolder + " in test");
            req.session.correctarray = testData.words;

            // Check if the folder exists, delete it if it does, and create a new one
            await fs.promises.rm(folderPath, { recursive: true, force: true });
            await fs.promises.mkdir(folderPath, { recursive: true });

            // Create a JSON file to store user data
            const variableLength = testData.words.length;
            const userarray = Array(variableLength).fill(0);
            const jsonData = JSON.stringify(userarray);
            const filePath = path.join(folderPath, 'userdata.json');
            fs.writeFileSync(filePath, jsonData);
            console.log('Data saved successfully.');
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
    }

    // Retrieve test data from session or database
    const storedTestData = req.session[`test${testNo}`];

    if (storedTestData) {
        console.log("from session");
        const wordArray = storedTestData;

        // Check if the current word exceeds the total number of words in the test
        if (wordNo >= wordArray.length) {
            try {
                const filePath = path.join(folderPath, 'userdata.json');
                const jsonData = fs.readFileSync(filePath);
                const userArray = JSON.parse(jsonData);

                // Calculate the score
                const score = userArray.reduce((acc, val) => acc + val, 0);

                // Update user's test scores in the database
                const userData = await userDataModel.findOne({ Unique_ID: req.session.Unique_ID });

                if (!userData) {
                    console.log('User data not found for Unique_ID:', req.session.Unique_ID);
                    return res.status(404).send('User data not found');
                }

                const testScoreObject = {
                    testno: testNo,
                    testScore: `${score}/${wordArray.length}`
                };

                const existingTestScoreIndex = userData.testScores.findIndex(score => score.testno === testNo);

                if (existingTestScoreIndex !== -1) {
                    userData.testScores[existingTestScoreIndex].testScore = testScoreObject.testScore;
                } else {
                    userData.testScores.push(testScoreObject);
                }

                await userData.save();
                console.log('Test results saved to the database:', userData);
            } catch (error) {
                console.error('Error saving test results:', error);
                return res.status(500).send('Error saving test results');
            }

            // Redirect to the test results page
            return res.redirect('/test-results');
        }

        // Render the test view with the current word
        const currentWord = wordArray[wordNo];
        return res.render('test', { testNo, wordNo, currentWord, wordArray });
    } else {
        console.log("session data has been cleared");
    }
});







app.get('/test-results', (req, res) => {
    // Read the JSON file
    const filePath = path.join(req.session.audioFolder, 'userdata.json');

    fs.readFile(filePath, 'utf8', (err, fileData) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send('Internal Server Error');
        }

        try {
            // Parse the JSON data into an array
            const userarray = JSON.parse(fileData);

            fs.rmdir(req.session.audioFolder, { recursive: true }, (err) => {
                if (err) {
                    console.error('Error deleting folder:', err);
                } else {
                    console.log('Folder deleted successfully.');
                }
            });


            // Pass the userarray and other required data as local variables to the EJS template
            res.render('test-results', { userarray, correctarray: req.session.correctarray, testNo: req.session.testNo });
        } catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            return res.status(500).send('Internal Server Error');
        }
    });
});



app.post('/admin/login', async (req, res) => {
    try {
        const { Unique_ID } = req.body;

        // Check if the Unique_ID exists in the user database
        const adminExists =await adminDataModel.findOne({ Unique_ID });

        if (adminExists) {
            req.session.Unique_ID = Unique_ID;
            // User exists, perform authentication logic if needed
            // For now, let's just redirect to a hypothetical dashboard
        // Render the 'student-home' view and pass the existing tests
            res.redirect("/admin/home");
        } else {
            // User does not exist, you can handle this case accordingly
            res.render('admin-registration', { error: 'admin not found . Please register your Unique ID' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }


});


app.get('/admin/registration', (req, res) => {
    res.render('admin-registration',{ error : null});
});


app.post('/admin/registration', async(req, res) => {
    try {
        const { Unique_ID } = req.body;
        // Save admin ID to the admin collection
        const admin = new adminDataModel({ Unique_ID });
        const savedAdmin = await admin.save();
        req.session.Unique_ID = Unique_ID;

        // Fetch all existing tests from the database

        
        res.redirect('/admin/home');
        // Render the admin home view and pass the existing tests
    } catch (error) {
        console.error('Error during admin login:', error);
        res.status(500).send('Internal Server Error');
    }
    
});


app.get('/admin/home', async (req, res) => {
    try {
        const  Unique_ID  = req.session.Unique_ID;
        // Check if the Unique_ID exists in the user database
        const adminExists =await adminDataModel.findOne({ Unique_ID });

        if (adminExists) {
            // User exists, perform authentication logic if needed
            // For now, let's just redirect to a hypothetical dashboard
            const AllTests = await testDataModel.find();

        // Render the 'student-home' view and pass the existing tests
            res.render('admin-home', { existingTests:AllTests });
        } else {
            // User does not exist, you can handle this case accordingly
            res.render('admin-registration', { error: 'admin not found . Please register your Unique ID' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }


});


app.post('/admin/create-test', async (req, res) => {
    try {

      const { testNumber, words } = req.body;
      // Create a new test and add it to the database
      const testData = new testDataModel({
        
          testno: testNumber,
          words: words,
      });

      const savedTestData = await testData.save();
      res.redirect('/admin/home');
    } catch (error) {
      console.error('Error during admin create test:', error);
      res.status(500).send('Internal Server Error');
    }
  });

app.post('/admin/delete-test/:testno', async (req, res) => {

    const testNo = parseInt(req.params.testno);
    try {
        // Find the document by test number and delete it
        const deletedTest = await testDataModel.findOneAndDelete({ testno: testNo });
        
        if (deletedTest) {
            console.log('Test deleted successfully:', deletedTest);
        } else {
            console.log('Test not found.');
        }

        res.redirect('/admin/home');
    } catch (error) {
        console.error('Error deleting test:', error);
    }
});






app.get('/sample' , (req , res)=>{

    res.render('test', { testNo : 1, wordNo : 1, currentWord : 'gtdf', wordArray:"srgf" });

})


const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));