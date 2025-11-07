import React from 'react';

const FirestoreWarning: React.FC = () => {
    const rules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow logged-in users to read public content
    match /articles/{articleId} {
      allow read: if request.auth != null;
    }
    match /meditations/{meditationId} {
      allow read: if request.auth != null;
    }

    // Allow admins to write public content (requires isAdmin flag in user doc)
    // match /articles/{articleId} {
    //   allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    // }
    // match /meditations/{meditationId} {
    //   allow write: if request.auth != null && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    // }

    // Allow users to subscribe to specialists
    match /specialists_subscriptions/{userId} {
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
    `;

    return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg my-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8.257 3.099c.626-1.129 2.251-1.129 2.877 0l7.22 12.997A1.75 1.75 0 0116.914 19H3.086a1.75 1.75 0 01-1.439-2.904l7.22-12.997zM9 10a1 1 0 112 0v2a1 1 0 11-2 0v-2zm2 5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-semibold text-yellow-800">Firestore Not Configured</h3>
                    <div className="mt-2 text-sm text-yellow-700">
                        <p>The application is connected to Firebase, but it seems the Firestore security rules are not set up to allow reading public content like Articles and Meditations.</p>
                        <p className="mt-2">To fix this and use the live database, please update your <strong>firestore.rules</strong> file in the Firebase console with the following rules:</p>
                        <pre className="mt-2 p-3 bg-gray-800 text-white rounded-md text-xs overflow-x-auto">
                            <code>
                                {rules.trim()}
                            </code>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FirestoreWarning;