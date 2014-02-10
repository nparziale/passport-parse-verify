// Module dependencies
var _ = require('underscore');
var Buffer = require('buffer').Buffer;

// VerifyWithParse class
function VerifyWithParse(Parse){
	// Create AccountData Parse Class
	// Generalist class for account information (tokens, profile, provider) for all passport strategies
	var AccountData = Parse.Object.extend("AccountData");
	// Verify callback to be used in PassportJS
	this.verify = function(){
		return function(req, token1, token2, profile, done) {
			// Strategy provider name
			var provider = this.name;
			// Callback level definitions of user and accountData
			var user;
			var accountData;
			// Query parse for an AccountData matching the provider and profile.id from the strategy
			var accountDataQuery = new Parse.Query(AccountData)
			.equalTo("provider", provider)
			.equalTo("userId", profile.id.toString())
			.first()
			.then(function(result){
				// if no result is found, create a new AccountData
				if(!(accountData = result)){
					// set ACL only accesible with Master Key
					var acl = new Parse.ACL();
					acl.setPublicReadAccess(false);
					acl.setPublicWriteAccess(false);
					accountData = new AccountData({
						userId: profile.id.toString()
						, provider: provider
					})
					.setACL(acl);
				};
				// save updated tokens and profile
				accountData.set({
					token1: token1
					, token2: token2
					, profile: profile
				});
				return accountData;
			})
			.then(function(accountData){
				// if a user is on the session we are going to link the accounts instead of creating a new one
				if(req.user){
					return req.user;
				};
				// if there's no owner for the accountdata we'll create a new user and sign it up, 
				// we'll use random username and password
				if(!accountData.get("owner")){
					var username = new Buffer(24);
					var password = new Buffer(24);
					_.times(24, function(i) {
						username.set(i, _.random(0, 255));
						password.set(i, _.random(0, 255));
					});
					return new Parse.User()
					.set("username", username.toString('base64'))
					.set("password", password.toString('base64'))
					.signUp();
				}
				return new Parse.Query(Parse.User).get(accountData.get("owner").id);
			})
			.then(function(result){
				user = result;
				// save user as account data owner
				return accountData.save("owner", user);
			})
			.then(function(accountData){
				// create a relation btw user and accountdata on "accounts" user field
				user.relation("accounts").add(accountData);
				return user.save(null, {useMasterKey: true});
			})
			.then(
				function(user){
					return done(null, user);
				}
				, function(error){
					return done(new Error(error.message), null);
				}
			);
		};
	};
	// serialize user's session token
	this.serializeUser = function(user, done){
		done(null, user._sessionToken)
	};
	// find user based on session token
	this.deserializeUser = function(sessionToken, done){
		new Parse.Query(Parse.User)
		.equalTo("sessionToken", sessionToken)
		.first()
		.then(function(user){
			done(null, user);
		}, function(error){
			done(error);
		});
	};
	return this;
}
module.exports = VerifyWithParse;