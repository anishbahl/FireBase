const functions = require('firebase-functions');
const admin = require('firebase-admin');


// Firestore instance
const db = admin.firestore();

exports.getCourse = functions.https.onRequest(async (req, res) => {
  // Get the courseId from the URL parameters
  const courseId = req.params[0]; // or `req.params.courseId` if using a named parameter
  
  // Check if courseId is provided
  if (!courseId) {
    return res.status(400).json({
      error: {
        message: 'Course ID is required',
        status: 'INVALID_ARGUMENT',
      },
    });
  }

  try {
    const courseRef = db.collection('courses').doc(courseId);
    const courseDoc = await courseRef.get();

    if (!courseDoc.exists) {
      return res.status(404).json({
        error: {
          message: 'Course not found',
          status: 'not-found',
        },
      });
    }

    return res.status(200).json({ 
      courseId: courseDoc.id, // Add the course ID
      course: courseDoc.data() // Include the course data
    });
  } catch (error) {
    console.error("Error fetching course: ", error);
    return res.status(500).json({
      error: {
        message: 'Unable to fetch course',
        status: 'internal',
      },
    });
  }
});

// Cloud Function to create a course in Firestore using an HTTP request (POST)
exports.createCourse = functions.https.onRequest(async (req, res) => {
  const { name, instructorIds, studentIds, parentIds } = req.body;  // AccessCode is not needed

  // Validate required fields
  if (!name || !instructorIds || !studentIds || !parentIds) {
    return res.status(400).json({
      error: {
        message: 'All fields (name, instructorIds, studentIds, parentIds) are required',
        status: 'INVALID_ARGUMENT',
      },
    });
  }

  try {
    // Generate a new course document in the 'courses' collection
    const courseRef = db.collection('courses').doc();  // Firestore auto-generates course ID
    const newCourse = {
      name,
      instructorIds,  // Array of instructor IDs
      studentIds,     // Array of student IDs
      parentIds,      // Array of parent IDs
      accessCode: courseRef.id,  // Use courseId as the access code
      createdAt: new Date().toISOString(),
    };

    // Save the course to Firestore
    await courseRef.set(newCourse);

    // Return success message with the new course's ID
    return res.status(201).json({
      message: 'Course created successfully',
      courseId: courseRef.id,   // This is also the access code
      course: newCourse,
    });
  } catch (error) {
    console.error("Error creating course: ", error);
    return res.status(500).json({
      error: {
        message: 'Unable to create course',
        status: 'internal',
      },
    });
  }
});
