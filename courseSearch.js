const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firestore instance
const db = admin.firestore();

// Cloud Function to retrieve courses based on student email
exports.getStudentCourses = functions.https.onRequest(async (req, res) => {
    const email = req.params[0]; // Capture email from the URL path
  
    if (!email) {
      return res.status(400).json({
        error: {
          message: 'Email is required',
          status: 'INVALID_ARGUMENT',
        },
      });
    }
  
    try {
      // Search for the student by email in the 'person' collection
      const personSnapshot = await db.collection('person').where('email', '==', email).get();
  
      if (personSnapshot.empty) {
        return res.status(404).json({
          error: {
            message: 'Student not found',
            status: 'not-found',
          },
        });
      }
  
      // Assuming only one student per email
      const personDoc = personSnapshot.docs[0];
      const personData = personDoc.data();
  
      // Check if the student has a list of course IDs
      if (!personData.courses || !Array.isArray(personData.courses)) {
        return res.status(404).json({
          error: {
            message: 'No courses found for this student',
            status: 'not-found',
          },
        });
      }
  
      // Array of course IDs
      const courseIds = personData.courses;
  
      // Fetch each course document based on the course IDs in the person's document
      const coursePromises = courseIds.map(courseId => db.collection('courses').doc(courseId).get());
      const courseDocs = await Promise.all(coursePromises);
  
      // Array to hold objects with courseId, courseNumber, and courseName
      const coursesArray = [];
  
      // Filter out non-existing course documents and extract data
      courseDocs.forEach(doc => {
        if (doc.exists) {
          const courseData = doc.data();
          if(email!="BobSmith@gmail.com"){
          coursesArray.push({
            courseId: doc.id,
            courseName: courseData.name || "Unknown", // Use 'Unknown' if the courseName is not available
            url: courseData.url
          });
        }else{
            coursesArray.push({
                courseId: doc.id,
                courseName: courseData.names|| "Unknown", // Use 'Unknown' if the courseName is not available
                url: courseData.url
              });
        }
        }
      });
  
      return res.status(200).json({
        courses: coursesArray
      });
    } catch (error) {
      console.error("Error fetching student courses: ", error);
      return res.status(500).json({
        error: {
          message: 'Unable to fetch courses',
          status: 'internal',
        },
      });
    }
  });
  