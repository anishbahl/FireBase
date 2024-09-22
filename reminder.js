const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firestore instance
const db = admin.firestore();

exports.getHwDue = functions.https.onRequest(async (req, res) => {
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
      if (!personData.courses ) {
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
      const hwList = [];
      // Filter out non-existing course documents and extract data
      courseDocs.forEach(doc => {
        if (doc.exists) {
          const courseData = doc.data();
          if(email!="BobSmith@gmail.com"){
          coursesArray.push({
            courseId: doc.id,
            courseName: courseData.name 
          });
        }else{
            coursesArray.push({
                courseId: doc.id,
                courseName: courseData.name
              });
        }
        }
      });
      async function fetchAssignment(courseId) {
        // Assuming 'homework' is a Firestore collection where each document contains a map of assignments
        const homeworkSnapshot = await db.collection('homeworks')
          .limit(1)  // Since we are fetching one document that contains a map for all courses, limit the result
          .get();
        
        if (!homeworkSnapshot.empty) {
          const hwDoc = homeworkSnapshot.docs[0]; // Get the first (and only) document
          const hwData = hwDoc.data();
      
          // Check if the courseId exists in the map
          if (hwData.name && hwData.name[courseId] && hwData.due && hwData.due[courseId]) {
            // Extract the assignment name and due date for the given courseId
            if(email!="BobSmith@gmail.com"){
            return {
              assignmentName: hwData.name[courseId],  // Access the name map using courseId
              dueDate: hwData.due[courseId]  // Access the due map using courseId
            };
        }else{
            return {
                assignmentName: hwData.names[courseId],  // Access the name map using courseId
                dueDate: hwData.due[courseId]  // Access the due map using courseId
              };
        }
          } else {
            // Return null if the courseId is not found in the map
            return null;
          }
        } else {
          return null;  // Return null if no document is found
        }
      }
      let temp;
      // Loop through coursesArray and fetch the single assignment for each course
      for (let i = 0; i < coursesArray.length; i++) {
        const course = coursesArray[i];
        
        // Fetch the assignment for the current course
        const assignment = await fetchAssignment(course.courseId);
        temp = assignment;
        if (assignment) {
          // Push the course and assignment details to hwList
          if(email!="BobSmith@gmail.com"){
          hwList.push({
            courseId: course.courseId,
            courseName: course.courseName,
            assignmentName: assignment.assignmentName,
            dueDate: assignment.dueDate
          });
        }else{
            hwList.push({
                courseId: course.courseId,
                courseName: course.courseName,
                assignmentName: assignment.assignmentName,
                dueDate: assignment.dueDate
              });
        }
        }
      }
  // Function to get the top 3 closest dates
const getClosestDates = (hwList) => {
    const today = new Date();
  
    // Convert hwList's dueDate to Date objects and calculate the time difference
    const hwWithDiff = hwList.map(hw => {
      const dueDate = new Date(hw.dueDate); // Convert the dueDate string to Date object
      const diff = Math.abs(dueDate - today); // Calculate difference in time from today
  
      return { ...hw, dueDate: dueDate, diff: diff };
    });
  
    // Sort by the time difference (smallest to largest, closest due dates)
    hwWithDiff.sort((a, b) => a.diff - b.diff);
  
    // Return the top 3 closest homework items
    return hwList.slice(0, 5);
  };
  
  // Now filter the hwList to get the top 3 closest due dates
  const finalHwList = getClosestDates(hwList);
      return res.status(200).json({
        courses: finalHwList
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
  