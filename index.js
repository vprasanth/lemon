'use strict';

const hapi = require('hapi');
const Joi = require('joi');
const couchdb = require('couchdb-promises');
const Boom = require('boom');

// api server
const server = new hapi.Server();
server.connection({port: 3000});

// db connection
const db = couchdb({
  baseUrl: 'http://localhost:5984',
  requestTimeout: 10000})
const dbName = 'bookmarks'

// GET /

server.route({method: 'GET', path: '/', handler: (request, reply) => {
    db.getInfo()
    .then(data => {
        reply(data);
    })
    .catch(err => {
        reply(Boom.badImplementation('terrible implementation',  err));
    });
}});

// GET bookmark

server.route({method: 'GET', path: '/api/bookmark/{id}', handler: (request, reply) => {
    db.getDocument(dbName, request.params.id)
    .then(data => {
        reply(data.data);
    })
    .catch(err => {
        reply(Boom.badImplementation('terrible implementation',  err));
    })
}});

// POST bookmark

server.route({method: 'POST', path: '/api/bookmark', config: {
    validate: {
        payload: {
            name: Joi.string().required(),
            url: Joi.string().required(),
            tags: Joi.array().items(Joi.string())
        }
    }, 
    handler: (request, reply) => {
        db.createDocument(dbName, Object.assign({created: Date.now()}, request.payload))
        .then(data => {
            reply({id: data.data.id});
        })
        .catch(err => {
            reply(Boom.badImplementation('terrible implementation',  err));
        });
    }
}});

// DELETE bookmark

server.route({method: 'DELETE', path: '/api/bookmark/{id}/{rev}', handler: (request, reply) => {
    db.deleteDocument(dbName, request.params.id, request.params.rev)
    .then(data => {
        reply(data.data);
    })
    .catch(err => {
        reply(Boom.badImplementation('terrible implementation',  err));
    })
}});

// GET bookmarks

server.route({method: 'GET', path: '/api/bookmarks', handler: (request, reply) => {
    db.getAllDocuments(dbName, {descending: true,include_docs: true})
    .then(data => {
        reply(data.data.rows);
    })
    .catch(err => {
        reply(Boom.badImplementation('terrible implementation',  err));
    })
}});

// create or use db and start server
// @todo clean this up
db.getDatabaseHead(dbName)
.then(info => {
    startServer(info);
})
.catch(err =>{
    if(err.status == 400){
        console.log(`Creating ${dbName}...`);
        db.createDatabase(dbName)
        .then(info => {
            startServer(info);
        })
        .catch(err => {
            console.log(err);
        });
    }
});

function startServer(info){
    server.start((err)=> {
        if(err) throw err;
        console.log('server up', info);
    });
}
