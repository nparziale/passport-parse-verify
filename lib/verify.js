var _ = require('underscore');
var Buffer = require('buffer').Buffer;

function VerifyWithParse(Parse){
	var AccountData = Parse.Object.extend("AccountData");
	this.verify = function(){
		return function(req, token1, token2, profile, done) {
			var provider = this.name;
			var columnName = provider+"AuthData";
			var user;
			var accountData;
			var accountDataQuery = new Parse.Query(AccountData)
			.equalTo("provider", provider)
			.equalTo("userId", profile.id.toString())
			.first()
			.then(function(result){
				if(!(accountData = result)){
					var acl = new Parse.ACL();
					acl.setPublicReadAccess(false);
					acl.setPublicWriteAccess(false);
					accountData = new AccountData({
						userId: profile.id.toString()
						, provider: provider
					})
					.setACL(acl);
				};
				accountData.set({
					token1: token1
					, token2: token2
					, profile: profile
				});
				return accountData;
			})
			.then(function(accountData){
				if(req.user){
					return req.user;
				}
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
				return accountData.save("owner", user);
			})
			.then(function(accountData){
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
	this.serializeUser = function(user, done){
		done(null, user._sessionToken)
	};
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