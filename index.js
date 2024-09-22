const functions = require('firebase-functions');
const admin = require('firebase-admin');
if (!admin.apps.length) {
    admin.initializeApp();
  }
// Firestore instance
const db = admin.firestore();

const personFunctions = require('./controllers/person');
const meetingFunctions = require('./controllers/meeting');
const courseFunctions = require('./controllers/course');
const courseSearchFunctions = require('./controllers/courseSearch');
const classFunctions = require('./controllers/class');
const updateFunctions = require('./controllers/update');
const reminderFunctions = require('./controllers/reminder');

// Export the functions for Firebase
exports.getPersons = personFunctions.getPersons;
exports.createPersons = personFunctions.createPersons;

exports.getMeeting = meetingFunctions.getMeeting;
exports.createPersons = meetingFunctions.createMeeting;

exports.getCourse = courseFunctions.getCourse;
exports.createCourse = courseFunctions.createCourse;

exports.getCourseSearch = courseSearchFunctions.getStudentCourses;

exports.getClassHw = classFunctions.getCourseHomework;

exports.updatePerson = updateFunctions.updatePerson;
exports.hwDue = reminderFunctions.getHwDue;

exports.hello = functions.https.onRequest((req,res)=>{
    var name = req.body;
    console.log(name);
    res.send(name);
});



