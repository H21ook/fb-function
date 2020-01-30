const functions = require('firebase-functions');
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

//Firebase
// const admin = require('firebase-admin');

// admin.initializeApp();
//Schema
const schema = buildSchema(`
    type User {
        id: ID!
        name: String!
        age: Int!
    }

    type Query {
        user(id: String): User
    }
`);

const root = {
    user: (params) => {
        console.log(params);
        if(params.id == 1)
            return {
                id: "1",
                name: "Khishigbayar",
                age: 23
            };
        else return null;
    }
}

app.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

    

    

// exports.getPosts = functions.https.onRequest((req, res) => {
//     admin
//     .firestore()
//     .collection('Posts')
//     .get()
//     .then(posts => {
//         return res.json(posts.docs.map((post) => post.data()));
//     }).catch((err) => console.error(err));
// });

// exports.getUsers = functions.https.onRequest((req, res) => {
//     admin
//     .firestore()
//     .collection('Users')
//     .get()
//     .then(users => {
//         return res.json(users.docs.map(user => user.data()))
//     }).catch(err => console.error(err));
// });

exports.graphql = functions.https.onRequest(app);
// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
