// services/firebase.ts
// FIX: Use Firebase v8 compat imports to support the namespaced API syntax.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";
import "firebase/compat/functions";
import "firebase/compat/analytics";

let app: firebase.app.App;
let auth: firebase.auth.Auth;
let db: firebase.firestore.Firestore;
let storage: firebase.storage.Storage;
let functions: firebase.functions.Functions;
let analytics: firebase.analytics.Analytics;
let googleProvider: firebase.auth.GoogleAuthProvider;

export const initializeFirebase = (config: object) => {
    if (!firebase.apps.length) {
        app = firebase.initializeApp(config);
        auth = app.auth();
        db = app.firestore();
        storage = app.storage();
        functions = app.functions();
        try {
          analytics = app.analytics();
        } catch (e) {
          console.warn("Firebase Analytics could not be initialized.", e);
        }
        googleProvider = new firebase.auth.GoogleAuthProvider();
    }
};

// These are exported as mutable bindings.
// They will be undefined until initializeFirebase is called.
export { auth, db, storage, functions, analytics, googleProvider };