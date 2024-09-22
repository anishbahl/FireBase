const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firestore instance
const db = admin.firestore();


// Cloud Function to retrieve a person from Firestore using an HTTP request (GET)
exports.getPersons = functions.https.onRequest(async (req, res) => {
  const email = req.params[0]; // Capture the email from the URL path

  if (!email) {
    console.log(req);
    return res.status(400).json({
      error: {
        message: 'Email is required.',
        status: 'invalid-argument',
      },
    });
  }

  try {
    // Search for the person by email in the 'person' collection
    const personSnapshot = await db.collection('person').where('email', '==', email).get();

    if (personSnapshot.empty) {
      return res.status(404).json({
        error: {
          message: 'Person not found.',
          status: 'not-found',
        },
      });
    }

    // Assuming there's only one person per email
    const personDoc = personSnapshot.docs[0];
    const personData = personDoc.data();

    return res.status(200).json({ person: personData });
  } catch (error) {
    console.error("Error fetching person: ", error);
    return res.status(500).json({
      error: {
        message: 'Unable to fetch person.',
        status: 'internal',
      },
    });
  }
});

// Cloud Function to create a person in Firestore using an HTTP request (POST)
exports.createPersons = functions.https.onRequest(async (req, res) => {
  const { name, dateOfBirth, number, email, role, courseIds } = req.body;  // Get details from the request body

  // Validate required fields
  if (!name || !dateOfBirth || !number || !email || !role || (role !== "instructor" && !courseIds)) {
    return res.status(400).json({
      error: {
        message: 'All fields (name, dateOfBirth, number, email, role, courseIds) are required.',
        status: 'invalid-argument',
      },
    });
  }

  try {
    // Create a new person document in the 'person' collection
    const personRef = db.collection('person').doc(); // Generate new person ID
    const newPerson = {
      name,
      dateOfBirth,
      number,
      email,
      role,
      courseIds: role === 'instructor' ? [] : courseIds, // If role is instructor, courseIds is optional
      createdAt: new Date().toISOString(),
    };

    // Save the person to Firestore
    await personRef.set(newPerson);

    // Return success message with the new person's ID
    return res.status(201).json({
      message: 'Person created successfully',
      personId: personRef.id,
      person: newPerson,
    });
  } catch (error) {
    console.error("Error creating person: ", error);
    return res.status(500).json({
      error: {
        message: 'Unable to create person.',
        status: 'internal',
      },
    });
  }
});
