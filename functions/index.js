const functions = require('firebase-functions');
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

const schema = buildSchema(`
    type User {
        id: ID!
        name: String
        age: Int
    }
    
    type Query {
        hello: String
        user: User
    }
`);

const root = {
    hello: () => {
        return 'Hello World!';
    },
    user: () => {
        return {
            id: 1,
            name: 'Khishigbayar',
            age: 23
        }
    }
}

app.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));



exports.graphql = functions.https.onRequest(app);
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
