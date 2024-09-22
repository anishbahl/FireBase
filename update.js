const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firestore instance
const db = admin.firestore();

exports.updatePerson = functions.https.onRequest(async (req, res) => {
    try {
      // Check if the request body contains JSON
      if (!req.is('application/json')) {
        return res.status(400).send('Please send a POST request with JSON data');
      }
      
      // Extract email and courseId from the JSON body
      const { email, courseId } = req.body;
  
      // Validate that both email and courseId are provided
      if (!email || !courseId) {
        return res.status(400).send('Email and courseId are required!');
      }
  
      // Find the person document by email
      const personSnapshot = await db.collection('person').where('email', '==', email).get();

      if (personSnapshot.empty) {
        return res.status(404).send('Person not found');
      }
  
      // Assuming there's only one document with the provided email
      const personDoc = personSnapshot.docs[0];
      const personRef = db.collection('person').doc(personDoc.id);
  
      // Update the person's classes with the new courseId
      await personRef.update({
        courses: admin.firestore.FieldValue.arrayUnion(courseId) // Add courseId to 'classes' array
      });
  
      return res.status(200).send(`Course ${courseId} added to person with email ${email}`);
    } catch (error) {
      console.error('Error updating person:', error);
      return res.status(500).send('Internal Server Error');
    }
});