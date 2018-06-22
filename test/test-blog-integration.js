'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {BlogPost} = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

function seedBlogData(){
	console.info('seeding blog data');
	const seedData = [];

	for(let i=1;i<=10;i++){
		seedData.push(generateBlogData());
	}
	return BlogPost.insertMany(seedData);
}

function generateBlogData(){
	return{
		title: faker.lorem.words(),
		content : faker.lorem.lines(),
		author:{
			firstName: faker.name.firstName(),
			lastName: faker.name.lastName()
		}
	};
}

function tearDownDb(){
	console.warn('Deleting database');
	return mongoose.connection.dropDatabase();
}

describe('Restaurants API resource', function(){

	before(function(){
		return runServer(TEST_DATABASE_URL);
	});

	beforeEach(function(){
		return seedBlogData();
	});

	afterEach(function(){
		return tearDownDb();
	});

	after(function(){
		return closeServer();
	});

	describe('GET endpoint', function(){
		it('should return all existing blogposts', function(){

			let res;
			return chai.request(app)
				.get('/posts')
				.then(function(_res){
					//console.dir(_res.body);
					res = _res;
					expect(res).to.have.status(200);
					expect(res.body).to.have.lengthOf.at.least(1);
					return BlogPost.count();
				})
				.then(function(count){
					expect(res.body).to.have.lengthOf(count);
				});
		});

		it('should return blogposts with right fields', function(){
			let resBlogpost;
			return chai.request(app)
				.get('/posts')
				.then(function(res){
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					expect(res.body).to.be.a('array');
					expect(res.body).to.have.lengthOf.at.least(1);

					res.body.forEach(function(blogpost){
						expect(blogpost).to.be.a('object');
						expect(blogpost).to.include.keys('title','content','author','created');
					});
						resBlogpost = res.body[0];
						return BlogPost.findById(resBlogpost.id);
				})
				.then(function(post){
					//console.dir(post);
					expect(resBlogpost.id).to.equal(post.id);
					expect(resBlogpost.title).to.equal(post.title);
					expect(resBlogpost.content).to.equal(post.content);
					expect(resBlogpost.author).to.contain(post.author.firstName);
					//expect(resBlogpost.created).to.equal(post.created);
				});
		});
	}); // GET endpoint

	describe('Post endpoint', function(){
		it('should add a new restaurant', function(){
			const newBlogpost = generateBlogData();

			return chai.request(app)
			.post('/posts')
			.send(newBlogpost)
			.then(function(res){
				expect(res).to.have.status(201);
				expect(res).to.be.json;
				expect(res.body).to.be.a('object');
				expect(res.body).to.include.keys('title', 'content', 'author');
				expect(res.body.title).to.equal(newBlogpost.title);
				expect(res.body.id).to.not.be.null;
				expect(res.body.content).to.equal(newBlogpost.content);
				expect(res.body.author).to.equal(newBlogpost.author.firstName + ' ' + newBlogpost.author.lastName);
				return BlogPost.findById(res.body.id);
			})
			.then(function(post){
				//console.dir(post);
				expect(post.title).to.equal(newBlogpost.title);
				expect(post.content).to.equal(newBlogpost.content);
				expect(post.author.firstName).to.equal(newBlogpost.author.firstName);
				expect(post.author.lastName).to.equal(newBlogpost.author.lastName);
			});
		})
	}); //PoST endpoint

	describe('PUT endpoint', function(){
		it('should update fields you send over', function(){
			const updateData = {
				title: "new upadated title",
				content: "New new nwe new new new new"
			}

			return BlogPost
			.findOne()
			.then(function(blogpost){
				updateData.id = blogpost.id;

				return chai.request(app)
				.put(`/posts/${blogpost.id}`)
				.send(updateData);
			})
			.then(function(res){
				expect(res).to.have.status(204);
				return BlogPost.findById(updateData.id);
			})
			.then(function(post){
				expect(post.title).to.equal(updateData.title);
				expect(post.content).to.equal(updateData.content);
			});
		});
		
	}); //PUT endpoint

	describe('DELETE endpoint', function(){
		it('delete a blogpost by id', function(){
			let blogpost;
			return BlogPost
			.findOne()
			.then(function(post){
				blogpost = post;
				return chai.request(app)
				.delete(`/posts/${blogpost.id}`);
			})
			.then(function(res){
				expect(res).to.have.status(204);
				return BlogPost.findById(blogpost.id);
			})
			.then(function(post){
				expect(post).to.be.null;
			});
		});
	}); // DELETE endpoint

});// first describe