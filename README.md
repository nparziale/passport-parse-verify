passport-parse-verify
=====================

## Installation
```javascript
$ npm install passport-parse-verify --save
```
## Usage
Just generate a callback for Passport Strategies using VerifyWithParse:
```javascript
passport.use(
	new LinkedInStrategy({
		consumerKey: LINKEDIN_API_KEY
		, consumerSecret: LINKEDIN_SECRET_KEY
		, callbackURL: "http://127.0.0.1:3000/auth/linkedin/callback"
		, passReqToCallback: true
		}
	, VerifyWithParse.verify()
));
```
Note: setting passReqToCallback to true is required to have multiple linked accounts

Serialize and Deserialize saves Parse's sessionToken, and finds a user based on it when deserializing.
```javascript
passport.serializeUser(VerifyWithParse.serializeUser);
passport.deserializeUser(VerifyWithParse.deserializeUser);
```

Finding all user's accounts is as simple as: 
```javascript
app.get('/account', ensureAuthenticated
, function(req, res, next){
	req.user.relation("accounts").query().find()
	.then(function(results){
		req.accounts = results;
		next();
	});
}
, function(req, res){
	var accounts = {};
	_.each(req.accounts, function(account){
		accounts[account.get("provider")] = account.toJSON();
	});
	res.render('account', {
		accounts: accounts
	});
});
```
Note: Code available in examples/ folder.

## Credits

  - [Nicolás Parziale](http://github.com/nparziale)

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2014 Nicolás Parziale