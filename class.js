const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firestore instance
const db = admin.firestore();

exports.getCourseHomework = functions.https.onRequest(async (req, res) => {
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
      // Reference to the 'homeworks' collection
      const homeworkRef = db.collection('homeworks');
      
      // Fetch both 'hw2' and 'hw3' documents from the 'homeworks' collection
      const hw2Doc = await homeworkRef.doc('hw2').get();
      const hw3Doc = await homeworkRef.doc('hw3').get();
  
      // Return the homework details
      return res.status(200).json({
        courseId: courseId, 
        homework1: {name: hw2Doc.data().name[courseId],names: hw2Doc.data().names[courseId], due :hw2Doc.data().due[courseId], info:hw2Doc.data().info[courseId],infos:hw2Doc.data().infos[courseId], progress:hw2Doc.data().progress },
        homework2: {name: hw3Doc.data().name[courseId],names: hw3Doc.data().names[courseId], due :hw3Doc.data().due[courseId],info:hw3Doc.data().info[courseId],infos:hw3Doc.data().infos[courseId], progress:hw3Doc.data().progress }
      });
    } catch (error) {
      console.error("Error fetching homework: ", error);
      return res.status(500).json({
        error: {
          message: 'Unable to fetch homework',
          status: 'internal',
        },
      });
    }
});