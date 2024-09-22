const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firestore instance
const db = admin.firestore();

// Cloud Function to retrieve a meeting from Firestore using an HTTP request (GET)
exports.getMeeting = functions.https.onRequest(async (req, res) => {
  const email = req.params[0]; // Capture email from the URL query parameter, e.g., /getMeeting?email=user@example.com

  if (!email) {
    return res.status(400).json({
      error: {
        message: 'Email is required',
        status: 'invalid-argument',
      },
    });
  }

  try {
    // Search for meetings where the given email is in the persons array
    const meetingsSnapshot = await db.collection('meetings')
      .where('persons', 'array-contains', email)
      .get();

    if (meetingsSnapshot.empty) {
      return res.status(404).json({
        error: {
          message: 'No meetings found for this email',
          status: 'not-found',
        },
      });
    }

    const meetings = [];

    // Iterate over each meeting document
    for (const meetingDoc of meetingsSnapshot.docs) {
      const meetingData = meetingDoc.data();
      const meetingId = meetingDoc.id;

      // Extract meeting details
      const meetingDate = meetingData.date || "Unknown";
      const meetingUrl = meetingData.url || "No URL Provided";

      // Get the list of persons excluding the given email
      const otherPersons = meetingData.persons.filter(person => person.email !== email);


      // Fetch names for the other attendees
      const otherPersonsNames = [];
      for (const personEmail of otherPersons) {
        const personSnapshot = await db.collection('person').where('email', '==', personEmail).get();

        if (!personSnapshot.empty) {
          const personDoc = personSnapshot.docs[0];
          otherPersonsNames.push(personDoc.data().name || "No Name Provided"); // Add the name to the array or 'No Name Provided' if missing
        } else {
          otherPersonsNames.push("No Name Provided"); // If no person found with the email, add default text
        }
      }

      // Add meeting details to the response array
      meetings.push({
        meetingId: meetingId,
        date: meetingDate,
        link: meetingUrl,
        attendees: otherPersonsNames
      });
    }

    return res.status(200).json({ meetings });
  } catch (error) {
    console.error("Error fetching meeting: ", error);
    return res.status(500).json({
      error: {
        message: 'Unable to fetch meeting',
        status: 'internal',
      },
    });
  }
});


// Cloud Function to create a meeting in Firestore using an HTTP request (POST)
exports.createMeeting = functions.https.onRequest(async (req, res) => {
  const { date, personIds, link } = req.body;  // Access request body for meeting data

  // Validate required fields
  if (!date || !personIds || !link) {
    return res.status(400).json({
      error: {
        message: 'All fields (date, personIds, link) are required',
        status: 'invalid-argument',
      },
    });
  }

  try {
    // Generate a new meeting document in the 'meetings' collection
    const meetingRef = db.collection('meetings').doc();  // Firestore auto-generates meeting ID
    const newMeeting = {
      date,
      personIds,  // Array of person IDs attending the meeting
      link,       // Link to the meeting
      createdAt: new Date().toISOString(),
    };

    // Save the meeting to Firestore
    await meetingRef.set(newMeeting);

    // Return success message with the new meeting's ID
    return res.status(201).json({
      message: 'Meeting created successfully',
      meetingId: meetingRef.id,
      meeting: newMeeting,
    });
  } catch (error) {
    console.error("Error creating meeting: ", error);
    return res.status(500).json({
      error: {
        message: 'Unable to create meeting',
        status: 'internal',
      },
    });
  }
});