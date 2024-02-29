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

const speechConfig = sdk.SpeechConfig.fromSubscription("89cb06294f424d139909619564deba2d", "eastus");
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



// function fromFile(filePath, sessionData, req) {
//     let audioConfig = sdk.AudioConfig.fromWavFileInput(fs.readFileSync(filePath));
//     let speechRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

//     speechRecognizer.recognizeOnceAsync(result => {
//         switch (result.reason) {
//             case sdk.ResultReason.RecognizedSpeech:
//                 console.log(`RECOGNIZED: Text=${result.text}`);
//                 if( makestringnormal(result.text) == makestringnormal(sessionData.correctarray[sessionData.wordNo])) {
//                     console.log("correct");
//                     req.session.userarray[req.session.wordNo] = 1;
//                     console.log(req.session.userarray);


//                 } else {
//                     console.log(sessionData.correctarray[sessionData.wordNo]);
//                 }
//             case sdk.ResultReason.NoMatch:
//                 console.log("NOMATCH: Speech could not be recognized.");
//                 break;
//             case sdk.ResultReason.Canceled:
//                 const cancellation = sdk.CancellationDetails.fromResult(result);
//                 console.log(`CANCELED: Reason=${cancellation.reason}`);

//                 if (cancellation.reason == sdk.CancellationReason.Error) {
//                     console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
//                     console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
//                     console.log("CANCELED: Did you set the speech resource key and region values?");
//                 }
//                 break;
//         }
//         speechRecognizer.close();
//     });
// }





const audioDirectory = path.join(__dirname, 'audio');

// Create the directory if it doesn't exist
if (!fs.existsSync(audioDirectory)) {
    fs.mkdirSync(audioDirectory);
}


const userDataModel = require(__dirname + '/models/userData');
const adminDataModel = require(__dirname + '/models/adminData');
const testDataModel = require(__dirname + '/models/testData');


require('dotenv').config();

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
app.use(express.static(__dirname + '/views/styles/'));
app.use(express.static(__dirname + '/views/js/'));
app.use(express.static(__dirname + '/views/images/'));

app.use(session({
  secret :'secret-key',
  resave: false,
  saveUninitia1ized: false,
}));



// app.post('/upload', upload.single('audio'), async (req, res) => {
//     try {
//         // Check if a file is uploaded
//         if (!req.file) {
//             return res.status(400).send('No audio file uploaded');
//         }

        

//         const wordNo = req.session.wordNo;
//         const fileName = `audio${wordNo}.wav`;
//         const filePath = path.join(req.session.audioFolder, fileName);
//         fs.writeFileSync(filePath, req.file.buffer);

//         console.log('Audio saved successfully:', filePath);

//         // Call the fromFile function with the correct file path and session data
//         //fromFile(filePath, req.session);
//         fromFile(filePath, req.session, req);

//         // Delete the file after processing
//         fs.unlink(filePath, (err) => {
//             if (err) {
//                 console.error('Error occurred while deleting file:', err);
//                 return;
//             }
//             console.log('File deleted successfully.');
//         });

//         res.sendStatus(200);
//     } catch (error) {
//         console.error('Error saving audio to the server:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });



app.post('/upload', upload.single('audio'), async (req, res) => {
    try {
        // Check if a file is uploaded
        if (!req.file) {
            return res.status(400).send('No audio file uploaded');
        }

        const wordNo = req.session.wordNo;
        const fileName = `audio${wordNo}.wav`;
        const filePath = path.join(req.session.audioFolder, fileName);
        fs.writeFileSync(filePath, req.file.buffer);

        console.log('Audio saved successfully:', filePath);

        // Call the fromFile function with the correct file path and session data
        await fromFile(filePath, req.session, req);

        // Delete the file after processing
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error occurred while deleting file:', err);
                return;
            }
            console.log('File deleted successfully.');
        });

        res.sendStatus(200);
    } catch (error) {
        console.error('Error saving audio to the server:', error);
        res.status(500).send('Internal Server Error');
    }
});

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
                        req.session.userarray[req.session.wordNo] = 1;
                        console.log(req.session.userarray);
                    } else {
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
            res.send('user already exist');
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



// app.get('/student/test/:testNo/:wordNo', (req, res) => {
//     const testNo = parseInt(req.params.testNo);
//     const wordNo = parseInt(req.params.wordNo);

//     if(req.session.studentuser == "login" || req.session.studentuser == "register")
//     {
    
//         if (req.session.Unique_ID) {
//             // User exists, perform authentication logic if needed
//             // For now, let's just redirect to a hypothetical dashboard
//             const testData = await testDataModel.findOne({ testno: testNoToFind });
//         // Render the 'student-home' view and pass the existing tests
            
//             res.render('student-home', { AllTests });
       
//     }
// }});


// app.get('/test/:testNo/:wordNo', async (req, res) => {


//     console.log(req.session.userarray);
    
//     const testNo = parseInt(req.params.testNo);
//     const wordNo = parseInt(req.params.wordNo);
    
//     const audioDirectory = path.join(__dirname, 'audio');
//     const folderPath = path.join(audioDirectory, req.session.Unique_ID);

//     req.session.audioFolder = folderPath;
//     req.session.wordNo = wordNo;
//     req.session.testNo = testNo;

//     if(wordNo==0)
//     {
        
//         fs.mkdir(folderPath, (err) => {
//             if (err) {
//               console.error(err);
//               return;
//             }});
//             console.log(`Folder '${folderPath}' created successfully.`);


//             // var storedTestData = req.cookies['testData'];
//             // const parsedTestData = JSON.parse(storedTestData);
//             // const wordArray = parsedTestData.wordArray;
//             // //const array = new Array(wordArray.length); // This will create an array with 3 undefined elements
//              //const array = Array.from({ length: wordArray.length }, () => 0);
//             // //console.log(array);
//             // //const array = [1, 2, 3, 4, 5];
//             // // Store the array in the session
            
            
//              //req.session.userarray = array;

            
//             //console.log(req.session.userarray);

//     };


    
//     if (isNaN(testNo) || isNaN(wordNo) || testNo < 0 || wordNo < 0) {
//         res.status(400).send('Invalid parameters');
//         return;
//     }

//     // Check if the test data is stored in the user's cookie
//     var storedTestData = req.session[`test${testNo}`];

//     if (storedTestData) {


        
//         console.log("from session");
//         wordArray = storedTestData;
//         // if(wordNo==0)
//         // {
//         //     //var storedTestData = req.cookies['testData'];
//         //     //const parsedTestData = JSON.parse(storedTestData);
//         //     //const wordArray = parsedTestData.wordArray;

            
//         //     req.session.correctarray = storedTestData;
//         //     // //const array = new Array(wordArray.length); // This will create an array with 3 undefined elements
//         //      const array = Array.from({ length: wordArray.length }, () => 0);
//         //     // //console.log(array);
//         //     // //const array = [1, 2, 3, 4, 5];
//         //     // // Store the array in the session
//         //      req.session.userarray = array;
//         // }

    
//         // Parse the string back into an object
        

//         // Check if the stored test number matches the requested test number

//             console.log(wordNo + "  " +wordArray.length)
//             if (wordNo >= wordArray.length) {
//                 //res.redirect('/student/home');
//                 console.log(1);
//                 fs.rm(folderPath, { recursive: true }, (err) => {
//                     if (err) {
//                         console.error('Error occurred while deleting folder:', err);
//                     }
//                     console.log('Folder deleted successfully.');
//                     console.log(2);
                    
//                 //res.status(400).send('Invalid word index');
//                 console.log(3);
//                 res.render('test-results');
//                     //return;
//                 });
                
                
//         }

//             console.log(4);
//             const currentWord = wordArray[wordNo];
//             res.render('test', { testNo, wordNo, currentWord, wordArray });
//             return;
//     }


//     else{
//     // If test number doesn't match or there is no stored test data, retrieve it from the database
//     try {
//         const testData = await testDataModel.findOne({ testno: testNo });

//         if (testData) {

//             console.log("from Db");
//             // Convert array to string and include the test number
            
//             // Set the test data in the user's cookie
//             req.session[`test${testNo}`] = testData.words;

//             const wordArray = testData.words;

//             if(wordNo==0)
//             {
//                 //var storedTestData = req.cookies['testData'];
//                 //const parsedTestData = JSON.parse(storedTestData);
//                 //const wordArray = parsedTestData.wordArray;
//                 req.session.correctarray = wordArray;

//             // //const array = new Array(wordArray.length); // This will create an array with 3 undefined elements
//              console.log("nrw userarray createdx");
//              const array = Array.from({ length: wordArray.length }, () => 0);
//             // //console.log(array);
//             // //const array = [1, 2, 3, 4, 5];
//             // // Store the array in the session
            
            
//              req.session.userarray = array;

        

//             }

//             if (wordNo >= wordArray.length) {
//                 //res.status(400).send('Test finished');
//                 //res.redirect('/student/home');

//                 fs.rm(folderPath, { recursive: true }, (err) => {
//                     if (err) {
//                         console.error('Error occurred while deleting folder:', err);
//                         return;
//                     }
//                     console.log('Folder deleted successfully.');
//                 });
//                 res.redirect('/test-results');
//                 return;
//             }
//             const currentWord = wordArray[wordNo];
//             res.render('test', { testNo, wordNo, currentWord, wordArray });
//         } else {
//             res.status(404).send('Test data not found');
//         }
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Internal Server Error');
//     }
// }
// });

// app.get('/test/:testNo/:wordNo', async (req, res) => {
//     const testNo = parseInt(req.params.testNo);
//     const wordNo = parseInt(req.params.wordNo);
    
//     const audioDirectory = path.join(__dirname, 'audio');
//     const folderPath = path.join(audioDirectory, req.session.Unique_ID);

//     req.session.audioFolder = folderPath;
//     req.session.wordNo = wordNo;
//     req.session.testNo = testNo;

//     if (wordNo === 0) {
//         try {
//             await fs.promises.mkdir(folderPath); // Use promises for asynchronous file system operations

//             console.log(`Folder '${folderPath}' created successfully.`);
//         } catch (err) {
//             console.error(err);
//             return res.status(500).send('Internal Server Error'); // Handle error
//         }
//     }

//     console.log(req.session.userarray);

//     if (isNaN(testNo) || isNaN(wordNo) || testNo < 0 || wordNo < 0) {
//         return res.status(400).send('Invalid parameters'); // Return response immediately
//     }

//     var storedTestData = req.session[`test${testNo}`];

//     if (storedTestData) {
//         console.log("from session");
//         wordArray = storedTestData;
//         if (wordNo === 0) {
//             req.session.correctarray = storedTestData;
//             const array = Array.from({ length: wordArray.length }, () => 0);
//             req.session.userarray = array;
//         }

//         console.log(wordNo + "  " + wordArray.length);
//         if (wordNo >= wordArray.length) {
//             try {
//                 await fs.promises.rm(folderPath, { recursive: true }); // Use promises for asynchronous file system operations
//                 console.log('Folder deleted successfully.');
//             } catch (err) {
//                 console.error('Error occurred while deleting folder:', err);
//             }
//             return res.redirect('/test-results');
//         }

//         const currentWord = wordArray[wordNo];
//         return res.render('test', { testNo, wordNo, currentWord, wordArray });
//     } else {
//         try {
//             const testData = await testDataModel.findOne({ testno: testNo });

//             if (testData) {
//                 console.log("from Db");

//                 req.session[`test${testNo}`] = testData.words;

//                 const wordArray = testData.words;

//                 if (wordNo === 0) {
//                     req.session.correctarray = wordArray;
//                     const array = Array.from({ length: wordArray.length }, () => 0);
//                     req.session.userarray = array;
//                 }

//                 if (wordNo >= wordArray.length) {
//                     try {
//                         await fs.promises.rm(folderPath, { recursive: true });
//                         console.log('Folder deleted successfully.');
//                     } catch (err) {
//                         console.error('Error occurred while deleting folder:', err);
//                     }
//                     return res.redirect('/test-results');
//                 }

//                 const currentWord = wordArray[wordNo];
//                 return res.render('test', { testNo, wordNo, currentWord, wordArray });
//             } else {
//                 return res.status(404).send('Test data not found');
//             }
//         } catch (error) {
//             console.error(error);
//             return res.status(500).send('Internal Server Error');
//         }
//     }
// });

// app.get('/test/:testNo/:wordNo', async (req, res) => {
//     const testNo = parseInt(req.params.testNo);
//     const wordNo = parseInt(req.params.wordNo);
    
//     const audioDirectory = path.join(__dirname, 'audio');
//     const folderPath = path.join(audioDirectory, req.session.Unique_ID);

//     req.session.audioFolder = folderPath;
//     req.session.wordNo = wordNo;
//     req.session.testNo = testNo;

//     if(wordNo==0)
//     {
//         try {
//             // Check if the folder exists
//             const folderExists = await fs.promises.stat(folderPath);

//             // If the folder exists, delete it
//             if (folderExists.isDirectory()) {
//                 await fs.promises.rm(folderPath, { recursive: true });
//                 console.log(`Folder '${folderPath}' deleted successfully.`);
//             }

//             // Create the folder
//             await fs.promises.mkdir(folderPath);
//             console.log(`Folder '${folderPath}' created successfully.`);
//         } catch (err) {
//             console.error(err);
//             return res.status(500).send('Internal Server Error'); // Handle error
//         }

//         const testData = await testDataModel.findOne({ testno: testNo });

//         req.session[`test${testNo}`] = testData.words;
//         const wordArray = testData.words;
//         req.session.correctarray = wordArray;
//         const array = Array.from({ length: wordArray.length }, () => 0);
//         req.session.userarray = array;

//     }

//     console.log(req.session.userarray);

//     if (isNaN(testNo) || isNaN(wordNo) || testNo < 0 || wordNo < 0) {
//         return res.status(400).send('Invalid parameters'); // Return response immediately
//     }

//     var storedTestData = req.session[`test${testNo}`];

//     if (storedTestData) {
//         console.log("from session");
//         wordArray = storedTestData;
        

//         console.log(wordNo + "  " + wordArray.length);
//         if (wordNo >= wordArray.length) {


//             const userarray = req.session.userarray;

//             // Calculate the sum of the numbers in the array
//             const sum = userarray.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
//             console.log("tot score" +sum);
            

//             return res.redirect('/test-results');
//         }

//         const currentWord = wordArray[wordNo];
//         return res.render('test', { testNo, wordNo, currentWord, wordArray });
//     }else{
//         console.log("session data has been cleared");
//     }
// });


// app.get('/test/:testNo/:wordNo', async (req, res) => {
//     const testNo = parseInt(req.params.testNo);
//     const wordNo = parseInt(req.params.wordNo);
    
//     if (isNaN(testNo) || isNaN(wordNo) || testNo < 0 || wordNo < 0) {
//         return res.status(400).send('Invalid parameters'); // Return response immediately
//     }

//     if(wordNo === 0) {
//         // Assuming 'audio' directory exists in the current directory
//         const audioDirectory = path.join(__dirname, 'audio');
//         const folderPath = path.join(audioDirectory, req.session.Unique_ID);

//         console.log(audioDirectory);

//         console.log(folderPath);
//         try {
//             // Check if the folder exists
//             //const folderExists = await fs.stat(folderPath);
//             //const folderExists = await fs.promises.stat(folderPath);

//             // If the folder exists, delete it

//             // Check if the folder exists
//             const folderExists = await fs.promises.access(folderPath)
//             .then(() => true)
//             .catch(() => false);

//             // If the folder exists, delete it
//             if (folderExists) {
//                 fs.rmdir(folderPath, { recursive: true }, (err) => {
//                     if (err) {
//                         console.error('Error deleting folder:', err);
//                     } else {
//                         console.log('Folder deleted successfully! 1');
//                     }
//                 });
//                 }

//             // Create the folder
//                     fs.mkdir(folderPath, { recursive: true }, (err) => {
//                     if (err) {
//                         console.error('Error creating folder:', err);
//                     } else {
//                         console.log('Folder created successfully!');
//                     }
//                     });

//         } catch (err) {
//             console.error(err);
//             return res.status(500).send('Internal Server Error'); // Handle error
//         }

//         try {
//             // Fetch testData from the database based on testNo
//             const testData = await testDataModel.findOne({ testno: testNo });

//             req.session[`test${testNo}`] = testData.words;
//             const wordArray = testData.words;
//             req.session.correctarray = wordArray;
//             const array = Array.from({ length: wordArray.length }, () => 0);
//             req.session.userarray = array;
//         } catch (err) {
//             console.error(err);
//             return res.status(500).send('Internal Server Error'); // Handle error
//         }
//     }

//     console.log(req.session.userarray);

//     var storedTestData = req.session[`test${testNo}`];

//     if (storedTestData) {
//         console.log("from session");
//         wordArray = storedTestData;

//         console.log(wordNo + "  " + wordArray.length);
//         if (wordNo >= wordArray.length) {

//             const audioDirectory = path.join(__dirname, 'audio');
//             const folderPath = path.join(audioDirectory, req.session.Unique_ID);
//             const folderExists = await fs.promises.access(folderPath)
//             .then(() => true)
//             .catch(() => false);

//             // If the folder exists, delete it
//             if (folderExists) {
//             fs.rmdir(folderPath, { recursive: true }, (err) => {
//                 if (err) {
//                     console.error('Error deleting folder:', err);
//                 } else {
//                     console.log('Folder deleted successfully! 2');
//                 }
//             });
//             }





//             const userarray = req.session.userarray;

//             // Calculate the sum of the numbers in the array
//             const sum = userarray.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
//             console.log("tot score" + sum);
            
//             return res.redirect('/test-results');
//         }

//         const currentWord = wordArray[wordNo];
//         return res.render('test', { testNo, wordNo, currentWord, wordArray });
//     } else {
//         console.log("session data has been cleared");
//     }
// });


// app.get('/test/:testNo/:wordNo', async (req, res) => {
//     const testNo = parseInt(req.params.testNo);
//     const wordNo = parseInt(req.params.wordNo);
//     const audioDirectory = path.join(__dirname, 'audio');
//         const folderPath = path.join(audioDirectory, req.session.Unique_ID);
    
//     if (isNaN(testNo) || isNaN(wordNo) || testNo < 0 || wordNo < 0) {
//         return res.status(400).send('Invalid parameters'); // Return response immediately
//     }

//     if (wordNo === 0) {
//         // Assuming 'audio' directory exists in the current directory
        

//         try {
//             // Check if the folder exists


//             fs.access(folderPath, (err) => {
//                 if (err) {
//                     // Folder doesn't exist
//                     console.log("Folder doesn't exist");
//                 } else {
//                     // Folder exists
//                     console.log("Folder exists");
//                     // Delete the folder
//                     fs.rmdir(folderPath, { recursive: true }, (err) => {
//                         if (err) {
//                             console.error('Error deleting folder:', err);
//                         } else {
//                             console.log('Folder deleted successfully!');
//                         }
//                     });
//                 }
//             });


//             // Create the folder
//             fs.mkdir(folderPath, { recursive: true }, (err) => {
//                 if (err) {
//                     console.error('Error creating folder:', err);
//                 } else {
//                     console.log('Folder created successfully!');
//                 }
//             });

            

//         } catch (err) {
//             console.error(err);
//             return res.status(500).send('Internal Server Error'); // Handle error
//         }

//         try {
//             // Fetch testData from the database based on testNo
//             const testData = await testDataModel.findOne({ testno: testNo });

//             req.session[`test${testNo}`] = testData.words;
//             const wordArray = testData.words;
//             req.session.correctarray = wordArray;
//             const array = Array.from({ length: wordArray.length }, () => 0);
//             req.session.userarray = array;
//         } catch (err) {
//             console.error(err);
//             return res.status(500).send('Internal Server Error'); // Handle error
//         }
//     }

//     var storedTestData = req.session[`test${testNo}`];

//     if (storedTestData) {
//         console.log("from session");
//         wordArray = storedTestData;

//         console.log(wordNo + "  " + wordArray.length);
//         if (wordNo >= wordArray.length) {
//             const audioDirectory = path.join(__dirname, 'audio');
//             const folderPath = path.join(audioDirectory, req.session.Unique_ID);
            
//             try {
//                 // Check if the folder exists
//                 fs.access(folderPath, (err) => {
//                     if (err) {
//                         // Folder doesn't exist
//                         console.log("Folder doesn't exist");
//                     } else {
//                         // Folder exists
//                         console.log("Folder exists");
//                         // Delete the folder
//                         fs.rmdir(folderPath, { recursive: true }, (err) => {
//                             if (err) {
//                                 console.error('Error deleting folder:', err);
//                             } else {
//                                 console.log('Folder deleted successfully!');
//                             }
//                         });
//                     }
//                 });
//                 const userarray = req.session.userarray;

//                 // Calculate the sum of the numbers in the array
//                 const sum = userarray.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
//                 console.log("tot score" + sum);
                
//                 return res.redirect('/test-results');
//             } catch (err) {
//                 console.error(err);
//                 return res.status(500).send('Internal Server Error'); // Handle error
//             }
//         }

//         const currentWord = wordArray[wordNo];
//         return res.render('test', { testNo, wordNo, currentWord, wordArray });
//     } else {
//         console.log("session data has been cleared");
//     }
// });


app.get('/test/:testNo/:wordNo', async (req, res) => {
    const testNo = parseInt(req.params.testNo);
    const wordNo = parseInt(req.params.wordNo);

    req.session.wordNo = wordNo;
    req.session.testNo = testNo;


    const audioDirectory = path.join(__dirname, 'audio');
    const folderPath = path.join(audioDirectory, req.session.Unique_ID);

    if (isNaN(testNo) || isNaN(wordNo) || testNo < 0 || wordNo < 0) {
        return res.status(400).send('Invalid parameters'); // Return response immediately
    }

    try {
        if (wordNo === 0) {

        const testData = await testDataModel.findOne({ testno: testNo });

        req.session[`test${testNo}`] = testData.words;
        req.session.audioFolder = folderPath;
        req.session.correctarray = testData.words;
        req.session.userarray = Array.from({ length: testData.words.length }, () => 0);

        // Check if the folder exists
        const folderExists = await fs.promises.access(folderPath)
            .then(() => true)
            .catch(() => false);

        // If the folder exists, delete it
        if (folderExists) {
            await fs.promises.rmdir(folderPath, { recursive: true });
            console.log('Folder deleted successfully!');
        }

        // Create the folder
        await fs.promises.mkdir(folderPath, { recursive: true });
        console.log('Folder created successfully!');

        // Fetch testData from the database based on testNo
        
           
        }


    } catch (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error'); // Handle error
    }

    var storedTestData = req.session[`test${testNo}`];

    if (storedTestData) {
        console.log("from session");
        const wordArray = storedTestData;

        console.log(wordNo + "  " + wordArray.length);
        if (wordNo >= wordArray.length) {


            const folderExists = await fs.promises.access(folderPath)
            .then(() => true)
            .catch(() => false);

        // If the folder exists, delete it
        if (folderExists) {
            await fs.promises.rmdir(folderPath, { recursive: true });
            console.log('Folder deleted successfully!');
        }

        
            const userarray = req.session.userarray;

            // Calculate the sum of the numbers in the array
            const sum = userarray.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            console.log("tot score" + sum);

            return res.redirect('/test-results');
        }

        const currentWord = wordArray[wordNo];
        return res.render('test', { testNo, wordNo, currentWord, wordArray });
    } else {
        console.log("session data has been cleared");
    }
});



// app.get('/test-results' , (req , res)=>{
//     res.render('test-results');

// })


app.get('/test-results', (req, res) => {
    // Pass the userarray as a local variable to the EJS template
    res.render('test-results', { userarray: req.session.userarray , correctarray : req.session.correctarray , testNo : req.session.testNo });
});



    //console.log(testNo + " "+ wordNo);
    // if (isNaN(testNo) || isNaN(wordNo) || testNo < 0 || testNo >= testData.words.length || wordNo < 0 || wordNo >= testData.words.length) {
    //     // Handle invalid parameters, you might want to redirect to an error page or handle it in another way
    //     res.status(400).send('Invalid parameters');
    //     return;
    // }

    // const word = testData.words[wordNo];

    // res.render('testPage', { testNo, wordNo, word });
//});





//admin
//admin
//admin
//admin
//admin


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


app.get('/sample' , (req , res)=>{

    res.render('test', { testNo : 1, wordNo : 1, currentWord : 'gtdf', wordArray:"srgf" });

})


const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));