//Libraries
const functions = require('firebase-functions');
const express = require('express');
const expressGraphQL = require('express-graphql');

//ID
const uuidv4 = require('uuid/v4');

/**--------------------------------------------**/

//GraphQLDataTypes
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

//Express
const app = express();

//Firebase
const admin = require('firebase-admin');
admin.initializeApp();

//ObjectTypes
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
                const userDoc = await admin.firestore().doc(`users/${post.authorID}`).get();
                return userDoc.data()
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


//RootObjectTypes
const RootMutationType = new GraphQLObjectType({
    name: 'Mutation',
    description: 'Үндсэн mutation',
    fields: () => ({
        createUser: {
            type: UserType,
            description: 'Хэрэглэгч үүсгэх үйлдэл',
            args: {
                input: {type: InputUserType}
            },
            resolve: async (parent, args) => {
                const _id = uuidv4();
                const user = {
                    id: _id,
                    ...args.input
                }
                await admin.firestore().collection('users').doc(_id).create(user);
                const createdUser = await admin.firestore().doc(`users/${_id}`).get();
                return createdUser.data()
            }
        },
        updateUser: {
            type: UserType,
            description: 'Хэрэглэгч Засах үйлдэл',
            args: {
                id: {type: GraphQLID},
                input: {type: InputUserType}
            },
            resolve: async (parent, args) => {
                await admin.firestore().doc(`users/${args.id}`).update(args.input);
                const updatedUser =  await admin.firestore().doc(`users/${args.id}`).get();
                return updatedUser.data();
            }
        },
        deleteUser: {
            type: UserType,
            description: 'Хэрэглэгч устгах үйлдэл',
            args: {
                id: {type: GraphQLID}
            },
            resolve: async (parent, args) => {
                const deletedUser =  await admin.firestore().doc(`users/${args.id}`).get();
                await admin.firestore().doc(`users/${args.id}`).delete();
                return deletedUser.data();
            }
        },
        createPost: {
            type: PostType,
            description: "Нийтлэл үүсгэх үйлдэл",
            args: {
                input: {type: InputPostType}
            },
            resolve: async (parent, args) => {
                const _id = uuidv4();
                const post = {
                    id: _id,
                    ...args.input,
                    createdAt: new Date().toISOString()
                }
                await admin.firestore().collection('posts').doc(_id).create(post);
                const createdPost = await admin.firestore().doc(`posts/${_id}`).get();
                return createdPost.data()
            }
        },
        updatePost: {
            type: PostType,
            description: 'Нийтлэл Засах үйлдэл',
            args: {
                id: {type: GraphQLID},
                input: {type: InputPostType}
            },
            resolve: async (parent, args) => {
                await admin.firestore().doc(`posts/${args.id}`).update(args.input);
                const updatedPost =  await admin.firestore().doc(`posts/${args.id}`).get();
                return updatedPost.data();
            }
        },
        deletePost: {
            type: PostType,
            description: 'Нийтлэл устгах үйлдэл',
            args: {
                id: {type: GraphQLID}
            },
            resolve: async (parent, args) => {
                const deletedPost =  await admin.firestore().doc(`posts/${_id}`).get();
                await admin.firestore().doc(`posts/${_id}`).delete();
                return deletedPost.data();
            }
        },
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
                const userDoc = await admin.firestore().doc(`users/${args.id}`).get();
                return userDoc.data()
            }
        },
        post: {
            type: PostType,
            description: 'Нэг нийтлэл',
            args: {
                id: {type: GraphQLID}
            },
            resolve: async (parent, args) => {
                const postDoc = await admin.firestore().doc(`posts/${args.id}`).get();
                return postDoc.data()
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
