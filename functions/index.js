const functions = require('firebase-functions');
const express = require('express');
const expressGraphQL = require('express-graphql');
const uuidv4 = require('uuid/v4');

const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLNonNull,
    GraphQLID,
    GraphQLInt,
    GraphQLString,
    GraphQLList,
    GraphQLInputObjectType
} = require('graphql');

const app = express();

//Firebase
const admin = require('firebase-admin');
admin.initializeApp();

//Types
const PostType = new GraphQLObjectType({
    name: 'Post',
    description: 'Нийтлэл',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        text: {type: GraphQLNonNull(GraphQLString)},
        authorID: {type: GraphQLNonNull(GraphQLID)},
        author: {
            type: UserType,
            resolve: async (post) => {
                const usersCollection = await admin.firestore().collection('users').where('id', '==', post.authorID).get();
                return usersCollection.docs.length > 0 ? usersCollection.docs[0].data() : null
            }
        },
        createdAt: {type: GraphQLNonNull(GraphQLString)}
    })
});

const UserType = new GraphQLObjectType({
    name: 'User',
    description: 'Хэрэгэлэгч',
    fields: () => ({
        id: {type: GraphQLNonNull(GraphQLID)},
        name: {type: GraphQLNonNull(GraphQLString)},
        age: {type: GraphQLInt},
        posts: {
            type: GraphQLList(PostType),
            resolve: async (user) => {
                const postsCollection = await admin.firestore().collection('posts').where('authorID', '==', user.id).get();
                return postsCollection.docs.map(postDoc => postDoc.data());
            }
        }
    })
});

const InputUserType = new GraphQLInputObjectType({
    name: 'InputUser',
    description: 'Хэрэглэгч үүсгэх model',
    fields: () => ({
        name: {type: GraphQLNonNull(GraphQLString)},
        age: {type: GraphQLNonNull(GraphQLInt)}
    })
});

const InputPostType = new GraphQLInputObjectType({
    name: 'InputPost',
    description: 'Нийтлэл үүсгэх model',
    fields: () => ({
        text: {type: GraphQLNonNull(GraphQLString)},
        authorID: {type: GraphQLNonNull(GraphQLID)}
    })
});

const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Үндсэн mutation',
    fields: () => ({
        saveUser: {
            type: UserType,
            description: 'Хэрэглэгч хадгалах үйлдэл',
            args: {
                input: {type: InputUserType}
            },
            resolve: async (parent, args) => {
                const user = {
                    id: uuidv4(),
                    name: args.input.name,
                    age: args.input.age
                }

                const createdUserDoc = await admin.firestore().collection('users').add(user);
                const createdUser = await createdUserDoc.get();
                return createdUser.data();
            }
        },
        savePost: {
            type: PostType,
            description: "Нийтлэл хадгалах үйлдэл",
            args: {
                input: {type: InputPostType}
            },
            resolve: async (parent, args) => {
                const post = {
                    id: uuidv4(),
                    text: args.input.text,
                    authorID: args.input.authorID,
                    createdAt: new Date().toISOString()
                }
                const createdPostDoc = await admin.firestore().collection('posts').add(post);
                
                const createdPost = await createdPostDoc.get();
                return createdPost.data();
            }
        }
    })
})

const RootQueryType = new GraphQLObjectType({
    name: 'Query',
    description: 'Үндсэн query',
    fields: {
        users: {
            type: new GraphQLList(UserType),
            description: "Бүх хэрэглэгчийн жагсаалт",
            resolve: async () => {
                const usersCollection = await admin.firestore().collection('users').get();
                return usersCollection.docs.map(userDoc => userDoc.data());
            },
        },
        posts: {
            type:  new GraphQLList(PostType),
            description: "Бүх нийтлэлийн жагсаалт",
            resolve: async () => {
                const postsCollection = await admin.firestore().collection('posts').get();
                return postsCollection.docs.map(postDoc => postDoc.data());
            },
        },
        user: {
            type: UserType,
            description: 'Нэг хэрэглэгч',
            args: {
                id: {type: GraphQLID}
            },
            resolve: async (parent, args) => {
                const usersCollection = await admin.firestore().collection('users').where('id', '==', args.id).get();
                return usersCollection.docs.length > 0 ? usersCollection.docs[0].data() : null
            }
        },
        post: {
            type: PostType,
            description: 'Нэг нийтлэл',
            args: {
                id: {type: GraphQLID}
            },
            resolve: async (parent, args) => {
                const postsCollection = await admin.firestore().collection('posts').where('id', '==', args.id).get();
                return postsCollection.docs.length > 0 ? postsCollection.docs[0].data() : null
            }
        }
    }
})

const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType
})

app.use('/', expressGraphQL({
    schema: schema,
    graphiql: true
}));

exports.graphql = functions.https.onRequest(app);
